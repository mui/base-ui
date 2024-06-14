import { TransitionStatus } from '../../utils/useTransitionStatus';
import { BaseUIComponentProps } from '../../utils/types';

export interface DialogBackdropProps extends BaseUIComponentProps<'div', DialogBackdropOwnerState> {
  /**
   * If `true`, the backdrop element is kept in the DOM when closed.
   *
   * @default false
   */
  keepMounted?: boolean;
}

export interface DialogBackdropOwnerState {
  open: boolean;
  modal: boolean;
  transitionStatus: TransitionStatus;
}

export interface UseDialogBackdropParams {
  /**
   * If `true`, the dialog supports CSS-based animations and transitions.
   * It is kept in the DOM until the animation completes.
   */
  animated: boolean;
  /**
   * Determines if the dialog is open.
   */
  open: boolean;
  /**
   * The ref to the background element.
   */
  ref: React.Ref<HTMLElement>;
  /**
   * Callback to invoke when the backdrop is mounted.
   */
  onMount: () => void;
  /**
   * Callback to invoke when the backdrop is unmounted.
   */
  onUnmount: () => void;
}

export interface UseDialogBackdropReturnValue {
  /**
   * Resolver for the root element props.
   */
  getRootProps: (externalProps?: Record<string, any>) => Record<string, any>;
  /**
   * Determines if the dialog should be mounted even if closed (as the exit animation is still in progress).
   */
  mounted: boolean;
  /**
   * The current transition status of the dialog.
   */
  transitionStatus: TransitionStatus;
}
