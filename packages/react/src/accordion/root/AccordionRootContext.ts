'use client';
import * as React from 'react';
import { useContext } from '@base-ui/utils/createContext';
import type { Orientation } from '../../utils/types';
import type { TextDirection } from '../../direction-provider';
import type { AccordionRoot, AccordionValue } from './AccordionRoot';

export interface AccordionRootContext {
  accordionItemRefs: React.RefObject<(HTMLElement | null)[]>;
  direction: TextDirection;
  disabled: boolean;
  handleValueChange: (newValue: number | string, nextOpen: boolean) => void;
  hiddenUntilFound: boolean;
  keepMounted: boolean;
  loopFocus: boolean;
  orientation: Orientation;
  state: AccordionRoot.State;
  value: AccordionValue;
}

export const AccordionRootContext = React.createContext<AccordionRootContext | undefined>(
  undefined,
);

export function useAccordionRootContext() {
  return useContext(
    AccordionRootContext,
    'Base UI: AccordionRootContext is missing. Accordion parts must be placed within <Accordion.Root>.',
  );
}
