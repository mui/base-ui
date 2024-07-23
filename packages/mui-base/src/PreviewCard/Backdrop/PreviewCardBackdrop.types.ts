import type { BaseUIComponentProps } from '../../utils/types';

export type PreviewCardBackdropOwnerState = {
  open: boolean;
};

export interface PreviewCardBackdropProps
  extends BaseUIComponentProps<'div', PreviewCardBackdropOwnerState> {
  /**
   * Whether the `Backdrop` remains mounted when the Preview Card `Popup` is closed.
   * @default false
   */
  keepMounted?: boolean;
  /**
   * The element the `Backdrop` is appended to.
   */
  container?: HTMLElement | null | React.MutableRefObject<HTMLElement | null>;
}
