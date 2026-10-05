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
 * Whether `test` holds for `target` or one of its composed ancestors below
 * `pickupNode`. The walk stops before `pickupNode`.
 */
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
 * Whether the press landed on an interactive control nested inside `pickupNode`,
 * such as a rename input or a row's action button. The walk stops before
 * `pickupNode`, so a draggable or handle that is itself a `<button>` stays draggable.
 */
export function hasInteractiveAncestorWithin(target: Element, pickupNode: Element): boolean {
  return someNodeBelow(
    target,
    pickupNode,
    (node) => node.matches(DRAG_INTERACTIVE_ELEMENT_SELECTOR) && !node.matches(':disabled'),
  );
}

/**
 * Whether an element between the press target and `pickupNode` holds pointer
 * capture for `pointerId`, meaning a nested widget claimed the gesture during
 * the press. A slider or scroll-area thumb has no interactive role for
 * {@link hasInteractiveAncestorWithin} to find, but it takes capture on
 * `pointerdown`. The walk stops before `pickupNode`, like the interactive check.
 *
 * Pass `includeTarget: false` for touch and pen, which implicitly capture the
 * press target. Its capture then can't tell a widget from the browser.
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
