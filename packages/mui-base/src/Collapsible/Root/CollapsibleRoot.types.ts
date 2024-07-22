import { TransitionStatus } from '../../utils/useTransitionStatus';

export interface CollapsibleContextValue extends UseCollapsibleRootReturnValue {
  ownerState: Pick<UseCollapsibleRootReturnValue, 'open' | 'disabled' | 'transitionStatus'>;
}

export type CollapsibleRootOwnerState = Pick<
  CollapsibleContextValue,
  'open' | 'disabled' | 'transitionStatus'
>;

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
  mounted: boolean;
  /**
   * The open state of the Collapsible
   */
  open: boolean;
  setContentId: (id: string | undefined) => void;
  setMounted: (open: boolean) => void;
  setOpen: (open: boolean) => void;
  transitionStatus: TransitionStatus;
}
