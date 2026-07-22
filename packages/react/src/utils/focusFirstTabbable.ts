import { tabbable } from '../floating-ui-react/utils/tabbable';

/**
 * Focuses the first tabbable element inside the container, falling back to the given element.
 * Kept out of `usePopupViewport` so that components without tabbable popup content
 * (such as Tooltip) do not bundle the tabbable machinery.
 */
export function focusFirstTabbable(container: HTMLElement, fallback: HTMLElement | null) {
  (tabbable(container)[0] ?? fallback)?.focus();
}
