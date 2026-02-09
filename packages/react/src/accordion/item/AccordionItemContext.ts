'use client';
import * as React from 'react';
import { useContext } from '@base-ui/utils/createContext';
import type { AccordionItem } from './AccordionItem';

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
