import * as React from 'react';
import { MenuReducerAction, MenuReducerState } from '../Root/useMenuRoot.types';
import { GenericHTMLProps } from '../../utils/types';
import { CompoundParentContextValue } from '../../useCompound';
import { ListItemMetadata } from '../../useList';

export interface UseMenuPopupParameters {
  /**
   * If `true` (Default) will focus the highligted item. If you set this prop to `false`
   * the focus will not be moved inside the Menu component. This has severe accessibility implications
   * and should only be considered if you manage focus otherwise.
   * @default true
   */
  autoFocus?: boolean;
  /**
   * The id of the menu. If not provided, it will be generated.
   */
  id?: string;
  state: MenuReducerState;
  dispatch: React.Dispatch<MenuReducerAction>;
}

export interface UseMenuPopupReturnValue {
  /**
   * Resolver for the Popup's props.
   * @param externalProps additional props for the Popup component
   * @returns props that should be spread on the Popup component
   */
  getRootProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
  compoundParentContext: CompoundParentContextValue<string, ListItemMetadata>;
}
