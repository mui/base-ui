import { TYPEABLE_SELECTOR } from '../floating-ui-react/utils/constants';

export const INTERACTIVE_ELEMENT_SELECTOR = `button,a[href],[role="button"],select,[tabindex]:not([tabindex="-1"]),${TYPEABLE_SELECTOR}`;

/** Whether this exact element is an interactive control. */
export function isInteractiveElement(element: Element): boolean {
  return element.matches(INTERACTIVE_ELEMENT_SELECTOR);
}
