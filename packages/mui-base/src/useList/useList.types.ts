import * as React from 'react';
import { ListAction } from './listActions.types';
import {
  ControllableReducerAction,
  StateChangeCallback,
} from '../utils/useControllableReducer.types';
import type { ListContextValue } from './ListContext';
import { MuiCancellableEventHandler } from '../utils/MuiCancellableEvent';
import { IndexableMap } from '../utils/IndexableMap';

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

export type ListItemMetadata<ItemValue> = {
  value: ItemValue;
  disabled: boolean;
  valueAsString?: string;
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
  items: IndexableMap<ItemValue, ListItemMetadata<ItemValue>>;
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
 * @template State The type of the list state. This should be a subtype of `ListState<ItemValue>`.
 * @template CustomAction The type of the actions that can be dispatched (besides the standard ListAction).
 * @template CustomActionContext The shape of additional properties that will be added to actions when dispatched.
 */
export interface UseListParameters<
  ItemValue,
  State extends ListState<ItemValue> = ListState<ItemValue>,
  CustomAction extends ControllableReducerAction = never,
> {
  /**
   * The externally controlled values (highlighted and selected item(s)) of the list.
   * If a custom state is used, this object can contain the added state fields as well.
   *
   * @default {}
   */
  controlledProps?: Partial<State>;
  /**
   * If `true`, it will be possible to highlight disabled items.
   * @default false
   */
  disabledItemsFocusable?: boolean;
  /**
   * If `true`, the highlight will not wrap around the list if arrow keys are used.
   * @default false
   */
  disableListWrap?: boolean;
  /**
   * The focus management strategy used by the list.
   * Controls the attributes used to set focus on the list items.
   * @default 'activeDescendant'
   */
  focusManagement?: FocusManagementType;
  /**
   * A function that returns the DOM element associated with an item.
   * This is required when using the `DOM` focus management.
   *
   * @param item List item to get the DOM element for.
   */
  getItemDomElement?: (itemValue: ItemValue) => HTMLElement | null;
  /**
   * A function that returns the id of an item.
   * This is required when using the `activeDescendant` focus management.
   *
   * @param itemValue List item to get the id for.
   */
  getItemId?: (itemValue: ItemValue) => string | undefined;
  /**
   * A function that intializes the state of the list.
   * It is required when using a custom state with mandatory fields.
   * If not provided, the state will be initialized with the default values (nothing highlighted or selected).
   *
   * @returns The initial state of the list.
   */
  getInitialState?: () => State;
  /**
   * Ref to the list root DOM element.
   */
  rootRef?: React.Ref<Element>;
  /**
   * Callback fired when the selected value changes.
   * This is a strongly typed convenience event that can be used instead of `onStateChange`.
   */
  onChange?: (
    event: React.MouseEvent | React.KeyboardEvent | React.FocusEvent | null,
    value: ItemValue[],
    reason: string,
  ) => void;
  /**
   * Callback fired when the highlighted option changes.
   * This is a strongly typed convenience event that can be used instead of `onStateChange`.
   */
  onHighlightChange?: (
    event: React.MouseEvent | React.KeyboardEvent | React.FocusEvent | null,
    option: ItemValue | null,
    reason: string,
  ) => void;
  /**
   * Callback fired when the items change.
   *
   * @param items The new items collection
   */
  onItemsChange?: (items: ListItemMetadata<ItemValue>[]) => void;
  /**
   * Callback fired when the any of the state items change.
   * Note that in case of `selectedValues` and `highlightedValue` the strongly typed
   * `onChange` and `onHighlightChange` callbacks are also fired.
   */
  onStateChange?: StateChangeCallback<State>;
  /**
   * The number of items skip when using the page up and page down keys.
   *
   * @default 5
   */
  pageSize?: number;
  /**
   * Array of list items.
   */
  items: ListItemMetadata<ItemValue>[];
  /**
   * Orientation of the items in the list.
   * Determines the actions that are performed when arrow keys are pressed.
   */
  orientation?: ListOrientation;
  /**
   * Controls how many items can be selected at once: none (the selection functionality is disabled in this case), one, or indefinitely many.
   * @default 'single'
   */
  selectionMode?: SelectionMode;
  /**
   * Custom state reducer function. It calculates the new state (highlighted and selected items + optional custom state)
   * based on the previous one and the performed action.
   */
  stateReducer?: (state: State, action: ListAction<ItemValue> | CustomAction) => State;
  /**
   * The name of the component using useList.
   * For debugging purposes.
   * @default 'useList'
   */
  componentName?: string;
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

interface UseListRootSlotOwnProps {
  'aria-activedescendant'?: React.AriaAttributes['aria-activedescendant'];
  onBlur: MuiCancellableEventHandler<React.FocusEvent<HTMLElement>>;
  onKeyDown: MuiCancellableEventHandler<React.KeyboardEvent<HTMLElement>>;
  tabIndex: number;
  ref: React.RefCallback<Element> | null;
}

export type UseListRootSlotProps<ExternalProps = {}> = ExternalProps & UseListRootSlotOwnProps;

export interface UseListReturnValue<
  ItemValue,
  State extends ListState<ItemValue>,
  CustomAction extends ControllableReducerAction,
> {
  contextValue: ListContextValue<ItemValue>;
  dispatch: (action: CustomAction | ListAction<ItemValue>) => void;
  /**
   * Resolver for the root slot's props.
   * @param externalProps additional props for the root slot
   * @returns props that should be spread on the root slot
   */
  getRootProps: <ExternalProps extends Record<string, unknown> = {}>(
    externalProps?: ExternalProps,
  ) => UseListRootSlotProps<ExternalProps>;
  rootRef: React.RefCallback<Element> | null;
  state: State;
}
