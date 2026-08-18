'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import type { FilterDropdownRoot } from './FilterDropdownRootContext';

interface UseFilterDropdownCloseQueryParameters {
  open: boolean;
  value: string;
  onValueChange: (value: string, details: FilterDropdownRoot.ChangeEventDetails) => void;
  onOpenChangeComplete?: ((open: boolean) => void) | undefined;
}

/**
 * Clears the committed value when a filter popup closes while retaining the displayed query and
 * filtered items until the exit transition completes.
 */
export function useFilterDropdownCloseQuery(parameters: UseFilterDropdownCloseQueryParameters) {
  const { open, value, onValueChange, onOpenChangeComplete } = parameters;

  const [closeQuery, setCloseQuery] = React.useState<string | null>(null);
  const previousOpenRef = React.useRef(open);

  const handleOpenChange = useStableCallback((nextOpen: boolean) => {
    setCloseQuery(nextOpen ? null : value);
  });

  const handleOpenChangeComplete = useStableCallback((nextOpen: boolean) => {
    if (!nextOpen) {
      setCloseQuery(null);
    }
    onOpenChangeComplete?.(nextOpen);
  });

  useIsoLayoutEffect(() => {
    if (previousOpenRef.current && !open && value !== '') {
      if (closeQuery === null) {
        setCloseQuery(value);
      }
      onValueChange('', createChangeEventDetails(REASONS.popupClose));
    } else if (open && closeQuery !== null) {
      setCloseQuery(null);
    }
    previousOpenRef.current = open;
  }, [open, value, closeQuery, onValueChange]);

  return {
    query: !open && closeQuery !== null ? closeQuery : value,
    handleOpenChange,
    handleOpenChangeComplete,
  };
}
