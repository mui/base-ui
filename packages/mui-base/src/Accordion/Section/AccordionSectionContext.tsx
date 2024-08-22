'use client';
import * as React from 'react';
import type { AccordionSection } from './AccordionSection';

/**
 * @ignore - internal component.
 */
export const AccordionSectionContext = React.createContext<AccordionSection.Context | undefined>(
  undefined,
);

if (process.env.NODE_ENV !== 'production') {
  AccordionSectionContext.displayName = 'AccordionSectionContext';
}

export function useAccordionSectionContext() {
  const context = React.useContext(AccordionSectionContext);
  if (context === undefined) {
    throw new Error(
      'useAccordionSectionContext must be used inside the <Accordion.Section /> component',
    );
  }
  return context;
}
