import * as React from 'react';
import { type CalendarKeyboardNavigation } from './CalendarKeyboardNavigation';

export interface SharedCalendarKeyboardNavigationContext {
  /**
   * Callback forwarded to the `onKeyDown` prop of the day grid body.
   */
  applyDayGridKeyboardNavigation: (event: React.KeyboardEvent) => void;
  /**
   * Register a day cell ref to be able to apply keyboard navigation.
   */
  registerDayGridCell: (refs: CalendarKeyboardNavigation.CellRefs) => () => void;
}

export const SharedCalendarKeyboardNavigationContext =
  React.createContext<SharedCalendarKeyboardNavigationContext>({
    applyDayGridKeyboardNavigation: () => {},
    registerDayGridCell: () => () => {},
  });

export function useSharedCalendarKeyboardNavigationContext() {
  return React.useContext(SharedCalendarKeyboardNavigationContext);
}
