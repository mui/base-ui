'use client';
import * as React from 'react';
import type { AccordionItem } from './AccordionItem';

export interface AccordionItemContext {
  open: boolean;
  ownerState: AccordionItem.OwnerState;
  setTriggerId: (id: string | undefined) => void;
  triggerId?: string;
}
/**
 * @ignore - internal component.
 */
export const AccordionItemContext = React.createContext<AccordionItemContext | undefined>(
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
