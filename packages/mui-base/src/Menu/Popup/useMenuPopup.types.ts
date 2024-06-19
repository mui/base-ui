import * as React from 'react';
import { ListAction, ListItemState } from '../../useList';
import { GenericHTMLProps } from '../../utils/types';
import { MenuItemMetadata } from '../Item/useMenuItem.types';
import { IndexableMap } from '../../utils/IndexableMap';

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
  /**
   * The ref to the menu's listbox node.
   */
  listboxRef?: React.Ref<Element>;
  subitems: IndexableMap<string, MenuItemMetadata>;
}

export interface UseMenuPopupReturnValue {
  /**
   * Resolver for the listbox slot's props.
   * @param externalProps additional props for the listbox component
   * @returns props that should be spread on the listbox component
   */
  getListboxProps: <ExternalProps extends Record<string, unknown> = {}>(
    externalProps?: ExternalProps,
  ) => GenericHTMLProps;
  /**
   * The ref to the menu's listbox node.
   */
  listboxRef: React.RefCallback<Element> | null;
  getItemState: (value: string) => ListItemState;
}
