'use client';
import { useStore } from '@base-ui/utils/store';
import { useSharedCalendarRootContext } from '../root/SharedCalendarRootContext';
import { selectors } from '../store';

export function useCalendarContext() {
  const store = useSharedCalendarRootContext();

  return useStore(store, selectors.publicContext);
}
