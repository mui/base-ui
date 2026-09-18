'use client';
import * as React from 'react';
import { useControlled } from '@base-ui/utils/useControlled';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import type { FilterDropdownRoot as FilterDropdownRootNamespace } from '../../filter-dropdown/root/FilterDropdownRoot';
import { useFilterDropdownCloseQuery } from '../../filter-dropdown/root/useFilterDropdownCloseQuery';
import { isKeyboardOpen } from '../../menu/filter-root/isKeyboardOpen';
import type { HTMLProps } from '../../internals/types';
import { SelectRootInternal, type SelectRoot } from '../root/SelectRoot';
import type { SelectFilterRootFilterProps } from './SelectFilterRootFilterProps';
import { SelectFilterDropdown } from './SelectFilterDropdown';

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
    onOpenChangeComplete,
    inputValue: inputValueProp,
    defaultInputValue = '',
    onInputValueChange,
    filter,
    autoHighlight = false,
    locale,
    ...otherProps
  } = props;

  const [open, setOpen] = useControlled({
    controlled: openProp,
    default: defaultOpen,
    name: 'SelectFilterRoot',
    state: 'open',
  });
  const [inputValue, setInputValue] = useControlled({
    controlled: inputValueProp,
    default: defaultInputValue,
    name: 'SelectFilterRoot',
    state: 'inputValue',
  });
  const [inputFocusVisible, setInputFocusVisible] = React.useState(false);

  const focusOwnerRef = React.useRef<HTMLElement | null>(null);

  const handleInputValueChange = useStableCallback(
    (nextValue: string, details: SelectFilterRoot.InputValueChangeEventDetails) => {
      onInputValueChange?.(nextValue, details);
      if (!details.isCanceled) {
        setInputValue(nextValue);
      }
    },
  );

  const closeQuery = useFilterDropdownCloseQuery({
    open,
    value: inputValue,
    onValueChange: handleInputValueChange,
    onOpenChangeComplete,
  });

  const handleOpenChange = useStableCallback(
    (nextOpen: boolean, details: SelectRoot.ChangeEventDetails) => {
      onOpenChange?.(nextOpen, details);
      if (details.isCanceled) {
        return;
      }

      closeQuery.handleOpenChange(nextOpen);
      setOpen(nextOpen);
      setInputFocusVisible(nextOpen && isKeyboardOpen(details));
    },
  );

  const renderVirtualFocusChildren = (inputProps: HTMLProps) => (
    <SelectFilterDropdown
      open={open}
      inputFocusVisible={inputFocusVisible}
      value={inputValue}
      query={closeQuery.query}
      filter={filter}
      autoHighlight={autoHighlight}
      locale={locale}
      onValueChange={handleInputValueChange}
      inputProps={inputProps}
    >
      {children}
    </SelectFilterDropdown>
  );

  return (
    <SelectRootInternal
      {...otherProps}
      open={open}
      onOpenChange={handleOpenChange}
      onOpenChangeComplete={closeQuery.handleOpenChangeComplete}
      virtualFocus
      virtualFocusInitialHighlight={inputFocusVisible}
      virtualFocusRef={focusOwnerRef}
      allowEscape={!autoHighlight}
      resetOnPointerLeave={autoHighlight !== 'always'}
      renderVirtualFocusChildren={renderVirtualFocusChildren}
    />
  );
}

/**
 * Determines whether an item matches the current filter query.
 *
 * @param text The item's `label`, rendered text, or one of its `keywords`.
 * @param query The trimmed filter query.
 */
export type SelectFilterFunction = (text: string, query: string) => boolean;

export type SelectFilterRootProps<
  Value,
  Multiple extends boolean | undefined = false,
> = SelectRoot.Props<Value, Multiple> & SelectFilterRootFilterProps;

export type SelectFilterRootInputValueChangeEventReason =
  FilterDropdownRootNamespace.ChangeEventReason;
export type SelectFilterRootInputValueChangeEventDetails =
  FilterDropdownRootNamespace.ChangeEventDetails;

export namespace SelectFilterRoot {
  export type Props<Value, Multiple extends boolean | undefined = false> = SelectFilterRootProps<
    Value,
    Multiple
  >;
  export type InputValueChangeEventReason = SelectFilterRootInputValueChangeEventReason;
  export type InputValueChangeEventDetails = SelectFilterRootInputValueChangeEventDetails;
}
