'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { SelectRootInternal } from '../root/SelectRoot';
import type { SelectRoot } from '../root/SelectRoot';
import type { SelectFilterProviderOptions } from '../filter-provider/SelectFilterProviderOptions';
import { SelectFilterProviderContext } from '../filter-provider/SelectFilterProviderContext';
import { SelectFilterDropdown } from './SelectFilterDropdown';
import type { SelectFilterRootHandlers } from './SelectFilterDropdown';

/**
 * The filterable implementation of `Select.Root`, rendered in its place when the root sits inside
 * `Select.FilterProvider`. Reached through the provider only, so a plain select never bundles it.
 *
 * @internal
 */
export function SelectFilterRoot<Value, Multiple extends boolean | undefined = false>(
  props: SelectFilterRoot.Props<Value, Multiple>,
): React.JSX.Element {
  const { children, onOpenChange, onValueChange, filterOptions, ...otherProps } = props;
  const { autoHighlight = false } = filterOptions;

  // The dropdown below handles the root's committed changes: it records keyboard opens and clears
  // the query when a multiple select's item is pressed.
  const handlersRef = React.useRef<SelectFilterRootHandlers | null>(null);

  const handleOpenChange = useStableCallback(
    (open: boolean, eventDetails: SelectRoot.OpenChangeEventDetails) => {
      onOpenChange?.(open, eventDetails);
      if (!eventDetails.isCanceled) {
        handlersRef.current?.onOpenChange(open, eventDetails);
      }
    },
  );

  const handleValueChange = useStableCallback(
    (value: any, eventDetails: SelectRoot.ChangeEventDetails) => {
      onValueChange?.(value, eventDetails);
      if (!eventDetails.isCanceled) {
        handlersRef.current?.onValueChange(value, eventDetails);
      }
    },
  );

  return (
    // The root consumes its provider so a plain select nested inside doesn't inherit it.
    <SelectFilterProviderContext.Provider value={null}>
      <SelectRootInternal
        {...otherProps}
        onOpenChange={handleOpenChange}
        onValueChange={handleValueChange}
        filterable
        allowEscape={!autoHighlight}
        resetOnPointerLeave={autoHighlight !== 'always'}
      >
        <SelectFilterDropdown {...filterOptions} handlersRef={handlersRef}>
          {children}
        </SelectFilterDropdown>
      </SelectRootInternal>
    </SelectFilterProviderContext.Provider>
  );
}

export interface SelectFilterRootProps<
  Value,
  Multiple extends boolean | undefined = false,
> extends SelectRoot.Props<Value, Multiple> {
  /** The props of `Select.FilterProvider`, kept apart since the query's `value` would clash. */
  filterOptions: SelectFilterProviderOptions;
}

export namespace SelectFilterRoot {
  export type Props<Value, Multiple extends boolean | undefined = false> = SelectFilterRootProps<
    Value,
    Multiple
  >;
}
