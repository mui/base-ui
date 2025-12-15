'use client';
import * as React from 'react';
import type { AccordionItem } from './AccordionItem';
import { useContext } from '@base-ui/utils/useContext';

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
  const context = useContext(AccordionItemContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: AccordionItemContext is missing. Accordion parts must be placed within <Accordion.Item>.',
    );
  }
  return context;
}
