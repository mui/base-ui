'use client';
import * as React from 'react';
import type { AccordionRoot } from './AccordionRoot';

/**
 * @ignore - internal component.
 */
export const AccordionRootContext = React.createContext<AccordionRoot.Context | undefined>(
  undefined,
);

if (process.env.NODE_ENV !== 'production') {
  AccordionRootContext.displayName = 'AccordionRootContext';
}

export function useAccordionRootContext() {
  const context = React.useContext(AccordionRootContext);
  if (context === undefined) {
    throw new Error('useAccordionRootContext must be used inside a Accordion component');
  }
  return context;
}
