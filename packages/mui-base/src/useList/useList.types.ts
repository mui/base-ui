import * as React from 'react';
import { ListAction } from './listActions.types';
import { IndexableMap } from '../utils/IndexableMap';
import { GenericHTMLProps } from '../utils/types';

/**
 * The configuration settings that modify the behavior of the list.
 */
export interface ListSettings {
  disabledItemsFocusable: boolean;
  disableListWrap: boolean;
  focusManagement: FocusManagementType;
  orientation: ListOrientation;
  pageSize: number;
  selectionMode: SelectionMode;
}

export type ListItemMetadata = {
  /**
   * Determines if the item is disabled.
   */
  disabled: boolean;
  /**
   * String version of the list item's value. Used to navigate the list.
   */
  valueAsString?: string;
  /**
   * Ref to the list item's DOM element.
   */
  ref: React.RefObject<HTMLElement>;
  /**
   * The id of the list item's DOM element.
   */
  idAttribute?: string;
};

/**
 * The state of the list.
 * Modifications to this state should be done via the reducer.
 */
export interface ListState<ItemValue> {
  /**
   * The item that is currently highlighted.
   */
  highlightedValue: ItemValue | null;
  /**
   * The item(s) that are currently selected.
   */
  selectedValues: ItemValue[];
  items: IndexableMap<ItemValue, ListItemMetadata>;
  settings: ListSettings;
}

/**
 * Type of the reducer that operates on the list state.
 *
 * @template ItemValue The type of the item values.
 * @template State The type of the list state. This should be a subtype of ListState<ItemValue>.
 * @template CustomActionContext The shape of additional properties that will be added to actions when dispatched.
 */
export type ListReducer<ItemValue, State extends ListState<ItemValue>> = (
  state: State,
  action: ListAction<ItemValue>,
) => State;

export type FocusManagementType = 'DOM' | 'activeDescendant';

export type ListOrientation = 'horizontal-ltr' | 'horizontal-rtl' | 'vertical';

export type SelectionMode = 'none' | 'single' | 'multiple';

/**
 * Parameters of the useList hook.
 *
 * @template ItemValue The type of the item values.
 */
export interface UseListParameters<ItemValue> {
  /**
   * The function that dipatches actions to be performed on the list state.
   */
  dispatch: (action: ListAction<ItemValue>) => void;
  /**
   * The focus management strategy used by the list.
   * Controls the attributes used to set focus on the list items.
   * @default 'activeDescendant'
   */
  focusManagement?: FocusManagementType;
  items: IndexableMap<ItemValue, ListItemMetadata>;
  /**
   * The item that is currently highlighted.
   */
  highlightedValue: ItemValue | null;
  /**
   * The item(s) that are currently selected.
   */
  selectedValues: ItemValue[];
  /**
   * Ref to the list root DOM element.
   */
  rootRef?: React.Ref<Element>;

  /**
   * Orientation of the items in the list.
   * Determines the actions that are performed when arrow keys are pressed.
   */
  orientation?: ListOrientation;
}

export interface ListItemState {
  /**
   * Determines if the item is focusable (its focus is managed by the DOM).
   */
  focusable: boolean;
  /**
   * If `true` the item is highlighted.
   */
  highlighted: boolean;
  /**
   * If `true` the item is selected.
   */
  selected: boolean;
}

export interface UseListReturnValue<ItemValue> {
  getItemState: (item: ItemValue) => ListItemState;
  /**
   * Resolver for the root slot's props.
   * @param externalProps additional props for the root slot
   * @returns props that should be spread on the root slot
   */
  getRootProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
  rootRef: React.RefCallback<Element> | null;
}
