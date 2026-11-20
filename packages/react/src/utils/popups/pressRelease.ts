import { contains, getTarget } from '@base-ui/utils/shadowDom';
import { isMouseWithinBounds } from '../getPseudoElementBounds';

/**
 * Whether the `mouseup` ending the press that opened a popup landed inside the trigger (with a
 * small tolerance for pointer drift) or the popup, in which case the open shouldn't be canceled.
 */
export function isPressReleasedInside(
  event: MouseEvent,
  trigger: HTMLElement,
  positioner: Element | null | undefined,
  list?: Element | null,
) {
  const target = getTarget(event) as Element | null;
  return (
    contains(trigger, target) ||
    contains(positioner, target) ||
    contains(list, target) ||
    isMouseWithinBounds(event, trigger)
  );
}
