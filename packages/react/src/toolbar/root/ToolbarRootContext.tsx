'use client';
import * as React from 'react';
import type { CompositeMetadata } from '../../composite/list/CompositeList';
import type { ToolbarButtonMetadata } from '../button/ToolbarButton';
import type { ToolbarOrientation } from './ToolbarRoot';

export interface ToolbarRootContext {
  disabled: boolean;
  orientation: ToolbarOrientation;
  setItemMap: React.Dispatch<
    React.SetStateAction<Map<Node, CompositeMetadata<ToolbarButtonMetadata> | null>>
  >;
}

/**
 * @ignore - internal component.
 */
export const ToolbarRootContext = React.createContext<ToolbarRootContext | undefined>(undefined);

if (process.env.NODE_ENV !== 'production') {
  ToolbarRootContext.displayName = 'ToolbarRootContext';
}

function useToolbarRootContext(optional?: false): ToolbarRootContext;
function useToolbarRootContext(optional: true): ToolbarRootContext | undefined;
function useToolbarRootContext(optional?: boolean) {
  const context = React.useContext(ToolbarRootContext);
  if (context === undefined && !optional) {
    throw new Error(
      'Base UI: ToolbarRootContext is missing. Toolbar parts must be placed within <Toolbar.Root>.',
    );
  }

  return context;
}

export { useToolbarRootContext };
