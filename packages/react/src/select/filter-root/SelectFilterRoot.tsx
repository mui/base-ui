'use client';
import * as React from 'react';
import { useControlled } from '@base-ui/utils/useControlled';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import type { FilterDropdownRoot as FilterDropdownRootNamespace } from '../../filter-dropdown/root/FilterDropdownRoot';
import { isKeyboardOpen } from './isKeyboardOpen';
import type { HTMLProps } from '../../internals/types';
import { SelectRootInternal } from '../root/SelectRoot';
import type { SelectRoot } from '../root/SelectRoot';
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

  const handleOpenChange = useStableCallback(
    (nextOpen: boolean, details: SelectRoot.OpenChangeEventDetails) => {
      onOpenChange?.(nextOpen, details);
      if (details.isCanceled) {
        return;
      }

      setOpen(nextOpen);
      setInputFocusVisible(nextOpen && isKeyboardOpen(details));
    },
  );

  const renderVirtualFocusChildren = (navigationProps: HTMLProps) => (
    <SelectFilterDropdown
      openedByKeyboard={inputFocusVisible}
      value={inputValue}
      filter={filter}
      autoHighlight={autoHighlight}
      locale={locale}
      onValueChange={handleInputValueChange}
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
 * @param text The item's `label`, or its rendered text when the prop is not set.
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
