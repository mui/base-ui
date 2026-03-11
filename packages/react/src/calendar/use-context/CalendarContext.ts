'use client';
import * as React from 'react';
import { useStore } from '@base-ui/utils/store';
import { useSharedCalendarRootContext } from '../root/SharedCalendarRootContext';
import { selectors } from '../store';

export type CalendarContext = ReturnType<typeof selectors.publicContext> & {
  setVisibleDate: ReturnType<typeof useSharedCalendarRootContext>['setVisibleDate'];
};

export function useCalendarContext(): CalendarContext {
  const store = useSharedCalendarRootContext();
  const calendarPublicContext = useStore(store, selectors.publicContext);

  return React.useMemo(
    () => ({ ...calendarPublicContext, setVisibleDate: store.setVisibleDate }),
    [calendarPublicContext, store.setVisibleDate],
  );
}
