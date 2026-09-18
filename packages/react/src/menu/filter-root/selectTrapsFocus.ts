import { REASONS } from '../../internals/reasons';
import type { State as MenuStoreState } from '../store/MenuStore';

/**
 * Whether a filterable popup traps focus like a modal dialog: a modal top-level filter root opened
 * by keyboard or a fine pointer. Hover, touch, and assistive-technology clicks (which report no
 * pointer type) leave focus free. Submenus never trap; their parent's trap contains them.
 */
export function selectTrapsFocus(state: MenuStoreState<unknown>) {
  return (
    state.parent.type === undefined &&
    (state.modal ?? true) &&
    state.openChangeReason !== REASONS.triggerHover &&
    state.openMethod !== 'touch' &&
    state.openMethod !== ''
  );
}
