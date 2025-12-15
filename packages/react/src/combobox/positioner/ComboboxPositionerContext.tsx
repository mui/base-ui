'use client';
import * as React from 'react';
import type { Side, Align } from '../../utils/useAnchorPositioning';
import { useContext } from '@base-ui/utils/useContext';

export interface ComboboxPositionerContext {
  side: Side;
  align: Align;
  arrowRef: React.RefObject<Element | null>;
  arrowUncentered: boolean;
  arrowStyles: React.CSSProperties;
  anchorHidden: boolean;
  isPositioned: boolean;
}

export const ComboboxPositionerContext = React.createContext<ComboboxPositionerContext | undefined>(
  undefined,
);

export function useComboboxPositionerContext(optional?: false): ComboboxPositionerContext;
export function useComboboxPositionerContext(optional: true): ComboboxPositionerContext | undefined;
export function useComboboxPositionerContext(optional?: boolean) {
  const context = useContext(ComboboxPositionerContext);
  if (context === undefined && !optional) {
    throw new Error(
      'Base UI: <Combobox.Popup> and <Combobox.Arrow> must be used within the <Combobox.Positioner> component',
    );
  }
  return context;
}
