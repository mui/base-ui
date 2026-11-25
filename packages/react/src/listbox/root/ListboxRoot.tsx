'use client';
import * as React from 'react';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useControlled } from '@base-ui/utils/useControlled';
import { EMPTY_ARRAY } from '@base-ui/utils/empty';
import type {
  BaseUIChangeEventDetails,
  BaseUIHighlightEventDetails,
} from '../../internals/createBaseUIEventDetails';
import type { REASONS } from '../../internals/reasons';
import { useBaseUiId } from '../../internals/useBaseUiId';
import { createListboxItems } from '../items/createItems';
import type {
  CreateListboxItemsOptions,
  ListboxItemCollection,
  ListboxItemGroupInput,
  ListboxItems,
  ListboxPrimitiveValue,
} from '../items/createItems';
import { ListboxRootContext } from './ListboxRootContext';
import { ListboxStore, getSelectedValueSet } from '../store';
import { useHighlightChangeNotifier } from '../utils/useHighlightChangeNotifier';

// A plain array is a collection of primitives, which are their own value and label, or of
// `{ value, label, disabled }` objects.
const PLAIN_ITEM_OPTIONS: CreateListboxItemsOptions<
  ListboxPrimitiveValue | ListboxItemObject<ListboxPrimitiveValue>,
  ListboxPrimitiveValue
> = {
  getValue: (item) => (typeof item === 'object' ? item.value : item),
  getLabel: (item) => (typeof item === 'object' ? item.label : String(item)),
  getDisabled: (item) => typeof item === 'object' && item.disabled === true,
};

/**
 * Groups all parts of the listbox.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Listbox](https://base-ui.com/react/components/listbox)
 */
export function ListboxRoot<Value, Multiple extends boolean | 'opt-in' | undefined = false>(
  props: ListboxRoot.Props<Value, Multiple>,
): React.JSX.Element {
  const {
    value: valueProp,
    defaultValue,
    onValueChange,
    disabled = false,
    multiple: multipleProp = false,
    orientation = 'vertical',
    highlightItemOnHover = true,
    onItemHighlighted,
    items: itemsProp,
    children,
  } = props;

  // The collection's internal shape, which is opaque to consumers. An array is wrapped in one.
  const items = React.useMemo(
    () =>
      (Array.isArray(itemsProp)
        ? createListboxItems(itemsProp as readonly ListboxPrimitiveValue[], PLAIN_ITEM_OPTIONS)
        : itemsProp) as unknown as ListboxItems | undefined,
    [itemsProp],
  );

  const generatedId = useBaseUiId();

  const multiple = multipleProp !== false;

  // `value` keeps the public shape: a single value, or an array when `multiple` is set.
  const [value, setValueUnwrapped] = useControlled<any>({
    controlled: valueProp,
    default: defaultValue ?? (multiple ? EMPTY_ARRAY : null),
    name: 'Listbox',
    state: 'value',
  });

  // Internally, selection is always tracked as an array of selected values.
  const selectedValues: any[] = React.useMemo(() => {
    if (multiple) {
      return Array.isArray(value) ? value : EMPTY_ARRAY;
    }
    // `null` is a value an item can have, as in Select, so it's selected while the value is
    // `null`. It's also the value when nothing is selected.
    return value === undefined ? EMPTY_ARRAY : [value];
  }, [value, multiple]);

  const rootState = {
    id: generatedId,
    multiple: multipleProp,
    value: selectedValues,
    orientation,
    disabled,
    highlightItemOnHover,
    items,
  };

  const store = useRefWithInit(() => new ListboxStore(rootState)).current;

  // Parts report the next selection as an array; convert it to the public shape.
  store.useContextCallback(
    'setValue',
    (nextSelectedValues: any[], eventDetails: ListboxRoot.ChangeEventDetails) => {
      // Nothing changes when the selection is the same, such as when the focused item is
      // disabled or every item is already selected.
      if (isSameSelection(nextSelectedValues, store.state.value)) {
        return true;
      }

      const nextValue = multiple ? nextSelectedValues : (nextSelectedValues[0] ?? null);
      onValueChange?.(nextValue, eventDetails);

      if (eventDetails.isCanceled) {
        return false;
      }

      setValueUnwrapped(nextValue);
      return true;
    },
  );

  store.useSyncedValues(rootState);

  useHighlightChangeNotifier<Value>({
    store,
    onItemHighlighted,
  });

  return <ListboxRootContext.Provider value={store}>{children}</ListboxRootContext.Provider>;
}

type ListboxInputValue<Value, Multiple extends boolean | 'opt-in' | undefined> = Multiple extends
  true | 'opt-in'
  ? readonly Value[]
  : Value;

type ListboxOutputValue<Value, Multiple extends boolean | 'opt-in' | undefined> = Multiple extends
  true | 'opt-in'
  ? Value[]
  : Value;

export interface ListboxRootProps<Value, Multiple extends boolean | 'opt-in' | undefined = false> {
  children?: React.ReactNode;
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * Whether multiple items can be selected, and how selecting an item affects the current selection.
   * - `false`: only one item can be selected.
   * - `true`: each item is toggled independently.
   * - `'opt-in'`: selecting an item moves the current selection to it, and users hold a modifier key
   *   to select more than one item. On touch devices, where there are no modifier keys, it behaves
   *   like `true`.
   * @default false
   */
  multiple?: Multiple | undefined;
  /**
   * The orientation of the listbox for keyboard navigation.
   * @default 'vertical'
   */
  orientation?: 'vertical' | 'horizontal' | undefined;
  /**
   * Whether moving the pointer over an item highlights it.
   * While focus is in the listbox, the item also receives focus, except with `multiple="opt-in"`,
   * where moving focus can change the selection. The pointer never takes focus from outside the
   * listbox.
   * @default true
   */
  highlightItemOnHover?: boolean | undefined;
  /**
   * The uncontrolled value of the listbox when it's initially rendered.
   *
   * To render a controlled listbox, use the `value` prop instead.
   */
  defaultValue?: ListboxInputValue<Value, Multiple> | null | undefined;
  /**
   * The value of the listbox. Use when controlled.
   */
  value?: ListboxInputValue<Value, Multiple> | null | undefined;
  /**
   * Event handler called when the value of the listbox changes.
   */
  onValueChange?:
    | ((
        value:
          ListboxOutputValue<Value, Multiple> | (Multiple extends true | 'opt-in' ? never : null),
        eventDetails: ListboxRootChangeEventDetails,
      ) => void)
    | undefined;
  /**
   * Callback fired when an item is highlighted or unhighlighted.
   * Receives the highlighted item value (or `undefined` if no item is highlighted) and event details with a `reason` property describing why the highlight changed.
   * The `reason` can be:
   * - `'keyboard'`: the highlight changed due to keyboard navigation or typeahead.
   * - `'pointer'`: the highlight changed due to pointer hovering. The event may be a `MouseEvent`
   *   rather than a `PointerEvent`.
   * - `'none'`: the highlight changed for another reason, such as an item receiving or losing focus.
   *
   * With `items`, the highlighted item may not be rendered yet, so scroll it into view.
   * `eventDetails.index` is `-1` when no item is highlighted.
   */
  onItemHighlighted?:
    | ((itemValue: Value | undefined, eventDetails: ListboxRootHighlightEventDetails) => void)
    | undefined;
  /**
   * Every item in the list, including those that aren't rendered. Pass them when the list is
   * virtualized, so keyboard navigation, typeahead and selection can reach items that aren't
   * rendered.
   *
   * Pass one of the following:
   * - An array of primitives, such as strings or numbers, each of which is an item's value and
   *   label.
   * - An array of `{ value, label, disabled }` objects.
   * - An array of groups, each with an `items` array of either of the above.
   * - A collection created with `Listbox.createItems()` for any other data.
   *
   * Give each `Listbox.Item` its value, which with a collection is what `getValue` returns for
   * the item.
   *
   * Pass the same array or collection on every render, by defining it outside the component or
   * memoizing it, since a new one makes every item render again.
   *
   * @type readonly Value[] | readonly ListboxItemObject<Value>[] | readonly ListboxItemGroup<Value | ListboxItemObject<Value>>[] | ListboxItemCollection<any, Value>
   */
  items?:
    | readonly (Value & ListboxPrimitiveValue)[]
    | readonly ListboxItemObject<Value & ListboxPrimitiveValue>[]
    | readonly ListboxItemGroupInput<
        (Value & ListboxPrimitiveValue) | ListboxItemObject<Value & ListboxPrimitiveValue>
      >[]
    | ListboxItemCollection<any, Value>
    | undefined;
}

/**
 * An item in a plain array passed to the root's `items` prop.
 */
export interface ListboxItemObject<Value> {
  /** The item's value, which identifies it. Give the same value to its `Listbox.Item`. */
  value: Value;
  /** The text that represents the item in keyboard text navigation. */
  label: string;
  /**
   * Whether the item is disabled.
   * @default false
   */
  disabled?: boolean | undefined;
}

export interface ListboxRootState {}

export type ListboxRootChangeEventReason = typeof REASONS.itemPress | typeof REASONS.listNavigation;

export type ListboxRootChangeEventDetails = BaseUIChangeEventDetails<ListboxRootChangeEventReason>;

export type ListboxRootHighlightEventReason =
  typeof REASONS.keyboard | typeof REASONS.pointer | typeof REASONS.none;

export type ListboxRootHighlightEventDetails = BaseUIHighlightEventDetails<
  ListboxRootHighlightEventReason,
  {
    /**
     * The index of the highlighted item in the list, or `-1` when no item is highlighted.
     */
    index: number;
  }
>;

export namespace ListboxRoot {
  export type Props<
    Value,
    Multiple extends boolean | 'opt-in' | undefined = false,
  > = ListboxRootProps<Value, Multiple>;
  export type State = ListboxRootState;
  export type ChangeEventReason = ListboxRootChangeEventReason;
  export type ChangeEventDetails = ListboxRootChangeEventDetails;
  export type HighlightEventReason = ListboxRootHighlightEventReason;
  export type HighlightEventDetails = ListboxRootHighlightEventDetails;
}

/** Whether two selections hold the same values, in any order. */
function isSameSelection(a: any[], b: any[]) {
  if (a.length !== b.length) {
    return false;
  }
  const selected = getSelectedValueSet(b);
  return a.every((value) => selected.has(value));
}
