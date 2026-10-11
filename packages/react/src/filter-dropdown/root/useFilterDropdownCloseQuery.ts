'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import type { FilterDropdownRoot } from './FilterDropdownRootContext';

interface UseFilterDropdownCloseQueryParameters {
  open: boolean;
  mounted: boolean;
  value: string;
  onValueChange: (value: string, details: FilterDropdownRoot.ChangeEventDetails) => void;
}

/**
 * Retains the displayed query and filtered items while a filter popup closes, and clears the
 * committed value once it has unmounted. The input lives inside the popup, so the value stays in
 * use until then: clearing it earlier would change whatever the consumer renders from it, such
 * as externally filtered items, while the popup animates out.
 */
export function useFilterDropdownCloseQuery(parameters: UseFilterDropdownCloseQueryParameters) {
  const { open, mounted, value, onValueChange } = parameters;

  const [closeQuery, setCloseQuery] = React.useState<string | null>(null);

  const previousOpenRef = React.useRef(open);

  useIsoLayoutEffect(() => {
    const wasOpen = previousOpenRef.current;
    previousOpenRef.current = open;
    if (wasOpen && !open && value !== '') {
      setCloseQuery(value);
    } else if ((open || !mounted) && closeQuery !== null) {
      // A reopen that interrupts the exit never unmounts, so it settles the pending reset too.
      setCloseQuery(null);
      if (value !== '') {
        onValueChange('', createChangeEventDetails(REASONS.popupClose));
      }
    }
  }, [open, mounted, value, closeQuery, onValueChange]);

  return !open && closeQuery !== null ? closeQuery : value;
}
