export interface CollapsibleContextValue extends UseCollapsibleRootReturnValue {
  ownerState: Pick<UseCollapsibleRootReturnValue, 'open' | 'disabled'>;
}

export type CollapsibleRootOwnerState = Pick<CollapsibleContextValue, 'open' | 'disabled'>;

export interface CollapsibleRootProps extends UseCollapsibleRootParameters {
  children: React.ReactNode;
}

export interface UseCollapsibleRootParameters {
  /**
   * If `true`, the Collapsible is initially open.
   * This is the controlled counterpart of `defaultOpen`.
   */
  open?: boolean;
  /**
   * If `true`, the Collapsible is initially open.
   * This is the uncontrolled counterpart of `open`.
   * @default true
   */
  defaultOpen?: boolean;
  /**
   * Callback fired when the Collapsible is opened or closed.
   */
  onOpenChange?: (open: boolean) => void;
  /**
   * If `true`, the component is disabled.
   * @default false
   */
  disabled?: boolean;
}

export interface UseCollapsibleRootReturnValue {
  contentId: React.HTMLAttributes<Element>['id'];
  /**
   * The disabled state of the Collapsible
   */
  disabled: boolean;
  /**
   * The open state of the Collapsible
   */
  open: boolean;
  setContentId: (id: string | undefined) => void;
  setOpen: (open: boolean) => void;
}
