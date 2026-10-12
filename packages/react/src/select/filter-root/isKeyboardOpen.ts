import { REASONS } from '../../internals/reasons';

/**
 * A keyboard open is the one that lands focus in the popup, so the input shows its focus ring.
 * Arrow keys report `list-navigation`; Enter and Space dispatch a click carrying no pointer detail.
 */
export function isKeyboardOpen(details: {
  reason: string | null;
  event: Event | undefined;
}): boolean {
  if (details.reason === REASONS.listNavigation) {
    return true;
  }
  return (
    (details.reason === REASONS.triggerPress || details.reason === REASONS.itemPress) &&
    (details.event as MouseEvent | undefined)?.detail === 0
  );
}
