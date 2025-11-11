'use client';
import * as React from 'react';
import { CommandPaletteStore } from '../store/CommandPaletteStore';

export interface CommandPaletteRootContextValue {
  readonly store: CommandPaletteStore;
}

export const CommandPaletteRootContext = React.createContext<CommandPaletteRootContextValue | null>(
  null,
);

export function useCommandPaletteRootContext(required: true): CommandPaletteRootContextValue;
export function useCommandPaletteRootContext(
  required?: false,
): CommandPaletteRootContextValue | null;
export function useCommandPaletteRootContext(
  required = false,
): CommandPaletteRootContextValue | null {
  const context = React.useContext(CommandPaletteRootContext);
  if (required && context === null) {
    throw new Error(
      'Base UI: CommandPaletteRootContext is missing. CommandPalette parts must be placed within <CommandPalette.Root>.',
    );
  }
  return context;
}
