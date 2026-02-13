'use client';
import * as React from 'react';
import { useStore } from '@base-ui/utils/store';
import { TemporalSupportedObject } from '../../types/temporal';
import { SharedCalendarRootContext } from '../root/SharedCalendarRootContext';
import { selectors } from '../store';

export interface CalendarContext {
  /**
   * The currently visible date.
   */
  visibleDate: TemporalSupportedObject;
}

export function useCalendarContext() {
  const store = React.useContext(SharedCalendarRootContext);
  if (store === undefined) {
    throw new Error(
      'Base UI: SharedCalendarRootContext is missing. Calendar parts must be placed within <Calendar.Root />.',
    );
  }

  return useStore(store, selectors.publicContext);
}
