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

/** Whether `test` holds for `target` or a composed ancestor strictly below `pickupNode`. */
function someNodeBelow(
  target: Element,
  pickupNode: Element,
  test: (node: Element) => boolean,
): boolean {
  for (
    let node: Element | null = target;
    node !== null && node !== pickupNode;
    node = getComposedParentElement(node)
  ) {
    if (test(node)) {
      return true;
    }
  }
  return false;
}

/**
 * Whether the press landed on an interactive control nested inside `pickupNode`, such
 * as a rename input. `pickupNode` itself isn't checked, so a `<button>` handle works.
 */
export function hasInteractiveAncestorWithin(target: Element, pickupNode: Element): boolean {
  return someNodeBelow(
    target,
    pickupNode,
    (node) => node.matches(DRAG_INTERACTIVE_ELEMENT_SELECTOR) && !node.matches(':disabled'),
  );
}

/**
 * Whether an element between the press target and `pickupNode` holds capture for
 * `pointerId`, meaning a nested widget claimed the gesture (such as a scroll-area thumb,
 * which has no interactive role). Pass `includeTarget: false` for touch and pen: they
 * implicitly capture the press target, so its capture can't tell a widget from the browser.
 */
export function hasCapturingAncestorWithin(
  target: Element,
  pickupNode: Element,
  pointerId: number,
  includeTarget: boolean,
): boolean {
  return someNodeBelow(
    target,
    pickupNode,
    // Optional-chained because jsdom has no pointer capture.
    (node) => (includeTarget || node !== target) && node.hasPointerCapture?.(pointerId) === true,
  );
}
