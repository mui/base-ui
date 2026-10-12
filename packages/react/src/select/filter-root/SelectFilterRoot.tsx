'use client';
import * as React from 'react';
import { useControlled } from '@base-ui/utils/useControlled';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { isKeyboardOpen } from '../../utils/isKeyboardOpen';
import type { HTMLProps } from '../../internals/types';
import { SelectRootInternal } from '../root/SelectRoot';
import type { SelectRoot } from '../root/SelectRoot';
import type { SelectFilterProvider } from '../filter-provider/SelectFilterProvider';
import type { SelectFilterProviderOptions } from '../filter-provider/SelectFilterProviderOptions';
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
  // Navigation starts from the selected option until the query changes during this open.
  const [queryChanged, setQueryChanged] = React.useState(false);
  const [previousOpen, setPreviousOpen] = React.useState(open);
  if (open !== previousOpen) {
    setPreviousOpen(open);
    setQueryChanged(false);
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
