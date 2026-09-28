import { INTERACTIVE_ELEMENT_SELECTOR } from '../../floating-ui-react/utils/constants';
import { getComposedParentElement } from './utils';

// Extends the shared focus selector with native controls that handle their own
// pointer gestures, and with ARIA widgets that may lack a native focusable element.
const DRAG_INTERACTIVE_ELEMENT_SELECTOR = [
  INTERACTIVE_ELEMENT_SELECTOR,
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

/**
 * Whether the press landed on an interactive control nested inside `pickupNode`,
 * such as a rename input or a row's action button. The walk stops before
 * `pickupNode`, so a draggable or handle that is itself a `<button>` stays draggable.
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
