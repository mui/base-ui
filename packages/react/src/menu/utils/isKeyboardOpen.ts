import { REASONS } from '../../internals/reasons';

/**
 * Keyboard and assistive-technology activations produce `detail === 0` clicks; mouse-gesture
 * clicks (including the synthesized drag-release click from `useMenuItemCommonProps`) carry
 * `detail >= 1`.
 */
export function isKeyboardClick(reason: string | null, event: Event | undefined): boolean {
  return (
    (reason === REASONS.triggerPress || reason === REASONS.itemPress) &&
    (event as MouseEvent | undefined)?.detail === 0
  );
}

/**
 * Whether a menu opens from the keyboard, which lands focus in the popup. Arrow keys report
 * `list-navigation`; Enter and Space dispatch a click carrying no pointer detail.
 */
export function isKeyboardOpen(reason: string | null, event: Event | undefined): boolean {
  return reason === REASONS.listNavigation || isKeyboardClick(reason, event);
}
