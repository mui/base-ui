'use client';
import * as React from 'react';
import type { AccordionItemState } from './AccordionItem';

export interface AccordionItemContext {
  defaultTriggerId?: string | undefined;
  open: boolean;
  state: AccordionItemState;
  setTriggerId: React.Dispatch<React.SetStateAction<string | null | undefined>>;
  triggerId?: string | undefined;
}

export const AccordionItemContext = React.createContext<AccordionItemContext | undefined>(
  undefined,
);

export function useAccordionItemContext() {
  const context = React.useContext(AccordionItemContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: AccordionItemContext is missing. Accordion parts must be placed within <Accordion.Item>.',
    );
  }
  return context;
}
