'use client';
import * as React from 'react';
import { DateAdapter } from '../models/date-adapter';

export type DateAdapterContext = {
  adapter: DateAdapter<any>;
};

/**
 * @internal
 */
export const DateAdapterContext = React.createContext<DateAdapterContext | undefined>(undefined);

export function useDateAdapter() {
  const context = React.useContext(DateAdapterContext);
  if (context === undefined) {
    throw new Error('Base UI: DateAdapterContext is missing.');
  }

  return context.adapter;
}
