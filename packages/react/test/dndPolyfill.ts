/**
 * DnD test polyfill: a JSDOM / Vitest browser-mode drop-in replacement for
 * `DragEvent` so `fireEvent.drag*` works consistently across environments.
 *
 * Installed by calling `installDndPolyfill()` (idempotent). Nothing is
 * patched at import time, so non-drag suites that share a barrel with this
 * module keep the native constructor.
 */

let polyfillInstalled = false;

/** Install the DnD polyfill. Idempotent; call before dispatching drag events. */
export function installDndPolyfill(): void {
  if (polyfillInstalled) {
    return;
  }
  polyfillInstalled = true;
  polyfillDragEvent();
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
