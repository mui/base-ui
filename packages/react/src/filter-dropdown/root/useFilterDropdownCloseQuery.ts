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
 * Clears the committed value when a filter popup closes while retaining the displayed query and
 * filtered items until the exit transition completes.
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
      onValueChange('', createChangeEventDetails(REASONS.popupClose));
    } else if ((open || !mounted) && closeQuery !== null) {
      setCloseQuery(null);
    }
  }, [open, mounted, value, closeQuery, onValueChange]);

  return !open && closeQuery !== null ? closeQuery : value;
}
