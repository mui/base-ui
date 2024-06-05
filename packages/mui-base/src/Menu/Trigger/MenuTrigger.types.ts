export interface MenuTriggerProps {
  children?: React.ReactNode;
  /**
   * Class name applied to the root element.
   */
  className?: string;
  /**
   * If `true`, the component is disabled.
   * @default false
   */
  disabled?: boolean;
  /**
   * If `true`, allows a disabled button to receive focus.
   * @default false
   */
  focusableWhenDisabled?: boolean;
  /**
   * Label of the button
   */
  label?: string;
}

export type MenuTriggerOwnerState = MenuTriggerProps & {
  active: boolean;
  focusableWhenDisabled: boolean;
  open: boolean;
};
