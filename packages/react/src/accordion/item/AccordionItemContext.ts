'use client';
import * as React from 'react';
import type { AccordionItem } from './AccordionItem';
import { throwMissingContextError } from '../../utils/errorHelper';

export interface AccordionItemContext {
  open: boolean;
  state: AccordionItem.State;
  setTriggerId: (id: string | undefined) => void;
  triggerId?: string;
}

export const AccordionItemContext = React.createContext<AccordionItemContext | undefined>(
  undefined,
);

export function useAccordionItemContext() {
  const context = React.useContext(AccordionItemContext);
  if (context === undefined) {
    return throwMissingContextError('AccordionItemContext', 'Accordion', 'Accordion.Item');
  }
  return context;
}
