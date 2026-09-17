'use client';

import * as React from 'react';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import type { DragPreviewContainer } from '../types/drag';
import { createKind } from '../utils/drag-and-drop/dragKind';
import { DraggableContext } from './DraggableContext';
import { DraggablePreviewProvider } from './preview-provider/DraggablePreviewProvider';

/**
 * Provides the default drag kind and custom preview boundary for its descendants.
 * Required above drag components and components calling drag hooks. Renders no DOM element.
 * Sources and targets without an explicit kind only match within the same provider.
 * Explicit kinds can match across providers; the manager remains page-wide.
 *
 * Documentation: [Base UI Draggable](https://base-ui.com/react/utils/draggable#provider)
 */
export function DraggableProvider(props: DraggableProviderProps): React.ReactNode {
  const { children, container } = props;
  const defaultKind = useRefWithInit(() => createKind<undefined>('default')).current;
  const contextValue = React.useMemo(() => ({ defaultKind }), [defaultKind]);

  return (
    <DraggableContext.Provider value={contextValue}>
      <DraggablePreviewProvider container={container}>{children}</DraggablePreviewProvider>
    </DraggableContext.Provider>
  );
}

export interface DraggableProviderProps {
  /** The drag sources, targets, hooks, and previews sharing this boundary. */
  children?: React.ReactNode | undefined;
  /** Default preview container. A preview-specific container takes precedence. */
  container?: DragPreviewContainer | undefined;
}

export namespace DraggableProvider {
  export type Props = DraggableProviderProps;
}
