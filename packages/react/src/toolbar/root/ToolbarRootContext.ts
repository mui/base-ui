'use client';
import * as React from 'react';
import type { Orientation } from '../../utils/types';
import type { CompositeMetadata } from '../../composite/list/CompositeList';
import type { ToolbarRoot } from './ToolbarRoot';
import { throwMissingContextError } from '../../utils/errorHelper';

export interface ToolbarRootContext {
  disabled: boolean;
  orientation: Orientation;
  setItemMap: React.Dispatch<
    React.SetStateAction<Map<Node, CompositeMetadata<ToolbarRoot.ItemMetadata> | null>>
  >;
}

export const ToolbarRootContext = React.createContext<ToolbarRootContext | undefined>(undefined);

export function useToolbarRootContext(optional?: false): ToolbarRootContext;
export function useToolbarRootContext(optional: true): ToolbarRootContext | undefined;
export function useToolbarRootContext(optional?: boolean) {
  const context = React.useContext(ToolbarRootContext);
  if (context === undefined && !optional) {
    return throwMissingContextError('ToolbarRootContext', 'Toolbar', 'Toolbar.Root');
  }

  return context;
}
