export interface TooltipProviderProps {
  children?: React.ReactNode;
  /**
   * The delay in milliseconds until tooltips within the group are open.
   * @default 0
   */
  delay?: number;
  /**
   * he delay in milliseconds until tooltips within the group are closed.
   * @default 0
   */
  closeDelay?: number;
  /**
   * The timeout in milliseconds until the grouping logic is no longer active after the last tooltip
   * in the group has closed.
   * @default 400
   */
  timeout?: number;
}
