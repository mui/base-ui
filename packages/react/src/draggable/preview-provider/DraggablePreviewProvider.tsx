'use client';
import * as React from 'react';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { DragPreviewContext } from '../../utils/drag-and-drop/overlay/DragPreviewContext';
import { PreviewOverlayRenderer } from '../../utils/drag-and-drop/overlay/PreviewOverlayRenderer';

/**
 * The React tree custom drag previews render in. Preview content receives context
 * from providers above this component, but not from providers nested between it
 * and an individual draggable. Place it inside every local context boundary the
 * preview needs. Renders no element of its own.
 *
 * Internal preview boundary rendered by the required `Draggable.Provider`.
 *
 * Documentation: [Base UI Draggable](https://base-ui.com/react/utils/draggable)
 */
export const DraggablePreviewProvider: React.FC<DraggablePreviewProvider.Props> =
  function DraggablePreviewProvider(props) {
    const { children } = props;
    const contextValue = useRefWithInit(() => Symbol('DragPreviewContext')).current;

    return (
      <DragPreviewContext.Provider value={contextValue}>
        {children}
        <PreviewOverlayRenderer previewContext={contextValue} />
      </DragPreviewContext.Provider>
    );
  };

export interface DraggablePreviewProviderProps {
  /**
   * The part of your app whose custom drag previews render in this provider.
   */
  children?: React.ReactNode | undefined;
}

export namespace DraggablePreviewProvider {
  export type Props = DraggablePreviewProviderProps;
}
