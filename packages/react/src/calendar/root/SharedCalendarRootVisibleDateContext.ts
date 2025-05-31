import * as React from 'react';
import { TemporalSupportedObject } from '../../models';

export interface SharedCalendarRootVisibleDateContext {
  /**
   * The date currently visible.
   */
  visibleDate: TemporalSupportedObject;
}

export const SharedCalendarRootVisibleDateContext = React.createContext<
  SharedCalendarRootVisibleDateContext | undefined
>(undefined);

export function useSharedCalendarRootVisibleDateContext() {
  const context = React.useContext(SharedCalendarRootVisibleDateContext);
  if (context === undefined) {
    throw new Error(
      [
        'Base UI: SharedCalendarRootVisibleDateContext is missing.',
        'Calendar parts must be placed within <Calendar.Root /> and Range Calendar parts must be placed within <RangeCalendar.Root />.',
      ].join('\n'),
    );
  }
  return context;
}
