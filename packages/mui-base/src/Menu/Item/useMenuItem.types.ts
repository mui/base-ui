import { GenericHTMLProps } from '../../utils/types';
import { MenuReducerAction } from '../Root/menuReducer';
import { CompoundParentContextValue } from '../../useCompound/useCompound.types';
import { ListDirection, ListItemMetadata, ListOrientation } from '../../useList';

export interface UseMenuItemParameters {
  dispatch: React.Dispatch<MenuReducerAction>;
  rootDispatch: React.Dispatch<MenuReducerAction>;
  disabled: boolean;
  id: string | undefined;
  label?: string;
  onClick?: React.MouseEventHandler<any>;
  rootRef?: React.Ref<Element>;
  /**
   * If `true`, the menu item won't receive focus when the mouse moves over it.
   *
   * @default false
   */
  disableFocusOnHover?: boolean;
  highlighted: boolean;
  compoundParentContext: CompoundParentContextValue<string, ListItemMetadata>;

  closeOnClick: boolean;
  isNested: boolean;
  orientation: ListOrientation;
  direction: ListDirection;
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
