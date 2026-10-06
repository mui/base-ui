import { getOverflowAncestors, isHTMLElement } from '@floating-ui/utils/dom';
import { addEventListener } from '@base-ui/utils/addEventListener';
import { mergeCleanups } from '@base-ui/utils/mergeCleanups';
import { contains } from '@base-ui/utils/shadowDom';
import { ownerDocument, ownerWindow } from '@base-ui/utils/owner';

export interface PaintSelectionItem {
  /** Logical identity, independent of recycled DOM nodes. */
  id: unknown;
  /** `selected` preserves the model value when the checkbox display is mixed or derived. */
  getState: () => { checked: boolean; selected: boolean; disabled: boolean };
}

export interface PaintSelectionChange<Item> {
  item: Item;
  checked: boolean;
  /** Whether the pointer retraced past the item, so `checked` restores its state from before the gesture. */
  restored: boolean;
}

type Point = { x: number; y: number };

/** A scoped mouse/pen gesture controller. It has no React or selection-model dependency. */
export class PaintSelectionController<Item extends PaintSelectionItem> {
  private items = new Map<HTMLElement, Item>();
  private cleanup: (() => void) | undefined;

  constructor(
    private readonly paint: (
      changes: PaintSelectionChange<Item>[],
      event: PointerEvent,
      anchor: Item,
    ) => void,
    /** Called once a gesture stops painting, so state kept across its samples can be released. */
    private readonly end?: () => void,
  ) {}

  register(element: HTMLElement, item: Item) {
    this.items.set(element, item);
    return () => {
      if (this.items.get(element) === item) {
        this.items.delete(element);
      }
    };
  }

  start(element: HTMLElement, event: PointerEvent) {
    const first = this.items.get(element);
    if (
      !first ||
      first.getState().disabled ||
      event.defaultPrevented ||
      event.button !== 0 ||
      event.isPrimary === false ||
      (event.pointerType !== 'mouse' && event.pointerType !== 'pen') ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey
    ) {
      return;
    }
    this.cleanup?.();
    const doc = ownerDocument(element);
    const win = ownerWindow(element);
    const checked = !first.getState().checked;
    const initialSelection = new Map<unknown, boolean>();
    const trail: Item[] = [];
    const trailIndices = new Map<unknown, number>();
    const origin = { x: event.clientX, y: event.clientY };
    let previous = origin;
    let painting = false;
    let finished = false;
    const pointerId = event.pointerId;

    const self = this;
    const removeGestureListeners = mergeCleanups(
      addEventListener(doc, 'pointermove', move, { passive: false }),
      addEventListener(doc, 'pointerup', up),
      addEventListener(doc, 'pointercancel', cancel),
      addEventListener(doc, 'selectstart', preventSelection),
      addEventListener(doc, 'dragstart', preventSelection),
      addEventListener(win, 'blur', cancel),
    );
    const removeClickGuard = mergeCleanups(
      addEventListener(doc, 'click', click, true),
      addEventListener(doc, 'pointerdown', cleanup, true),
    );
    function stop() {
      if (finished) {
        return;
      }
      removeGestureListeners();
      finished = true;
      self.end?.();
    }
    function cleanup() {
      stop();
      removeClickGuard();
      if (self.cleanup === cleanup) {
        self.cleanup = undefined;
      }
    }
    function cancel(nativeEvent: Event) {
      if ('pointerId' in nativeEvent && nativeEvent.pointerId !== pointerId) {
        return;
      }
      cleanup();
    }
    function preventSelection(nativeEvent: Event) {
      nativeEvent.preventDefault();
    }
    function click(nativeEvent: MouseEvent) {
      if (painting && nativeEvent.detail !== 0) {
        nativeEvent.preventDefault();
        nativeEvent.stopPropagation();
      }
      cleanup();
    }
    function move(nativeEvent: PointerEvent) {
      if (nativeEvent.pointerId !== pointerId || finished) {
        return;
      }
      if (nativeEvent.buttons % 2 === 0) {
        cleanup();
        return;
      }
      const point = { x: nativeEvent.clientX, y: nativeEvent.clientY };
      if (!painting && Math.hypot(point.x - origin.x, point.y - origin.y) < 4) {
        return;
      }
      const starting = !painting;
      if (starting) {
        painting = true;
        element.focus({ preventScroll: true });
      }
      nativeEvent.preventDefault();
      const changes = new Map<unknown, PaintSelectionChange<Item>>();
      const visit = (item: Item) => {
        const index = trailIndices.get(item.id);
        if (index === undefined) {
          trailIndices.set(item.id, trail.length);
          trail.push(item);
          changes.set(item.id, { item, checked, restored: false });
        } else {
          for (const removed of trail.splice(index + 1)) {
            trailIndices.delete(removed.id);
            const original = initialSelection.get(removed.id);
            if (original !== undefined && !removed.getState().disabled) {
              changes.set(removed.id, { item: removed, checked: original, restored: true });
            }
          }
        }
      };
      if (
        starting &&
        first &&
        self.items.get(element) === first &&
        element.isConnected &&
        !first.getState().disabled
      ) {
        initialSelection.set(first.id, first.getState().selected);
        visit(first);
      }
      const clippingBounds = new Map<HTMLElement, DOMRect>();
      const crossed: { item: Item; hit: Point }[] = [];
      for (const [node, item] of self.items) {
        if (!node.isConnected || ownerDocument(node) !== doc) {
          continue;
        }
        const index = trailIndices.get(item.id);
        if (index !== undefined) {
          trail[index] = item;
        }
        const state = item.getState();
        if (starting || !initialSelection.has(item.id)) {
          initialSelection.set(item.id, state.selected);
        }
        if (state.disabled) {
          continue;
        }
        const rect = node.getBoundingClientRect();
        if (!intersect(previous, point, rect)) {
          continue;
        }
        const hit = intersect(previous, point, getVisibleRect(node, rect, clippingBounds));
        if (!hit) {
          continue;
        }
        // Hit-test in the node's own root, including shadow roots, to exclude clipped/covered items.
        const nodeRoot = node.getRootNode() as Document | ShadowRoot;
        const target = nodeRoot.elementFromPoint(hit.x, hit.y);
        if (target && contains(node, target)) {
          crossed.push({ item, hit });
        }
      }
      // Registration order can differ from the order the pointer crosses the checkboxes.
      const distance = (hit: Point) => (hit.x - previous.x) ** 2 + (hit.y - previous.y) ** 2;
      crossed.sort((a, b) => distance(a.hit) - distance(b.hit));
      const seen = new Set<unknown>();
      for (const { item } of crossed) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          visit(item);
        }
      }
      previous = point;
      if (changes.size) {
        self.paint([...changes.values()], nativeEvent, trail[trail.length - 1]);
      }
    }
    function up(nativeEvent: PointerEvent) {
      if (nativeEvent.pointerId !== pointerId) {
        return;
      }
      stop();
      if (!painting) {
        cleanup();
      }
      // Retain only the click guard until the trailing click or next pointerdown.
    }
    this.cleanup = cleanup;
  }

  dispose = () => {
    this.cleanup?.();
  };

  disposeEffect = () => this.dispose;
}

/** Midpoint of the segment inside a rectangle, or null when they do not intersect. */
function intersect(a: Point, b: Point, rect: DOMRect): Point | null {
  if (rect.width <= 0 || rect.height <= 0) {
    return null;
  }
  let start = 0;
  let end = 1;
  for (const [position, delta, min, max] of [
    [a.x, b.x - a.x, rect.left, rect.right],
    [a.y, b.y - a.y, rect.top, rect.bottom],
  ]) {
    if (delta === 0) {
      if (position < min || position > max) {
        return null;
      }
    } else {
      const t1 = (min - position) / delta;
      const t2 = (max - position) / delta;
      start = Math.max(start, Math.min(t1, t2));
      end = Math.min(end, Math.max(t1, t2));
      if (start > end) {
        return null;
      }
    }
  }
  const t = (start + end) / 2;
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

/** Clip the hit area before sampling it so partly visible checkboxes remain paintable. */
function getVisibleRect(
  node: HTMLElement,
  rect: DOMRect,
  clippingBounds: Map<HTMLElement, DOMRect>,
): DOMRect {
  const win = ownerWindow(node);
  let left = Math.max(0, rect.left);
  let top = Math.max(0, rect.top);
  let right = Math.min(win.innerWidth, rect.right);
  let bottom = Math.min(win.innerHeight, rect.bottom);
  for (const ancestor of getOverflowAncestors(node)) {
    if (!isHTMLElement(ancestor)) {
      continue;
    }
    let clip = clippingBounds.get(ancestor);
    if (!clip) {
      const bounds = ancestor.getBoundingClientRect();
      const style = win.getComputedStyle(ancestor);
      const scaleX = ancestor.offsetWidth ? bounds.width / ancestor.offsetWidth : 1;
      const scaleY = ancestor.offsetHeight ? bounds.height / ancestor.offsetHeight : 1;
      const x = bounds.left + ancestor.clientLeft * scaleX;
      const y = bounds.top + ancestor.clientTop * scaleY;
      const clipX = /auto|scroll|hidden|clip/.test(style.overflowX);
      const clipY = /auto|scroll|hidden|clip/.test(style.overflowY);
      clip = new win.DOMRect(
        clipX ? x : 0,
        clipY ? y : 0,
        clipX ? ancestor.clientWidth * scaleX : win.innerWidth,
        clipY ? ancestor.clientHeight * scaleY : win.innerHeight,
      );
      clippingBounds.set(ancestor, clip);
    }
    left = Math.max(left, clip.left);
    right = Math.min(right, clip.right);
    top = Math.max(top, clip.top);
    bottom = Math.min(bottom, clip.bottom);
  }
  return new win.DOMRect(left, top, Math.max(0, right - left), Math.max(0, bottom - top));
}
