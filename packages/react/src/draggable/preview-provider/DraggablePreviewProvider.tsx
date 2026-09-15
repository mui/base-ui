'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import type { DragPreviewContainer } from '../../types/drag';
import { DragPreviewContext } from '../../utils/drag-and-drop/overlay/DragPreviewContext';
import { PreviewOverlayRenderer } from '../../utils/drag-and-drop/overlay/PreviewOverlayRenderer';

/**
 * The React tree custom drag previews render in. Preview content receives context
 * from providers above this component, but not from providers nested between it
 * and an individual draggable. Place it inside every local context boundary the
 * preview needs. Renders no element of its own.
 *
 * This provider is optional for the default clone and `Draggable.ClonedPreview`.
 *
 * Documentation: [Base UI Draggable](https://base-ui.com/react/components/draggable)
 */
export const DraggablePreviewProvider: React.FC<DraggablePreviewProvider.Props> =
  function DraggablePreviewProvider(props) {
    const { children, container } = props;

    // `container` is read at drag start, so it goes into the context through this
    // stable getter rather than by value: every `Draggable.Root` below consumes this
    // context, so an inline `container` callback — a new identity each render —
    // would otherwise churn the context value and re-render them all.
    const getContainer = useStableCallback(() => container);

    const contextValue = React.useMemo(() => ({ getContainer }), [getContainer]);

    return (
      <DragPreviewContext.Provider value={contextValue}>
        {children}
        <PreviewOverlayRenderer previewContext={contextValue} />
      </DragPreviewContext.Provider>
    );
  };

export interface DraggablePreviewProviderState {}

export interface DraggablePreviewProviderProps {
  /**
   * The part of your app whose custom drag previews render in this provider.
   */
  children?: React.ReactNode | undefined;
  /**
   * Where to inject the previews of the sources inside this provider, overriding
   * the default of the source's own parent. A preview's own `container` wins over
   * it. A callback resolves it from the source,
   * for example `(source) => source.closest('.grid')`.
   */
  container?: DragPreviewContainer | undefined;
}

export namespace DraggablePreviewProvider {
  export type State = DraggablePreviewProviderState;
  export type Props = DraggablePreviewProviderProps;
}
