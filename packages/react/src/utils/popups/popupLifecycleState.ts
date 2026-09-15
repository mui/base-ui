import type { TransitionStatus } from '../../internals/useTransitionStatus';

// Render through React context; the store copy remains for detached triggers and interactions.
export interface PopupLifecycleState {
  open: boolean;
  mounted: boolean;
  transitionStatus: TransitionStatus;
}

export const DEFAULT_POPUP_LIFECYCLE_STATE: PopupLifecycleState = {
  open: false,
  mounted: false,
  transitionStatus: undefined,
};
