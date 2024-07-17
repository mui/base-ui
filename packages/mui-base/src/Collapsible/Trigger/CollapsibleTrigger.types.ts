import { BaseUIComponentProps } from '../../utils/types';
import { CollapsibleRootOwnerState } from '../Root/CollapsibleRoot.types';

export interface CollapsibleTriggerProps
  extends BaseUIComponentProps<'button', CollapsibleRootOwnerState> {}

export interface UseCollapsibleTriggerParameters {
  contentId: React.HTMLAttributes<Element>['id'];
  /**
   * The open state of the Collapsible
   */
  open: boolean;
  /**
   * A state setter that toggles the open state of the Collapsiblew
   */
  setOpen: (open: boolean) => void;
}

export interface UseCollapsibleTriggerReturnValue {
  getRootProps: (
    externalProps?: React.ComponentPropsWithRef<'button'>,
  ) => React.ComponentPropsWithRef<'button'>;
}
