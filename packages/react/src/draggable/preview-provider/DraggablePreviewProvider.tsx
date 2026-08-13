'use client';
import * as React from 'react';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useValueAsRef } from '@base-ui/utils/useValueAsRef';
import type { DragPreviewContainer } from '../../types/drag';
import { createDragPreviewStore } from '../../utils/drag-and-drop/overlay/dragPreviewStore';
import { DragPreviewContext } from '../../utils/drag-and-drop/overlay/DragPreviewContext';
import { PreviewOverlayRenderer } from '../../utils/drag-and-drop/overlay/PreviewOverlayRenderer';

/**
 * The React tree the drag previews of the sources inside it render in, so their
 * content reaches the context around it. Renders no element of its own.
 *
 * Documentation: [Base UI Draggable](https://base-ui.com/react/components/draggable)
 */
export const DraggablePreviewProvider: React.FC<DraggablePreviewProvider.Props> =
  function DraggablePreviewProvider(props) {
    const { children, container } = props;

    const previewStore = useRefWithInit(createDragPreviewStore).current;

    // `container` is read at drag start, so it goes into the context through this
    // stable ref rather than by value: every `Draggable.Root` below consumes this
    // context, so an inline `container` callback — a new identity each render —
    // would otherwise churn the context value and re-render them all.
    const containerRef = useValueAsRef(container);

    const contextValue = React.useMemo(
      () => ({ previewStore, containerRef }),
      [previewStore, containerRef],
    );

    return (
      <DragPreviewContext.Provider value={contextValue}>
        {children}
        <PreviewOverlayRenderer previewStore={previewStore} />
      </DragPreviewContext.Provider>
    );
  };

export interface DraggablePreviewProviderState {}

export interface DraggablePreviewProviderProps {
  /**
   * The part of your app whose drag previews render in this provider.
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
