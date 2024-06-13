import { TransitionStatus } from '../../utils/useTransitionStatus';
import { BaseUIComponentProps } from '../../utils/types';

export interface AlertDialogBackdropProps
  extends BaseUIComponentProps<'div', AlertDialogBackdropOwnerState> {
  /**
   * If `true`, the dialog supports CSS-based animations and transitions.
   * It is kept in the DOM until the animation completes.
   *
   * @default true
   */
  animated?: boolean;
  /**
   * If `true`, the backdrop element is kept in the DOM when closed.
   *
   * @default false
   */
  keepMounted?: boolean;
}

export interface AlertDialogBackdropOwnerState {
  open: boolean;
  transitionStatus: TransitionStatus;
}
