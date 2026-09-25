'use client';

import * as React from 'react';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { createKind } from '../utils/drag-and-drop/dragKind';
import { DraggableContext } from './DraggableContext';
import { DraggablePreviewProvider } from './preview-provider/DraggablePreviewProvider';

/**
 * Groups the drag sources, drop targets, and viewports of an interaction.
 * It provides the default kind used by parts that declare none, and gives custom
 * previews access to React context. Required above the Draggable parts and
 * `useManager`. Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Draggable](https://base-ui.com/react/utils/draggable#provider)
 */
export function DraggableProvider(props: DraggableProviderProps): React.ReactNode {
  const { children } = props;
  const defaultKind = useRefWithInit(() => createKind<undefined>('default')).current;
  const contextValue = React.useMemo(() => ({ defaultKind }), [defaultKind]);

  return (
    <DraggableContext.Provider value={contextValue}>
      <DraggablePreviewProvider>{children}</DraggablePreviewProvider>
    </DraggableContext.Provider>
  );
}

export interface DraggableProviderProps {
  /** The parts of the interaction. */
  children?: React.ReactNode | undefined;
}

export namespace DraggableProvider {
  export type Props = DraggableProviderProps;
}
