import { ownerWindow } from '@base-ui/utils/owner';
import { isInteractiveElement } from '../isInteractiveElement';
import { getComposedParentElement } from './utils';

// Native controls that own pointer gestures but are not covered by the shared
// focus-oriented selector, plus ARIA widgets that may be implemented without a
// native focusable element.
const DRAG_INTERACTIVE_ELEMENT_SELECTOR = [
  'label',
  'summary',
  'audio[controls]',
  'video[controls]',
  '[role="checkbox"]',
  '[role="combobox"]',
  '[role="listbox"]',
  '[role="menuitem"]',
  '[role="menuitemcheckbox"]',
  '[role="menuitemradio"]',
  '[role="option"]',
  '[role="radio"]',
  '[role="slider"]',
  '[role="spinbutton"]',
  '[role="switch"]',
  '[role="tab"]',
  '[role="textbox"]',
].join(',');

function isDragInteractiveElement(element: Element): boolean {
  return isInteractiveElement(element) || element.matches(DRAG_INTERACTIVE_ELEMENT_SELECTOR);
}

// Input types that never take text or arrow-key interaction: focusing one
// mid-drag (a selection checkbox refocused after a re-render, a toolbar button)
// must not cancel the drag any more than focusing a `<button>` element would.
// Text types and `range` (arrows drive it) stay editable.
const NON_EDITABLE_INPUT_TYPES = new Set([
  'button',
  'checkbox',
  'color',
  'file',
  'hidden',
  'image',
  'radio',
  'reset',
  'submit',
]);

/**
 * Whether `node` accepts text input (or arrow-key interaction), so focusing it
 * mid-drag should hand keys back rather than let the sensor swallow them.
 * Realm-safe via `ownerWindow`.
 */
export function isEditable(node: Element): boolean {
  const win = ownerWindow(node);
  if (node instanceof win.HTMLInputElement) {
    return !NON_EDITABLE_INPUT_TYPES.has(node.type) && !node.readOnly && !node.disabled;
  }
  if (node instanceof win.HTMLTextAreaElement) {
    return !node.readOnly && !node.disabled;
  }
  // A `<select>` owns arrows (change the option) and Space (open the listbox),
  // so a drag that kept swallowing them would make a focused select inert.
  if (node instanceof win.HTMLSelectElement) {
    return !node.disabled;
  }
  return node instanceof win.HTMLElement && node.isContentEditable;
}

/**
 * Whether the press landed on an interactive control nested *inside* the node the
 * gesture would pick up by — a rename input, a row's action button — rather than
 * on that node itself. `pickupNode` is excluded from the walk, so a draggable (or
 * handle) that is itself a `<button>` stays draggable.
 */
export function hasInteractiveAncestorWithin(target: Element, pickupNode: Element): boolean {
  for (
    let node: Element | null = target;
    node !== null && node !== pickupNode;
    node = getComposedParentElement(node)
  ) {
    if (isDragInteractiveElement(node) && !node.matches(':disabled')) {
      return true;
    }
  }
  return false;
}
