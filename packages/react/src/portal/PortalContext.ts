import * as React from 'react';

export const PortalContext = React.createContext<boolean | undefined>(undefined);

if (process.env.NODE_ENV !== 'production') {
  PortalContext.displayName = 'PortalContext';
}

export function usePortalContext() {
  const context = React.useContext(PortalContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: PortalContext is missing. Portal parts must be placed within the Root of a component.',
    );
  }
  return context;
}
