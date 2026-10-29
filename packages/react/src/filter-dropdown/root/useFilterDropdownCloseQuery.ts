'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
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
  const pendingResetRef = React.useRef(false);

  const settlePendingReset = useStableCallback(() => {
    pendingResetRef.current = false;
    if (value !== '') {
      onValueChange('', createChangeEventDetails(REASONS.popupClose));
    }
  });

  useIsoLayoutEffect(() => {
    const wasOpen = previousOpenRef.current;
    previousOpenRef.current = open;
    if (wasOpen && !open && value !== '') {
      pendingResetRef.current = true;
      setCloseQuery(value);
    } else if ((open || !mounted) && closeQuery !== null) {
      // A reopen that interrupts the exit never unmounts, so it settles the pending reset too,
      // unless a new query replaced the one the reset would clear.
      setCloseQuery(null);
      if (value === closeQuery) {
        settlePendingReset();
      } else {
        pendingResetRef.current = false;
      }
    }
  }, [open, mounted, value, closeQuery, settlePendingReset]);

  useIsoLayoutEffect(
    () => () => {
      if (pendingResetRef.current) {
        settlePendingReset();
      }
    },
    [settlePendingReset],
  );

  return !open && closeQuery !== null ? closeQuery : value;
}
