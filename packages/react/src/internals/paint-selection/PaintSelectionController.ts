import { getOverflowAncestors, isHTMLElement } from '@floating-ui/utils/dom';
import { contains } from '@base-ui/utils/shadowDom';
import { ownerDocument, ownerWindow } from '@base-ui/utils/owner';

export interface PaintSelectionItem {
  /** Logical identity, independent of recycled DOM nodes. */
  id: unknown;
  getState: () => { checked: boolean; disabled: boolean };
}

type Point = { x: number; y: number };

/** A scoped mouse/pen gesture controller. It has no React or selection-model dependency. */
export class PaintSelectionController<Item extends PaintSelectionItem> {
  private items = new Map<HTMLElement, Item>();
  private cleanup: (() => void) | undefined;

  constructor(
    private readonly paint: (items: Item[], checked: boolean, event: PointerEvent) => void,
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
    const visited = new Set<unknown>();
    const origin = { x: event.clientX, y: event.clientY };
    let previous = origin;
    let painting = false;
    let finished = false;
    const pointerId = event.pointerId;

    const self = this;
    function stop() {
      doc.removeEventListener('pointermove', move);
      doc.removeEventListener('pointerup', up);
      doc.removeEventListener('pointercancel', cancel);
      doc.removeEventListener('selectstart', preventSelection);
      doc.removeEventListener('dragstart', preventSelection);
      win.removeEventListener('blur', cancel);
      finished = true;
    }
    function cleanup() {
      stop();
      doc.removeEventListener('click', click, true);
      doc.removeEventListener('pointerdown', cleanup, true);
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
      if (!painting) {
        painting = true;
        element.focus({ preventScroll: true });
      }
      nativeEvent.preventDefault();
      const crossed: Item[] = [];
      const add = (item: Item) => {
        if (!visited.has(item.id) && !item.getState().disabled) {
          visited.add(item.id);
          crossed.push(item);
        }
      };
      if (first && self.items.get(element) === first && element.isConnected) {
        add(first);
      }
      for (const [node, item] of self.items) {
        if (
          !node.isConnected ||
          ownerDocument(node) !== doc ||
          visited.has(item.id) ||
          item.getState().disabled
        ) {
          continue;
        }
        const rect = node.getBoundingClientRect();
        if (!intersect(previous, point, rect)) {
          continue;
        }
        const hit = intersect(previous, point, getVisibleRect(node, rect));
        if (!hit) {
          continue;
        }
        // Hit-test in the node's own root, including shadow roots, to exclude clipped/covered items.
        const nodeRoot = node.getRootNode() as Document | ShadowRoot;
        const target = nodeRoot.elementFromPoint(hit.x, hit.y);
        if (target && contains(node, target)) {
          add(item);
        }
      }
      previous = point;
      if (crossed.length) {
        self.paint(crossed, checked, nativeEvent);
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
    doc.addEventListener('pointermove', move, { passive: false });
    doc.addEventListener('pointerup', up);
    doc.addEventListener('pointercancel', cancel);
    doc.addEventListener('selectstart', preventSelection);
    doc.addEventListener('dragstart', preventSelection);
    doc.addEventListener('click', click, true);
    doc.addEventListener('pointerdown', cleanup, true);
    win.addEventListener('blur', cancel);
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
function getVisibleRect(node: HTMLElement, rect: DOMRect): DOMRect {
  const win = ownerWindow(node);
  let left = Math.max(0, rect.left);
  let top = Math.max(0, rect.top);
  let right = Math.min(win.innerWidth, rect.right);
  let bottom = Math.min(win.innerHeight, rect.bottom);
  for (const ancestor of getOverflowAncestors(node)) {
    if (!isHTMLElement(ancestor)) {
      continue;
    }
    const bounds = ancestor.getBoundingClientRect();
    const style = win.getComputedStyle(ancestor);
    const scaleX = ancestor.offsetWidth ? bounds.width / ancestor.offsetWidth : 1;
    const scaleY = ancestor.offsetHeight ? bounds.height / ancestor.offsetHeight : 1;
    const x = bounds.left + ancestor.clientLeft * scaleX;
    const y = bounds.top + ancestor.clientTop * scaleY;
    if (/auto|scroll|hidden|clip/.test(style.overflowX)) {
      left = Math.max(left, x);
      right = Math.min(right, x + ancestor.clientWidth * scaleX);
    }
    if (/auto|scroll|hidden|clip/.test(style.overflowY)) {
      top = Math.max(top, y);
      bottom = Math.min(bottom, y + ancestor.clientHeight * scaleY);
    }
  }
  return new win.DOMRect(left, top, Math.max(0, right - left), Math.max(0, bottom - top));
}
