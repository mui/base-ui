'use client';
import * as React from 'react';
import type { Orientation } from '../../utils/types';
import type { TextDirection } from '../../direction-provider';
import type { AccordionRoot } from './AccordionRoot';

export interface AccordionRootContext<Value = any> {
  accordionItemRefs: React.RefObject<(HTMLElement | null)[]>;
  direction: TextDirection;
  disabled: boolean;
  handleValueChange: (newValue: AccordionRoot.Value<Value>[number], nextOpen: boolean) => void;
  hiddenUntilFound: boolean;
  keepMounted: boolean;
  loopFocus: boolean;
  orientation: Orientation;
  state: AccordionRoot.State<Value>;
  value: AccordionRoot.Value<Value>;
}

export const AccordionRootContext = React.createContext<AccordionRootContext<any> | undefined>(
  undefined,
);

export function useAccordionRootContext<Value = any>() {
  const context = React.useContext<AccordionRootContext<Value> | undefined>(AccordionRootContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: AccordionRootContext is missing. Accordion parts must be placed within <Accordion.Root>.',
    );
  }
  return context;
}
