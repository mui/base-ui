'use client';
import * as React from 'react';
import { useControlled } from '@base-ui/utils/useControlled';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { closest } from '@base-ui/utils/shadowDom';
import { isKeyboardOpen } from '../../utils/isKeyboardOpen';
import type { HTMLProps } from '../../internals/types';
import { SelectRootInternal } from '../root/SelectRoot';
import type { SelectRoot } from '../root/SelectRoot';
import type { SelectFilterProvider } from '../filter-provider/SelectFilterProvider';
import type { SelectFilterProviderOptions } from '../filter-provider/SelectFilterProviderOptions';
import { SelectFilterDropdown } from './SelectFilterDropdown';
import { getTarget } from '../../floating-ui-react/utils';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import { compareItemEquality, defaultItemEquality } from '../../internals/itemEquality';
import type { ItemEqualityComparer } from '../../internals/itemEquality';

export interface ToggledItem {
  element: Element | null;
  value: unknown;
}

function getToggledValue(
  nextValue: readonly unknown[],
  previousValue: readonly unknown[],
  comparer: ItemEqualityComparer,
) {
  const isIn = (values: readonly unknown[], value: unknown) =>
    values.some((other) => compareItemEquality(value, other, comparer));
  return (
    nextValue.find((value) => !isIn(previousValue, value)) ??
    previousValue.find((value) => !isIn(nextValue, value))
  );
}

/**
 * The filterable implementation of `Select.Root`, rendered in its place when the root sits inside
 * `Select.FilterProvider`. Reached through the provider only, so a plain select never bundles it.
 *
 * @internal
 */
export function SelectFilterRoot<Value, Multiple extends boolean | undefined = false>(
  props: SelectFilterRoot.Props<Value, Multiple>,
): React.JSX.Element {
  const {
    children,
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    onValueChange,
    filterOptions,
    ...otherProps
  } = props;
  const {
    value: queryProp,
    defaultValue: defaultQuery = '',
    onValueChange: onQueryChange,
    filter,
    autoHighlight = false,
    locale,
    virtualized = false,
  } = filterOptions;

  const [open, setOpen] = useControlled({
    controlled: openProp,
    default: defaultOpen,
    name: 'SelectFilterRoot',
    state: 'open',
  });
  const [query, setQuery] = useControlled({
    controlled: queryProp,
    default: defaultQuery,
    name: 'SelectFilterRoot',
    state: 'value',
  });
  const [inputFocusVisible, setInputFocusVisible] = React.useState(false);
  // Navigation starts from the selected option until the query changes during this open. It
  // stays off through the exit, so closing doesn't highlight the selected option.
  const [queryChanged, setQueryChanged] = React.useState(false);
  const [previousOpen, setPreviousOpen] = React.useState(open);
  if (open !== previousOpen) {
    setPreviousOpen(open);
    if (open) {
      setQueryChanged(false);
    } else {
      // A controlled close bypasses `onOpenChange`, so a later programmatic open must not inherit
      // the keyboard opening.
      setInputFocusVisible(false);
    }
  }

  const focusOwnerRef = React.useRef<HTMLElement | null>(null);

  const handleQueryChange = useStableCallback(
    (nextQuery: string, details: SelectFilterProvider.ChangeEventDetails) => {
      onQueryChange?.(nextQuery, details);
      if (!details.isCanceled) {
        setQuery(nextQuery);
        setQueryChanged(true);
      }
    },
  );

  // The item a multiple select toggled while filtering, which stays highlighted once the query
  // clears and the full list returns.
  const toggledItemRef = React.useRef<ToggledItem | null>(null);
  // The selection before the latest change, to tell which item a press toggled.
  const lastSelectionRef = React.useRef<unknown>(undefined);

  const handleSelectionChange = useStableCallback(
    (nextValue: any, details: SelectRoot.ChangeEventDetails) => {
      const previousValue =
        otherProps.value !== undefined
          ? otherProps.value
          : (lastSelectionRef.current ?? otherProps.defaultValue);
      onValueChange?.(nextValue, details);
      if (details.isCanceled) {
        return;
      }
      lastSelectionRef.current = nextValue;
      if (!otherProps.multiple || details.reason !== REASONS.itemPress || query.trim() === '') {
        return;
      }

      const element = closest(getTarget(details.event) as Element | null, '[role="option"]');
      const clearDetails = createChangeEventDetails(REASONS.inputClear, details.event, undefined, {
        isItemPress: true,
      });
      toggledItemRef.current = {
        element,
        value: getToggledValue(
          nextValue,
          Array.isArray(previousValue) ? previousValue : [],
          otherProps.isItemEqualToValue ?? defaultItemEquality,
        ),
      };
      handleQueryChange('', clearDetails);
      if (clearDetails.isCanceled) {
        toggledItemRef.current = null;
      }
    },
  );

  const handleOpenChange = useStableCallback(
    (nextOpen: boolean, details: SelectRoot.OpenChangeEventDetails) => {
      onOpenChange?.(nextOpen, details);
      if (details.isCanceled) {
        return;
      }

      setOpen(nextOpen);
      setInputFocusVisible(nextOpen && isKeyboardOpen(details.reason, details.event));
    },
  );

  const renderVirtualFocusChildren = (navigationProps: HTMLProps) => (
    <SelectFilterDropdown
      openedByKeyboard={inputFocusVisible}
      value={query}
      filter={filter}
      autoHighlight={autoHighlight}
      locale={locale}
      virtualized={virtualized}
      toggledItemRef={toggledItemRef}
      onValueChange={handleQueryChange}
      navigationProps={navigationProps}
    >
      {children}
    </SelectFilterDropdown>
  );

  return (
    <SelectRootInternal
      {...otherProps}
      open={open}
      onOpenChange={handleOpenChange}
      onValueChange={handleSelectionChange}
      virtualFocus
      virtualFocusInitialHighlight={inputFocusVisible}
      virtualFocusSelectedIndex={query === '' && !queryChanged}
      virtualFocusRef={focusOwnerRef}
      allowEscape={!autoHighlight}
      resetOnPointerLeave={autoHighlight !== 'always'}
      renderVirtualFocusChildren={renderVirtualFocusChildren}
    />
  );
}

export interface SelectFilterRootProps<
  Value,
  Multiple extends boolean | undefined = false,
> extends SelectRoot.Props<Value, Multiple> {
  filterOptions: SelectFilterProviderOptions;
}

export namespace SelectFilterRoot {
  export type Props<Value, Multiple extends boolean | undefined = false> = SelectFilterRootProps<
    Value,
    Multiple
  >;
}
