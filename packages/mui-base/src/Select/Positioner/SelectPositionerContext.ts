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
  isPositioned: boolean;
  optionTextOffset: number | null;
  setOptionTextOffset: React.Dispatch<React.SetStateAction<number | null>>;
}

export const SelectPositionerContext = React.createContext<SelectPositionerContext | null>(null);

if (process.env.NODE_ENV !== 'production') {
  SelectPositionerContext.displayName = 'SelectPositionerContext';
}

export function useSelectPositionerContext() {
  const context = React.useContext(SelectPositionerContext);
  if (context === null) {
    throw new Error(
      'Base UI: <Select.Popup> must be used within the <Select.Positioner> component',
    );
  }
  return context;
}
