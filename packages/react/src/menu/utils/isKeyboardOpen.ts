import { REASONS } from '../../internals/reasons';
import { isKeyboardClick } from '../../utils/popups/store';

/**
 * Whether a menu opens from the keyboard, which lands focus in the popup. Arrow keys report
 * `list-navigation`; Enter and Space dispatch a click carrying no pointer detail.
 */
export function isKeyboardOpen(reason: string | null, event: Event | undefined): boolean {
  return reason === REASONS.listNavigation || isKeyboardClick(reason, event);
}
