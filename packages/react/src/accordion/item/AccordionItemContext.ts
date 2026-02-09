'use client';
import * as React from 'react';
import type { AccordionItem } from './AccordionItem';
import { useContext } from '../../utils/createContext';

export interface AccordionItemContext {
  open: boolean;
  state: AccordionItem.State;
  setTriggerId: (id: string | undefined) => void;
  triggerId?: string | undefined;
}

export const AccordionItemContext = React.createContext<AccordionItemContext | undefined>(
  undefined,
);

export function useAccordionItemContext() {
  return useContext(
    AccordionItemContext,
    'Base UI: AccordionItemContext is missing. Accordion parts must be placed within <Accordion.Item>.',
  );
}
