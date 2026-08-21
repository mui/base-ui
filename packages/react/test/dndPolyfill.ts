/**
 * DnD test polyfills: JSDOM / Vitest browser-mode drop-in replacements for
 * `DOMRect` and `DragEvent` so `fireEvent.drag*` works consistently across
 * environments.
 *
 * Installed by calling `installDndPolyfill()` (idempotent). Nothing is
 * patched at import time, so non-drag suites that share a barrel with this
 * module keep the native constructors.
 */

let polyfillInstalled = false;

/** Install the DnD polyfills. Idempotent; call before dispatching drag events. */
export function installDndPolyfill(): void {
  if (polyfillInstalled) {
    return;
  }
  polyfillInstalled = true;
  polyfillDOMRect();
  polyfillDragEvent();
  polyfillElementFromPoint();
}

// ---------------------------------------------------------------------------
// DOMRect polyfill (JSDOM does not provide DOMRect)
// ---------------------------------------------------------------------------

function polyfillDOMRect() {
  if (typeof window === 'undefined' || window.DOMRect) {
    return;
  }

  class DOMRectPolyfill {
    x: number;
    y: number;
    width: number;
    height: number;
    top: number;
    right: number;
    bottom: number;
    left: number;

    constructor(x = 0, y = 0, width = 0, height = 0) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
      this.top = height < 0 ? y + height : y;
      this.right = width < 0 ? x : x + width;
      this.bottom = height < 0 ? y : y + height;
      this.left = width < 0 ? x + width : x;
    }

    toJSON() {
      return this;
    }

    static fromRect(rect?: {
      x?: number | undefined;
      y?: number | undefined;
      width?: number | undefined;
      height?: number | undefined;
    }) {
      return new DOMRectPolyfill(rect?.x, rect?.y, rect?.width, rect?.height);
    }
  }

  (window as any).DOMRect = DOMRectPolyfill;
}

// ---------------------------------------------------------------------------
// DragEvent polyfill
// ---------------------------------------------------------------------------

function polyfillDragEvent() {
  if (typeof window === 'undefined') {
    return;
  }
  // JSDOM has no `DragEvent` constructor, so `fireEvent.drag*` would fall back
  // to a coordinate-less base event there. The engine is pointer-based: the
  // native→synthetic bridge in dnd.ts reads only `clientX`/`clientY` and the
  // modifier keys off drag events, all provided by the `MouseEvent` base.
  // Nothing reads `dataTransfer`; it is pinned to `null` only so the event
  // still duck-types as a `DragEvent`.
  class DragEventPolyfill extends MouseEvent {
    dataTransfer: DataTransfer | null = null;

    constructor(type: string, eventInitDict: DragEventInit = {}) {
      super(type, eventInitDict);
    }
  }

  (window as any).DragEvent = DragEventPolyfill;
}

// Polyfill document.elementFromPoint for auto-scroll (returns null in JSDOM)
function polyfillElementFromPoint() {
  if (typeof document !== 'undefined' && typeof document.elementFromPoint !== 'function') {
    document.elementFromPoint = () => null;
  }
}
