'use client';
import type * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import type { DragPreviewSettings } from '../../types/drag';
import { useDeclaredPreview } from './useDeclaredPreview';
import { createClonedDragPreviewElement } from '../../utils/drag-and-drop/synthetic/cloneDragPreview';

/**
 * Configures the sanitized clone of the source shown by default.
 * Renders nothing.
 *
 * Reach for it to place or constrain the default cloned preview.
 * Use a `Draggable.Preview` instead to replace the clone with your own content.
 *
 * The clone carries the source's own classes, so style it with `[data-drag-preview]`
 * the way you would without this part.
 *
 * Documentation: [Base UI Draggable](https://base-ui.com/react/components/draggable)
 */
export function DraggableClonedPreview(props: DraggableClonedPreview.Props): React.ReactNode {
  const getProps = useStableCallback(() => props);
  useDeclaredPreview(getProps, null, createClonedDragPreviewElement);
  return null;
}

export type DraggableClonedPreviewProps = DragPreviewSettings;

export namespace DraggableClonedPreview {
  export type Props = DraggableClonedPreviewProps;
}
