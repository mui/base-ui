import * as React from 'react';

export interface ToolbarGroupContext {
  disabled: boolean;
}

export const ToolbarGroupContext = React.createContext<ToolbarGroupContext | undefined>(undefined);

if (process.env.NODE_ENV !== 'production') {
  ToolbarGroupContext.displayName = 'ToolbarGroupContext';
}

function useToolbarGroupContext(optional?: false): ToolbarGroupContext;
function useToolbarGroupContext(optional: true): ToolbarGroupContext | undefined;
function useToolbarGroupContext(optional?: boolean) {
  const context = React.useContext(ToolbarGroupContext);
  if (context === undefined && !optional) {
    throw new Error(
      'Base UI: ToolbarGroupContext is missing. ToolbarGroup parts must be placed within <Toolbar.Group>.',
    );
  }
  return context;
}

export { useToolbarGroupContext };
