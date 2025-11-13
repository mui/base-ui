'use client';
import * as React from 'react';

export const CommandPalettePortalContext = React.createContext<boolean>(false);

export function useCommandPalettePortalContext(): boolean {
  return React.useContext(CommandPalettePortalContext);
}
