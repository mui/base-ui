'use client';
import * as React from 'react';
import type { AccordionRoot } from './AccordionRoot';
import type { useAccordionRoot } from './useAccordionRoot';

export interface AccordionRootContext extends Omit<useAccordionRoot.ReturnValue, 'getRootProps'> {
  state: AccordionRoot.State;
  hiddenUntilFound: boolean;
}

export const AccordionRootContext = React.createContext<AccordionRootContext | undefined>(
  undefined,
);

if (process.env.NODE_ENV !== 'production') {
  AccordionRootContext.displayName = 'AccordionRootContext';
}

export function useAccordionRootContext() {
  const context = React.useContext(AccordionRootContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: AccordionRootContext is missing. Accordion parts must be placed within <Accordion.Root>.',
    );
  }
  return context;
}
