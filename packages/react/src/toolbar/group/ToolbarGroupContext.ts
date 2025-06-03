import * as React from 'react';
import { throwMissingContextError } from '../../utils/errorHelper';

export interface ToolbarGroupContext {
  disabled: boolean;
}

export const ToolbarGroupContext = React.createContext<ToolbarGroupContext | undefined>(undefined);

export function useToolbarGroupContext(optional?: false): ToolbarGroupContext;
export function useToolbarGroupContext(optional: true): ToolbarGroupContext | undefined;
export function useToolbarGroupContext(optional?: boolean) {
  const context = React.useContext(ToolbarGroupContext);
  if (context === undefined && !optional) {
    return throwMissingContextError('ToolbarGroupContext', 'ToolbarGroup', 'Toolbar.Group');
  }
  return context;
}
