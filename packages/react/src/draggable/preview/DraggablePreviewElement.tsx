'use client';
import * as React from 'react';
import { useRenderElement } from '../../internals/useRenderElement';
import type { DragPreviewSettings } from '../../types/drag';
import type { DraggablePreview } from './DraggablePreview';

const EMPTY_STATE: DraggablePreview.State = {};

/**
 * The element a `Draggable.Preview` declares. Rendered by the overlay, inside the
 * engine-owned host that follows the pointer — not where the `Draggable.Preview`
 * was written.
 * @internal
 */
export function DraggablePreviewElement(props: {
  componentProps: DraggablePreviewElement.ComponentProps;
}): React.ReactNode {
  const { componentProps } = props;
  const { className, style, render, children, ...elementProps } = componentProps;

  return useRenderElement('div', componentProps, {
    state: EMPTY_STATE,
    props: [{ children }, elementProps],
  });
}

export namespace DraggablePreviewElement {
  /** The `Draggable.Preview`'s own props, snapshotted at drag start. */
  export type ComponentProps = Omit<
    DraggablePreview.Props,
    'children' | keyof DragPreviewSettings
  > & {
    children?: React.ReactNode | undefined;
  };
}
