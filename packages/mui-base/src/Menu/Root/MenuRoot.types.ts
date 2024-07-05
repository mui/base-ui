export type MenuOrientation = 'vertical' | 'horizontal';
export type MenuDirection = 'ltr' | 'rtl';

export interface MenuRootProps {
  children: React.ReactNode;
  /**
   * If `true`, the dropdown is initially open.
   */
  defaultOpen?: boolean;
  /**
   * Callback fired when the component requests to be opened or closed.
   */
  onOpenChange?: (open: boolean, event: Event | undefined) => void;
  /**
   * Allows to control whether the dropdown is open.
   * This is a controlled counterpart of `defaultOpen`.
   */
  open?: boolean;
  orientation?: MenuOrientation;
  dir?: MenuDirection;
  disabled?: boolean;
}
