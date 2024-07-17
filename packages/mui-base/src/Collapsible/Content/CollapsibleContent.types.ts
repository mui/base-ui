import { BaseUIComponentProps } from '../../utils/types';
import { CollapsibleRootOwnerState } from '../Root/CollapsibleRoot.types';

export interface CollapsibleContentProps
  extends BaseUIComponentProps<'div', CollapsibleRootOwnerState> {}

export interface UseCollapsibleContentParameters {
  id?: React.HTMLAttributes<Element>['id'];
  /**
   * The open state of the Collapsible
   */
  open: boolean;
  setContentId: (id: string | undefined) => void;
}

export interface UseCollapsibleContentReturnValue {
  getRootProps: (
    externalProps?: React.ComponentPropsWithRef<'button'>,
  ) => React.ComponentPropsWithRef<'button'>;
}
