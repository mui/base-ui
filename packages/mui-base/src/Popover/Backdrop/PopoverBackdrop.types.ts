import type { BaseUIComponentProps } from '../../utils/types';

export type PopoverBackdropOwnerState = {
  open: boolean;
};

export interface PopoverBackdropProps
  extends BaseUIComponentProps<'div', PopoverBackdropOwnerState> {
  /**
   * If `true`, the backdrop remains mounted when the popover content is closed.
   * @default false
   */
  keepMounted?: boolean;
  /**
   * The container element to which the backdrop is appended to.
   * @default false
   */
  container?: HTMLElement | null | React.MutableRefObject<HTMLElement | null>;
}
