import {
  getParentNode,
  isHTMLElement,
  isLastTraversableNode,
  isOverflowElement,
} from '@floating-ui/utils/dom';
import { AnimationFrame } from '@base-ui/utils/useAnimationFrame';
import { ownerDocument, ownerWindow } from '@base-ui/utils/owner';

/** How close to an edge of the scrolling container the pointer starts to scroll it, in pixels. */
const SCROLL_EDGE_SIZE = 40;
/** The scrolling speed with the pointer at the edge or past it, in pixels per millisecond. */
const MAX_SCROLL_SPEED = 0.375;
/** The longest time a frame scrolls for, so a stalled page doesn't jump when it resumes. */
const MAX_FRAME_DURATION = 50;

export interface SelectionPaintingParameters {
  getListElement: () => HTMLElement | null;
  /** Called when the pointer enters the selection toggle of another item during a drag. */
  paint: (index: number, selected: boolean, event: PointerEvent) => void;
}

interface Gesture {
  pointerId: number;
  /** The state the pressed item got, which every item the pointer crosses gets too. */
  selected: boolean;
  /** The item whose toggle is under the pointer. It's painted once, when the pointer enters. */
  index: number | null;
  lastEvent: PointerEvent;
  /** Where the pointer went down. An edge only scrolls once the pointer moved toward it. */
  startX: number;
  startY: number;
  /** The container that scrolls when the pointer nears its edge. */
  scroller: Element | null;
  scrollFrame: number | null;
  lastFrameTime: number | null;
  /** The fractions of a pixel that the previous frames didn't scroll by. */
  scrollRemainderX: number;
  scrollRemainderY: number;
  stop: () => void;
}

/**
 * Selection painting: after a press on an item's selection toggle, dragging over the toggles of
 * other items gives them the state the pressed item got.
 *
 * A touch pointer keeps targeting the element it went down on, so the toggle under the pointer is
 * found from its coordinates rather than from the events' targets.
 */
export class SelectionPainting {
  declare private readonly parameters: SelectionPaintingParameters;

  private readonly toggles = new Map<Element, number>();

  private gesture: Gesture | null = null;

  /**
   * Set when a press on a selection toggle already changed the selection, so the click that
   * follows it doesn't change it again.
   */
  skipClick = false;

  constructor(parameters: SelectionPaintingParameters) {
    this.parameters = parameters;
  }

  /** Makes a selection toggle a target of the drag. Returns a function that removes it. */
  registerToggle(element: Element, index: number) {
    this.toggles.set(element, index);
    return () => {
      this.toggles.delete(element);
    };
  }

  /** Whether a drag is in progress. */
  isActive() {
    return this.gesture !== null;
  }

  /** Starts a drag from the item at `index`, which the press just gave the `selected` state. */
  start(index: number, selected: boolean, event: PointerEvent) {
    this.stop();
    const listElement = this.parameters.getListElement();
    if (!listElement) {
      return;
    }

    const doc = ownerDocument(listElement);
    const pointerId = event.pointerId;

    const handleMove = (moveEvent: PointerEvent) => {
      const gesture = this.gesture;
      if (!gesture || moveEvent.pointerId !== pointerId) {
        return;
      }
      gesture.lastEvent = moveEvent;
      // A fast pointer can cross a toggle between two events, so every position the browser
      // recorded since the last event is tested.
      const samples = moveEvent.getCoalescedEvents?.() ?? [];
      if (samples.length === 0) {
        this.paintAt(moveEvent.clientX, moveEvent.clientY);
      } else {
        for (const sample of samples) {
          this.paintAt(sample.clientX, sample.clientY);
        }
      }
      this.requestScrollFrame();
    };

    // The list can scroll under a pointer that isn't moving, such as with the mouse wheel.
    const handleScroll = () => {
      const lastEvent = this.gesture?.lastEvent;
      if (lastEvent) {
        this.paintAt(lastEvent.clientX, lastEvent.clientY);
      }
    };

    const handleEnd = (endEvent: PointerEvent) => {
      if (endEvent.pointerId === pointerId) {
        this.stop();
      }
    };

    doc.addEventListener('pointermove', handleMove);
    doc.addEventListener('pointerup', handleEnd);
    doc.addEventListener('pointercancel', handleEnd);
    doc.addEventListener('scroll', handleScroll, { capture: true, passive: true });

    this.gesture = {
      pointerId,
      selected,
      index,
      lastEvent: event,
      startX: event.clientX,
      startY: event.clientY,
      scroller: getScroller(listElement),
      scrollFrame: null,
      lastFrameTime: null,
      scrollRemainderX: 0,
      scrollRemainderY: 0,
      stop() {
        if (this.scrollFrame !== null) {
          AnimationFrame.cancel(this.scrollFrame);
        }
        doc.removeEventListener('pointermove', handleMove);
        doc.removeEventListener('pointerup', handleEnd);
        doc.removeEventListener('pointercancel', handleEnd);
        doc.removeEventListener('scroll', handleScroll, { capture: true });
      },
    };
  }

  /** Ends the drag. The items it painted keep their state. */
  stop() {
    this.gesture?.stop();
    this.gesture = null;
  }

  /**
   * Scrolls the container on every frame while the pointer is near one of its edges or past it,
   * faster the closer it gets, so the drag can reach the items that are out of view.
   */
  private requestScrollFrame() {
    const gesture = this.gesture;
    if (!gesture || gesture.scrollFrame !== null || !gesture.scroller) {
      return;
    }
    if (getScrollVelocity(gesture, 'x') === 0 && getScrollVelocity(gesture, 'y') === 0) {
      gesture.lastFrameTime = null;
      return;
    }

    gesture.scrollFrame = AnimationFrame.request((time) => {
      const { scroller, lastEvent } = gesture;
      gesture.scrollFrame = null;
      if (this.gesture !== gesture || !scroller) {
        return;
      }

      const duration =
        gesture.lastFrameTime === null
          ? 0
          : Math.min(time - gesture.lastFrameTime, MAX_FRAME_DURATION);
      gesture.lastFrameTime = time;

      const distanceX = getScrollVelocity(gesture, 'x') * duration + gesture.scrollRemainderX;
      const distanceY = getScrollVelocity(gesture, 'y') * duration + gesture.scrollRemainderY;
      const scrollX = Math.trunc(distanceX);
      const scrollY = Math.trunc(distanceY);
      gesture.scrollRemainderX = distanceX - scrollX;
      gesture.scrollRemainderY = distanceY - scrollY;

      if (scrollX !== 0 || scrollY !== 0) {
        const { scrollLeft, scrollTop } = scroller;
        scroller.scrollBy({ left: scrollX, top: scrollY, behavior: 'instant' });
        // The container reached its end. The next pointer move tries again.
        if (scroller.scrollLeft === scrollLeft && scroller.scrollTop === scrollTop) {
          gesture.lastFrameTime = null;
          return;
        }
        this.paintAt(lastEvent.clientX, lastEvent.clientY);
      }
      this.requestScrollFrame();
    });
  }

  private paintAt(clientX: number, clientY: number) {
    const gesture = this.gesture;
    const listElement = this.parameters.getListElement();
    if (!gesture || !listElement) {
      return;
    }

    const index = this.toggleIndexAt(listElement, clientX, clientY);
    if (index === gesture.index) {
      return;
    }
    gesture.index = index;
    if (index !== null) {
      this.parameters.paint(index, gesture.selected, gesture.lastEvent);
    }
  }

  /** The position of the item whose selection toggle is at a point, or `null`. */
  private toggleIndexAt(listElement: HTMLElement, clientX: number, clientY: number) {
    const root = listElement.getRootNode() as Document | ShadowRoot;
    let element: Element | null = root.elementFromPoint?.(clientX, clientY) ?? null;
    while (element && element !== listElement) {
      const index = this.toggles.get(element);
      if (index !== undefined) {
        return index;
      }
      element = element.parentElement;
    }
    return null;
  }
}

/** The nearest container that the list scrolls in, which can be the list itself. */
function getScroller(listElement: HTMLElement): Element | null {
  let node: Node = listElement;
  while (!isLastTraversableNode(node)) {
    if (
      isHTMLElement(node) &&
      isOverflowElement(node) &&
      (node.scrollHeight > node.clientHeight || node.scrollWidth > node.clientWidth)
    ) {
      return node;
    }
    node = getParentNode(node);
  }
  return ownerDocument(listElement).scrollingElement;
}

/**
 * How fast the container scrolls along an axis, in pixels per millisecond. Negative toward the top
 * or the left, and `0` when the pointer isn't near an edge it moved toward.
 */
function getScrollVelocity(gesture: Gesture, axis: 'x' | 'y') {
  const scroller = gesture.scroller;
  if (!scroller) {
    return 0;
  }

  const vertical = axis === 'y';
  const position = vertical ? gesture.lastEvent.clientY : gesture.lastEvent.clientX;
  const start = vertical ? gesture.startY : gesture.startX;
  const clientSize = vertical ? scroller.clientHeight : scroller.clientWidth;

  // The page scrolls in the viewport, not in the box of its scrolling element.
  let min = 0;
  let max = clientSize;
  if (scroller !== ownerDocument(scroller).scrollingElement) {
    const rect = scroller.getBoundingClientRect();
    min = vertical ? rect.top : rect.left;
    max = vertical ? rect.bottom : rect.right;
    // The container can be partly outside the viewport, where the pointer can't reach its edge.
    const win = ownerWindow(scroller);
    min = Math.max(min, 0);
    max = Math.min(max, vertical ? win.innerHeight : win.innerWidth);
  }

  const depthAtEnd = position - (max - SCROLL_EDGE_SIZE);
  if (position > start && depthAtEnd > 0) {
    return Math.min(depthAtEnd / SCROLL_EDGE_SIZE, 1) * MAX_SCROLL_SPEED;
  }

  const depthAtStart = min + SCROLL_EDGE_SIZE - position;
  if (position < start && depthAtStart > 0) {
    return -Math.min(depthAtStart / SCROLL_EDGE_SIZE, 1) * MAX_SCROLL_SPEED;
  }

  return 0;
}
