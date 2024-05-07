export interface TooltipGroupProps {
  children?: React.ReactNode;
  /**
   * The delay in milliseconds until tooltips within the group are open.
   * @default 0
   */
  delay?: number;
  /**
   * The delay in milliseconds until the tooltip content is closed.
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
