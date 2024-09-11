'use client';
import * as React from 'react';
import type { AccordionItem } from './AccordionItem';

/**
 * @ignore - internal component.
 */
export const AccordionItemContext = React.createContext<AccordionItem.Context | undefined>(
  undefined,
);

if (process.env.NODE_ENV !== 'production') {
  AccordionItemContext.displayName = 'AccordionItemContext';
}

export function useAccordionItemContext() {
  const context = React.useContext(AccordionItemContext);
  if (context === undefined) {
    throw new Error('useAccordionItemContext must be used inside the <Accordion.Item /> component');
  }
  return context;
}
