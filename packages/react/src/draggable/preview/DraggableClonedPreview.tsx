'use client';
import type * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import type { DragPreviewSettings } from '../../types/drag';
import { useDeclaredPreview } from './useDeclaredPreview';

/**
 * Configures the drag preview while leaving it a clone of the source, which is what
 * a draggable shows by default.
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
  useDeclaredPreview(getProps, null);
  return null;
}

export type DraggableClonedPreviewProps = DragPreviewSettings;

export namespace DraggableClonedPreview {
  export type Props = DraggableClonedPreviewProps;
}
