'use client';
import * as React from 'react';
import type { Side, Align } from '../../utils/useAnchorPositioning';

export interface ComboboxPositionerContext {
  side: Side;
  align: Align;
  arrowRef: React.RefObject<Element | null>;
  arrowUncentered: boolean;
  arrowStyles: React.CSSProperties;
}

export const ComboboxPositionerContext = React.createContext<ComboboxPositionerContext | undefined>(
  undefined,
);

export function useComboboxPositionerContext() {
  const context = React.useContext(ComboboxPositionerContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: <Combobox.Popup> and <Combobox.Arrow> must be used within the <Combobox.Positioner> component',
    );
  }
  return context;
}
