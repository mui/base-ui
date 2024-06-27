import type { BaseUIComponentProps } from '../../utils/types';

export type HoverCardBackdropOwnerState = {
  open: boolean;
};

export interface HoverCardBackdropProps
  extends BaseUIComponentProps<'div', HoverCardBackdropOwnerState> {
  /**
   * Whether the `Backdrop` remains mounted when the Hover Card `Popup` is closed.
   * @default false
   */
  keepMounted?: boolean;
  /**
   * The element the `Backdrop` is appended to.
   */
  container?: HTMLElement | null | React.MutableRefObject<HTMLElement | null>;
}
