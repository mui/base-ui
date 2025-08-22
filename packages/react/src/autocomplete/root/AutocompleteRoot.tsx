'use client';
import * as React from 'react';
import { useEventCallback } from '@base-ui-components/utils/useEventCallback';
import { ComboboxRoot } from '../../combobox/root/ComboboxRoot';
import { stringifyItem } from '../../combobox/root/utils';
import { useFilter as useCollatorFilter } from '../../combobox/root/utils/useFilter';

const DEFAULT_FILTER_OPTIONS = { sensitivity: 'base' } as const;

/**
 * Groups all parts of the autocomplete.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Autocomplete](https://base-ui.com/react/components/autocomplete)
 */
export function AutocompleteRoot<Item = any>(
  props: AutocompleteRoot.Props<Item>,
): React.JSX.Element {
  const {
    openOnInputClick = false,
    value,
    defaultValue,
    onValueChange,
    mode = 'list',
    autoHighlight = false,
    itemToString,
    ...rest
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
    (nextValue: string, event: Event | undefined, reason: string | undefined) => {
      // Typing should clear the overlay, mirroring the demo behavior
      setInlineOverlay('');
      if (!isControlled) {
        setInternalValue(nextValue);
      }
      onValueChange?.(nextValue, event, reason);
    },
  );

  const collator = useCollatorFilter(DEFAULT_FILTER_OPTIONS);

  const baseFilter = React.useMemo(() => {
    if (rest.filter) {
      return rest.filter;
    }

    return (item: any, query: string, toString?: (item: any) => string) => {
      return collator.contains(stringifyItem(item, toString), query);
    };
  }, [rest, collator]);

  const query = String(isControlled ? value : internalValue).trim();

  // In "both", wrap filtering to use only the typed value, ignoring overlay.
  let effectiveFilter: typeof rest.filter;
  if (mode !== 'both') {
    effectiveFilter = staticItems ? null : rest.filter;
  } else {
    effectiveFilter = (item: any, _query: string, toString?: (item: any) => string) => {
      return baseFilter(item, query, toString);
    };
  }

  const handleItemHighlighted: NonNullable<ComboboxRoot.Props<Item, 'none'>['onItemHighlighted']> =
    useEventCallback((highlightedValue, data) => {
      props.onItemHighlighted?.(highlightedValue, data);

      if (data.type !== 'keyboard') {
        return;
      }

      if (enableInline) {
        if (highlightedValue == null) {
          setInlineOverlay('');
        } else {
          setInlineOverlay(stringifyItem(highlightedValue, itemToString));
        }
      } else {
        setInlineOverlay('');
      }
    });

  return (
    <ComboboxRoot
      {...rest}
      itemToString={itemToString}
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
    />
  );
}

export namespace AutocompleteRoot {
  export interface Props<Item = any>
    extends Omit<
      ComboboxRoot.Props<Item, 'none'>,
      | 'selectionMode'
      | 'selectedValue'
      | 'defaultSelectedValue'
      | 'onSelectedValueChange'
      | 'fillInputOnItemPress'
      | 'modal'
      | 'clearInputOnCloseComplete'
      // Custom JSDoc
      | 'openOnInputClick'
      // Different names
      | 'inputValue'
      | 'defaultInputValue'
      | 'onInputValueChange'
      | 'autoComplete'
    > {
    /**
     * Controls how the Autocomplete behaves with respect to list filtering and inline autocompletion.
     * - `list` (default): items are dynamically filtered based on the input value. The input value does not change based on the active item.
     * - `both`: items are dynamically filtered based on the input value, which will temporarily change based on the active item (inline autocompletion).
     * - `inline`: items are static (not filtered), and the input value will temporarily change based on the active item (inline autocompletion).
     * - `none`: items are static (not filtered), and the input value will not change based on the active item.
     * @default 'list'
     */
    mode?: 'list' | 'both' | 'inline' | 'none';
    /**
     * Whether the combobox popup opens when clicking the input.
     * @default false
     */
    openOnInputClick?: boolean;
    /**
     * The uncontrolled input value of the autocomplete when it's initially rendered.
     *
     * To render a controlled autocomplete, use the `value` prop instead.
     */
    defaultValue?: ComboboxRoot.Props<Item, 'none'>['defaultInputValue'];
    /**
     * The input value of the autocomplete. Use when controlled.
     */
    value?: ComboboxRoot.Props<Item, 'none'>['inputValue'];
    /**
     * Callback fired when the input value of the autocomplete changes.
     */
    onValueChange?: ComboboxRoot.Props<Item, 'none'>['onInputValueChange'];
  }
}
