'use client';
import * as React from 'react';
import type { Side } from '@floating-ui/react';

export interface SelectPositionerContext {
  /**
   * The side of the anchor element the popup is positioned relative to.
   */
  side: Side | 'none';
  /**
   * The alignment of the anchor element the popup is positioned relative to.
   */
  alignment: 'start' | 'end' | 'center';
  arrowRef: React.MutableRefObject<Element | null>;
  arrowUncentered: boolean;
  arrowStyles: React.CSSProperties;
  /**
   * Determines if the popup has been positioned.
   */
  isPositioned: boolean;
  /**
   * Determines the align offset of the popup such that the trigger value and option value are
   * aligned on the x-axis.
   */
  optionTextOffset: number | null;
  setOptionTextOffset: React.Dispatch<React.SetStateAction<number | null>>;
}

export const SelectPositionerContext = React.createContext<SelectPositionerContext | undefined>();

if (process.env.NODE_ENV !== 'production') {
  SelectPositionerContext.displayName = 'SelectPositionerContext';
}

export function useSelectPositionerContext() {
  const context = React.useContext(SelectPositionerContext);
  if (context === undefined) {
    throw new Error('Base UI: SelectPositionerContext is undefined.');
  }
  return context;
}
