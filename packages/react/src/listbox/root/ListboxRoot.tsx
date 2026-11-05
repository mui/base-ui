'use client';
import * as React from 'react';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useControlled } from '@base-ui/utils/useControlled';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { EMPTY_ARRAY } from '@base-ui/utils/empty';
import { areArraysEqual } from '@base-ui/utils/areArraysEqual';
import type {
  BaseUIChangeEventDetails,
  BaseUIHighlightEventDetails,
} from '../../internals/createBaseUIEventDetails';
import type { REASONS } from '../../internals/reasons';
import { useBaseUiId } from '../../internals/useBaseUiId';
import { defaultItemEquality } from '../../internals/itemEquality';
import { stringifyAsLabel } from '../../internals/resolveValueLabel';
import { ListboxRootContext } from './ListboxRootContext';
import { ListboxStore } from '../store';
import { useHighlightChangeNotifier } from '../utils/useHighlightChangeNotifier';

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
    isItemEqualToValue = defaultItemEquality,
    onItemHighlighted,
    items,
    itemToStringLabel,
    children,
  } = props;

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
    return value == null ? EMPTY_ARRAY : [value];
  }, [value, multiple]);

  const labelsRef = React.useRef<Array<string | null>>([]);
  const valuesRef = React.useRef<Array<any>>([]);
  const disabledItemsRef = React.useRef<Array<boolean | undefined>>([]);
  const typingRef = React.useRef(false);
  const lastSelectedIndexRef = React.useRef<number | null>(null);

  const store = useRefWithInit(
    () =>
      new ListboxStore(
        {
          id: generatedId,
          multiple: multipleProp,
          isItemEqualToValue,
          value: selectedValues,
          orientation,
          disabled,
          highlightItemOnHover,
          items,
        },
        {
          valuesRef,
          labelsRef,
          disabledItemsRef,
          typingRef,
          lastSelectedIndexRef,
        },
      ),
  ).current;

  // Parts report the next selection as an array; convert it to the public shape.
  const setValue = useStableCallback(
    (nextSelectedValues: any[], eventDetails: ListboxRoot.ChangeEventDetails) => {
      // Nothing changes when the selection is the same, such as when the focused item is
      // disabled or every item is already selected.
      if (areArraysEqual(nextSelectedValues, store.state.value, store.state.isItemEqualToValue)) {
        return;
      }

      const nextValue = multiple ? nextSelectedValues : (nextSelectedValues[0] ?? null);
      onValueChange?.(nextValue, eventDetails);

      if (eventDetails.isCanceled) {
        return;
      }

      setValueUnwrapped(nextValue);
    },
  );

  store.useContextCallback('setValue', setValue);

  useIsoLayoutEffect(() => {
    store.update({
      id: generatedId,
      multiple: multipleProp,
      value: selectedValues,
      isItemEqualToValue,
      orientation,
      disabled,
      highlightItemOnHover,
      items,
    });
  }, [
    store,
    generatedId,
    multipleProp,
    selectedValues,
    isItemEqualToValue,
    orientation,
    disabled,
    highlightItemOnHover,
    items,
  ]);

  // With `items`, the listbox knows every item, including those that aren't rendered, so
  // selection, typeahead and the tab stop work across the whole list.
  useIsoLayoutEffect(() => {
    if (!items) {
      return;
    }
    valuesRef.current = items as any[];
    labelsRef.current = items.map((item) => stringifyAsLabel(item, itemToStringLabel));
  }, [items, itemToStringLabel]);

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
   * While focus is in the listbox, the item also receives focus. The pointer never takes focus
   * from outside the listbox.
   * @default true
   */
  highlightItemOnHover?: boolean | undefined;
  /**
   * Custom comparison logic used to determine if a listbox item value matches the current selected value.
   * Defaults to `Object.is` comparison.
   */
  isItemEqualToValue?: ((itemValue: Value, value: Value) => boolean) | undefined;
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
   */
  onItemHighlighted?:
    | ((itemValue: Value | undefined, eventDetails: ListboxRootHighlightEventDetails) => void)
    | undefined;
  /**
   * The items in the list, including those that aren't rendered.
   * Pass them when the list is virtualized, and use each item as its `Listbox.Item` value.
   * Keyboard navigation, typeahead and selection can then reach items that aren't rendered.
   */
  items?: readonly Value[] | undefined;
  /**
   * When the item values are objects (`<Listbox.Item value={object}>`), this function converts the
   * object value to a string representation for typeahead.
   * If the shape of the object is `{ value, label }`, the label will be used automatically without
   * needing to specify this prop.
   */
  itemToStringLabel?: ((itemValue: Value) => string) | undefined;
}

export interface ListboxRootState {}

export type ListboxRootChangeEventReason =
  typeof REASONS.itemPress | typeof REASONS.listNavigation | typeof REASONS.escapeKey;

export type ListboxRootChangeEventDetails = BaseUIChangeEventDetails<
  ListboxRootChangeEventReason,
  {
    /**
     * Set when the change selects a range of items, such as with Shift+Click, Shift+Arrow or
     * Ctrl/Cmd+A.
     */
    range?:
      | {
          /**
           * The index of the first item in the range.
           */
          from: number;
          /**
           * The index of the last item in the range, inclusive.
           */
          to: number;
          /**
           * How the range changes the selection.
           * - `'replace'`: the range becomes the selection.
           * - `'add'`: the range is added to the selection.
           */
          mode: 'replace' | 'add';
        }
      | undefined;
  }
>;

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
