'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui-components/utils/useStableCallback';
import { AriaCombobox } from '../../combobox/root/AriaCombobox';
import { useCoreFilter } from '../../combobox/root/utils/useFilter';
import { stringifyAsLabel } from '../../utils/resolveValueLabel';

/**
 * Groups all parts of the autocomplete.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Autocomplete](https://base-ui.com/react/components/autocomplete)
 */
export function AutocompleteRoot<Items extends readonly { items: readonly any[] }[]>(
  props: Omit<AutocompleteRoot.Props<Items[number]['items'][number]>, 'items'> & {
    /**
     * The items to be displayed in the list.
     * Can be either a flat array of items or an array of groups with items.
     */
    items: Items;
  },
): React.JSX.Element;
export function AutocompleteRoot<ItemValue>(
  props: Omit<AutocompleteRoot.Props<ItemValue>, 'items'> & {
    /**
     * The items to be displayed in the list.
     * Can be either a flat array of items or an array of groups with items.
     */
    items?: readonly ItemValue[];
  },
): React.JSX.Element;
export function AutocompleteRoot<ItemValue>(
  props: AutocompleteRoot.Props<ItemValue>,
): React.JSX.Element {
  const {
    openOnInputClick = false,
    value,
    defaultValue,
    onValueChange,
    mode = 'list',
    itemToStringValue,
    ...other
  } = props;

  const enableInline = mode === 'inline' || mode === 'both';
  const staticItems = mode === 'inline' || mode === 'none';

  // Mirror the typed value for uncontrolled usage so we can compose the temporary
  // inline input value.
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = React.useState(defaultValue ?? '');
  const [inlineInputValue, setInlineInputValue] = React.useState('');

  React.useEffect(() => {
    if (isControlled) {
      setInlineInputValue('');
    }
  }, [value, isControlled]);

  // Compose the input value shown to the user: inline value takes precedence when present.
  let resolvedInputValue: typeof value;
  if (enableInline && inlineInputValue !== '') {
    resolvedInputValue = inlineInputValue;
  } else if (isControlled) {
    resolvedInputValue = value ?? '';
  } else {
    resolvedInputValue = internalValue;
  }

  const handleValueChange = useStableCallback(
    (nextValue: string, eventDetails: AutocompleteRoot.ChangeEventDetails) => {
      setInlineInputValue('');
      if (!isControlled) {
        setInternalValue(nextValue);
      }
      onValueChange?.(nextValue, eventDetails);
    },
  );

  const collator = useCoreFilter();

  const baseFilter: typeof other.filter = React.useMemo(() => {
    if (other.filter) {
      return other.filter;
    }
    return (item, query, toString) => {
      return collator.contains(stringifyAsLabel(item, toString), query);
    };
  }, [other, collator]);

  const resolvedQuery = String(isControlled ? value : internalValue).trim();

  // In "both", wrap filtering to use only the typed value, ignoring the inline value.
  const resolvedFilter: typeof other.filter = React.useMemo(() => {
    if (mode !== 'both') {
      return staticItems ? null : other.filter;
    }
    return (item, _query, toString) => {
      return baseFilter(item, resolvedQuery, toString);
    };
  }, [baseFilter, mode, other.filter, resolvedQuery, staticItems]);

  const handleItemHighlighted = useStableCallback(
    (highlightedValue: any, eventDetails: AriaCombobox.HighlightEventDetails) => {
      props.onItemHighlighted?.(highlightedValue, eventDetails);

      if (eventDetails.reason === 'pointer') {
        return;
      }

      if (enableInline) {
        if (highlightedValue == null) {
          setInlineInputValue('');
        } else {
          setInlineInputValue(stringifyAsLabel(highlightedValue, itemToStringValue));
        }
      } else {
        setInlineInputValue('');
      }
    },
  );

  return (
    <AriaCombobox
      {...other}
      itemToStringLabel={itemToStringValue}
      openOnInputClick={openOnInputClick}
      selectionMode="none"
      fillInputOnItemPress
      filter={resolvedFilter}
      autoComplete={mode}
      inputValue={resolvedInputValue}
      defaultInputValue={defaultValue}
      onInputValueChange={handleValueChange}
      onItemHighlighted={handleItemHighlighted}
    />
  );
}

export type AutocompleteRootState = AriaCombobox.State;

export interface AutocompleteRootActions {
  unmount: () => void;
}

export type AutocompleteRootChangeEventReason = AriaCombobox.ChangeEventReason;
export type AutocompleteRootChangeEventDetails = AriaCombobox.ChangeEventDetails;

export type AutocompleteRootHighlightEventReason = AriaCombobox.HighlightEventReason;
export type AutocompleteRootHighlightEventDetails = AriaCombobox.HighlightEventDetails;

export interface AutocompleteRootProps<ItemValue>
  extends Omit<
    AriaCombobox.Props<ItemValue, 'none'>,
    | 'selectionMode'
    | 'selectedValue'
    | 'defaultSelectedValue'
    | 'onSelectedValueChange'
    | 'fillInputOnItemPress'
    | 'itemToStringValue'
    | 'isItemEqualToValue'
    // Different names
    | 'inputValue' // value
    | 'defaultInputValue' // defaultValue
    | 'onInputValueChange' // onValueChange
    | 'autoComplete' // mode
    | 'itemToStringLabel' // itemToStringValue
    // Custom JSDoc
    | 'actionsRef'
    | 'onOpenChange'
    | 'onInputValueChange'
  > {
  /**
   * Controls how the autocomplete behaves with respect to list filtering and inline autocompletion.
   * - `list` (default): items are dynamically filtered based on the input value. The input value does not change based on the active item.
   * - `both`: items are dynamically filtered based on the input value, which will temporarily change based on the active item (inline autocompletion).
   * - `inline`: items are static (not filtered), and the input value will temporarily change based on the active item (inline autocompletion).
   * - `none`: items are static (not filtered), and the input value will not change based on the active item.
   * @default 'list'
   */
  mode?: 'list' | 'both' | 'inline' | 'none';
  /**
   * The uncontrolled input value of the autocomplete when it's initially rendered.
   *
   * To render a controlled autocomplete, use the `value` prop instead.
   */
  defaultValue?: AriaCombobox.Props<
    React.ComponentProps<'input'>['defaultValue'],
    'none'
  >['defaultInputValue'];
  /**
   * The input value of the autocomplete. Use when controlled.
   */
  value?: AriaCombobox.Props<React.ComponentProps<'input'>['value'], 'none'>['inputValue'];
  /**
   * Event handler called when the input value of the autocomplete changes.
   */
  onValueChange?: (value: string, eventDetails: AutocompleteRootChangeEventDetails) => void;
  /**
   * When the item values are objects (`<Autocomplete.Item value={object}>`), this function converts the object value to a string representation for both display in the input and form submission.
   * If the shape of the object is `{ value, label }`, the label will be used automatically without needing to specify this prop.
   */
  itemToStringValue?: (itemValue: ItemValue) => string;
  /**
   * A ref to imperative actions.
   * - `unmount`: When specified, the autocomplete will not be unmounted when closed.
   * Instead, the `unmount` function must be called to unmount the autocomplete manually.
   * Useful when the autocomplete's animation is controlled by an external library.
   */
  actionsRef?: React.RefObject<AutocompleteRootActions>;
  /**
   * Event handler called when the popup is opened or closed.
   */
  onOpenChange?: (open: boolean, eventDetails: AutocompleteRootChangeEventDetails) => void;
  /**
   * Event handler called when the input value changes.
   */
  onInputValueChange?: (
    inputValue: string,
    eventDetails: AutocompleteRootChangeEventDetails,
  ) => void;
  /**
   * Callback fired when an item is highlighted or unhighlighted.
   * Receives the highlighted item value (or `undefined` if no item is highlighted) and event details with a `reason` property describing why the highlight changed.
   * The `reason` can be:
   * - `'keyboard'`: the highlight changed due to keyboard navigation.
   * - `'pointer'`: the highlight changed due to pointer hovering.
   * - `'none'`: the highlight changed programmatically.
   */
  onItemHighlighted?: (
    highlightedValue: ItemValue | undefined,
    eventDetails: AutocompleteRootHighlightEventDetails,
  ) => void;
}

export namespace AutocompleteRoot {
  export type Props<ItemValue> = AutocompleteRootProps<ItemValue>;
  export type State = AutocompleteRootState;
  export type Actions = AutocompleteRootActions;
  export type ChangeEventReason = AutocompleteRootChangeEventReason;
  export type ChangeEventDetails = AutocompleteRootChangeEventDetails;
  export type HighlightEventReason = AutocompleteRootHighlightEventReason;
  export type HighlightEventDetails = AutocompleteRootHighlightEventDetails;
}
