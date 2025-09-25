'use client';
import * as React from 'react';
import { useEventCallback } from '@base-ui-components/utils/useEventCallback';
import { ComboboxRootInternal } from '../../combobox/root/ComboboxRootInternal';
import { useCoreFilter } from '../../combobox/root/utils/useFilter';
import { stringifyAsLabel } from '../../utils/resolveValueLabel';
import type { Group } from '../../utils/resolveValueLabel';

/**
 * Groups all parts of the autocomplete.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Autocomplete](https://base-ui.com/react/components/autocomplete)
 */
export function AutocompleteRoot<Value>(
  props: Omit<AutocompleteRoot.Props<Value>, 'items'> & { items: readonly Group<Value>[] },
): React.JSX.Element;
export function AutocompleteRoot<Value>(
  props: Omit<AutocompleteRoot.Props<Value>, 'items'> & { items?: readonly Value[] },
): React.JSX.Element;
export function AutocompleteRoot<Value>(props: AutocompleteRoot.Props<Value>): React.JSX.Element {
  const {
    openOnInputClick = false,
    value,
    defaultValue,
    onValueChange,
    mode = 'list',
    autoHighlight = false,
    itemToStringValue,
    items,
    alwaysSubmitOnEnter = false,
    ...other
  } = props;

  const enableInline = mode === 'inline' || mode === 'both';
  const staticItems = mode === 'inline' || mode === 'none';

  // Mirror the typed value for uncontrolled usage so we can compose the inline overlay.
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = React.useState(defaultValue ?? '');
  const [inlineOverlay, setInlineOverlay] = React.useState('');

  // When the outer value changes (controlled), drop the overlay if it no longer matches intent.
  React.useEffect(() => {
    if (isControlled) {
      setInlineOverlay('');
    }
  }, [value, isControlled]);

  // Compose the input value shown to the user: overlay takes precedence when enabled.
  let composedValue: typeof value;
  if (enableInline && inlineOverlay !== '') {
    composedValue = inlineOverlay;
  } else if (isControlled) {
    composedValue = value ?? '';
  } else {
    composedValue = internalValue;
  }

  const handleValueChange = useEventCallback(
    (nextValue: string, eventDetails: AutocompleteRoot.ChangeEventDetails) => {
      // Typing should clear the overlay, mirroring the demo behavior
      setInlineOverlay('');
      if (!isControlled) {
        setInternalValue(nextValue);
      }
      onValueChange?.(nextValue, eventDetails);
    },
  );

  const collator = useCoreFilter();

  const baseFilter = React.useMemo(() => {
    if (other.filter) {
      return other.filter;
    }

    return (item: any, query: string, toString?: (item: any) => string) => {
      return collator.contains(stringifyAsLabel(item, toString), query);
    };
  }, [other, collator]);

  const query = String(isControlled ? value : internalValue).trim();

  // In "both", wrap filtering to use only the typed value, ignoring overlay.
  let effectiveFilter: typeof other.filter;
  if (mode !== 'both') {
    effectiveFilter = staticItems ? null : other.filter;
  } else {
    effectiveFilter = (item: any, _query: string, toString?: (item: any) => string) => {
      return baseFilter(item, query, toString);
    };
  }

  const handleItemHighlighted: ComboboxRootInternal.Props<Value, 'none'>['onItemHighlighted'] =
    useEventCallback((highlightedValue, data) => {
      props.onItemHighlighted?.(highlightedValue, data);

      if (data.type === 'pointer') {
        return;
      }

      if (enableInline) {
        if (highlightedValue == null) {
          setInlineOverlay('');
        } else {
          setInlineOverlay(stringifyAsLabel(highlightedValue, itemToStringValue));
        }
      } else {
        setInlineOverlay('');
      }
    });

  return (
    <ComboboxRootInternal
      {...other}
      items={items as any} // Block `Group` type inference
      itemToStringLabel={itemToStringValue}
      openOnInputClick={openOnInputClick}
      selectionMode="none"
      fillInputOnItemPress
      autoHighlight={autoHighlight}
      filter={effectiveFilter}
      inputValue={composedValue}
      defaultInputValue={defaultValue}
      onInputValueChange={handleValueChange}
      onItemHighlighted={handleItemHighlighted}
      autoComplete={mode}
      alwaysSubmitOnEnter={alwaysSubmitOnEnter}
    />
  );
}

export namespace AutocompleteRoot {
  export interface Props<ItemValue>
    extends Omit<
      ComboboxRootInternal.Props<ItemValue, 'none'>,
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
    defaultValue?: ComboboxRootInternal.Props<
      React.ComponentProps<'input'>['defaultValue'],
      'none'
    >['defaultInputValue'];
    /**
     * The input value of the autocomplete. Use when controlled.
     */
    value?: ComboboxRootInternal.Props<
      React.ComponentProps<'input'>['value'],
      'none'
    >['inputValue'];
    /**
     * Callback fired when the input value of the autocomplete changes.
     */
    onValueChange?: (value: string, eventDetails: ChangeEventDetails) => void;
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
    actionsRef?: React.RefObject<AutocompleteRoot.Actions>;
  }

  export type State = ComboboxRootInternal.State;

  export type Actions = ComboboxRootInternal.Actions;

  export type ChangeEventReason = ComboboxRootInternal.ChangeEventReason;
  export type ChangeEventDetails = ComboboxRootInternal.ChangeEventDetails;
}
