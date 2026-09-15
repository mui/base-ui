let pointerFocusInProgress = false;

/**
 * Focuses an element because the pointer entered its popup. An enclosing popup sees the focus
 * event while this runs and knows that focus follows the pointer, so it may reclaim it later.
 */
export function focusByPointer(element: HTMLElement) {
  pointerFocusInProgress = true;
  try {
    element.focus({ preventScroll: true });
  } finally {
    pointerFocusInProgress = false;
  }
}

export function isPointerFocusInProgress() {
  return pointerFocusInProgress;
}
