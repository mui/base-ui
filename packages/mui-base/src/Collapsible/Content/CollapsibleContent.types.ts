import { BaseUIComponentProps } from '../../utils/types';
import { CollapsibleRootOwnerState } from '../Root/CollapsibleRoot.types';

export interface CollapsibleContentProps
  extends BaseUIComponentProps<'div', CollapsibleRootOwnerState>,
    Pick<UseCollapsibleContentParameters, 'htmlHidden'> {}

export interface UseCollapsibleContentParameters {
  /**
   * If `true`, the component supports CSS/JS-based animations and transitions.
   * @default false
   */
  animated?: boolean;
  /**
   * The hidden state when closed
   * @default 'hidden'
   */
  htmlHidden?: 'hidden' | 'until-found';
  id?: React.HTMLAttributes<Element>['id'];
  mounted: boolean;
  /**
   * The open state of the Collapsible
   */
  open: boolean;
  ref: React.Ref<HTMLElement>;
  setContentId: (id: string | undefined) => void;
  setOpen: (nextOpen: boolean) => void;
  setMounted: (nextMounted: boolean) => void;
}

export interface UseCollapsibleContentReturnValue {
  getRootProps: (
    externalProps?: React.ComponentPropsWithRef<'button'>,
  ) => React.ComponentPropsWithRef<'button'>;
  height: number;
}
