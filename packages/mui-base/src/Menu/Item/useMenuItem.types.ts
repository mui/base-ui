import { GenericHTMLProps } from '../../utils/types';
import { MenuReducerAction } from '../Root/useMenuRoot.types';
import { ListItemMetadata } from '../../useList';
import { UseCompoundItemParameters } from '../../useCompound/useCompound.types';

export interface UseMenuItemParameters {
  dispatch: (action: MenuReducerAction) => void;
  disabled: boolean;
  id: string | undefined;
  label?: string;
  onClick?: React.MouseEventHandler<any>;
  rootRef: React.Ref<Element>;
  /**
   * If `true`, the menu item won't receive focus when the mouse moves over it.
   *
   * @default false
   */
  disableFocusOnHover?: boolean;
  highlighted: boolean;
}

export interface UseMenuItemReturnValue {
  /**
   * Resolver for the root slot's props.
   * @param externalProps event handlers for the root slot
   * @returns props that should be spread on the root slot
   */
  getRootProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
  /**
   * The ref to the component's root DOM element.
   */
  rootRef: React.RefCallback<Element> | null;
}
