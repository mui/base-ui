import { INTERACTIVE_ELEMENT_SELECTOR } from '../isInteractiveElement';
import { getComposedParentElement } from './utils';

// Native controls that own pointer gestures but are not covered by the shared
// focus-oriented selector, plus ARIA widgets that may be implemented without a
// native focusable element.
const DRAG_INTERACTIVE_ADDITIONS_SELECTOR = [
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

const DRAG_INTERACTIVE_ELEMENT_SELECTOR = `${INTERACTIVE_ELEMENT_SELECTOR},${DRAG_INTERACTIVE_ADDITIONS_SELECTOR}`;

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
    if (node.matches(DRAG_INTERACTIVE_ELEMENT_SELECTOR) && !node.matches(':disabled')) {
      return true;
    }
  }
  return false;
}
