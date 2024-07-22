import { BaseUIComponentProps } from '../../utils/types';
import { CollapsibleRootOwnerState } from '../Root/CollapsibleRoot.types';

export interface CollapsibleContentProps
  extends BaseUIComponentProps<'div', CollapsibleRootOwnerState> {}

export interface UseCollapsibleContentParameters {
  id?: React.HTMLAttributes<Element>['id'];
  mounted: boolean;
  /**
   * The open state of the Collapsible
   */
  open: boolean;
  ref: React.Ref<HTMLElement>;
  setContentId: (id: string | undefined) => void;
  setMounted: (nextMounted: boolean) => void;
}

export interface UseCollapsibleContentReturnValue {
  getRootProps: (
    externalProps?: React.ComponentPropsWithRef<'button'>,
  ) => React.ComponentPropsWithRef<'button'>;
  isOpen: boolean;
  height: number;
}
