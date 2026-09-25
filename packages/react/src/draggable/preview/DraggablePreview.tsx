'use client';
import * as React from 'react';
import { warn } from '@base-ui/utils/warn';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import type { BaseUIComponentProps } from '../../internals/types';
import type { DragKind, DragPreviewSettings, DragPreviewRenderParameters } from '../../types/drag';
import { DraggablePreviewElement } from './DraggablePreviewElement';
import { useDeclaredPreview } from './useDeclaredPreview';
import {
  createClonedDragPreviewElement,
  createDragPreviewHostElement,
} from '../../utils/drag-and-drop/synthetic/cloneDragPreview';

/**
 * Configures what follows the pointer during a drag.
 * Without children, it configures the default clone of the source and renders nothing.
 * With children, it renders them in a `<div>` element inserted beside the source
 * while dragging. That element reads React context from above the nearest `<Draggable.Provider>`.
 *
 * Documentation: [Base UI Draggable](https://base-ui.com/react/utils/draggable)
 */
export function DraggablePreview<TPayload, TDragData = unknown>(
  props: DraggablePreviewTypedProps<TPayload, TDragData>,
): React.ReactNode;
export function DraggablePreview(props: DraggablePreviewProps): React.ReactNode;
export function DraggablePreview<TPayload = unknown, TDragData = unknown>(
  props: DraggablePreviewProps | DraggablePreviewTypedProps<TPayload, TDragData>,
): React.ReactNode {
  const getProps = useStableCallback(() => props);
  const useClone = props.children == null || props.children === false;
  React.useEffect(() => {
    if (
      process.env.NODE_ENV !== 'production' &&
      useClone &&
      (props.className !== undefined || props.style !== undefined || props.render !== undefined)
    ) {
      warn(
        'Draggable.Preview received className, style, or render without custom children, so these props are ignored. ' +
          'Style the source element to customize its clone, or provide preview children. ' +
          'See https://base-ui.com/react/utils/draggable#preview.',
      );
    }
  }, [useClone, props.className, props.style, props.render]);

  // Resolved per drag, not per render.
  const render = useStableCallback(
    (parameters: DragPreviewRenderParameters<TPayload, TDragData>) => {
      // The settings belong to the engine, which reads them off the declaration;
      // everything else belongs to the rendered element.
      const { children, kind, offset, modifiers, disabled, container, ...componentProps } =
        getProps();
      // A typed preview must never call its render function with a payload of a
      // different kind. This can happen only when the part is composed under the
      // wrong root; decline the preview for that drag rather than violating the
      // callback's public type.
      if (kind !== undefined && !kind.matches(parameters.source)) {
        return null;
      }
      const resolved = typeof children === 'function' ? children(parameters) : children;
      // Declining the preview has to reach the engine as-is: it tears the host it
      // already built back down, which rendering an empty element would not.
      if (resolved == null || resolved === false) {
        return resolved;
      }
      return <DraggablePreviewElement componentProps={{ ...componentProps, children: resolved }} />;
    },
  );

  useDeclaredPreview<TPayload, TDragData>(
    getProps,
    useClone ? null : render,
    useClone ? createClonedDragPreviewElement : createDragPreviewHostElement,
    props.disabled === true,
  );

  return null;
}

export interface DraggablePreviewState {}

export interface DraggablePreviewProps
  extends
    Omit<
      BaseUIComponentProps<'div', DraggablePreviewState>,
      // - `children` is widened below.
      // - the engine creates the element at drag start, in the overlay rather than here,
      // so there is no node for a ref to point at when this component renders.
      'children' | 'ref'
    >,
    DragPreviewSettings {
  /**
   * Whether to show no preview. The drag still runs.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * The preview content. Omit it to clone the source instead.
   * Pass a function to build the content from the drag source when the drag starts.
   * It can return `null` to show no preview for that drag. Its `source.payload` is
   * `unknown` unless a `kind` is passed.
   */
  children?:
    React.ReactNode | ((parameters: DragPreviewRenderParameters) => React.ReactNode) | undefined;
  /** Omitted when the preview content doesn't depend on the payload. */
  kind?: undefined;
}

/**
 * Props for a preview whose content depends on the payload.
 */
type DraggablePreviewTypedProps<TPayload, TDragData = unknown> = Omit<
  DraggablePreviewProps,
  'children' | 'kind'
> & {
  /**
   * The kind of the dragged item, which types `source.payload` in the render function.
   * Drags of other kinds show no preview.
   */
  kind: DragKind<TPayload, TDragData>;
  /**
   * The preview content. Pass a function to build the content from the drag source
   * when the drag starts. It can return `null` to show no preview for that drag.
   */
  children?:
    | React.ReactNode
    | ((parameters: DragPreviewRenderParameters<TPayload, TDragData>) => React.ReactNode)
    | undefined;
};

export type DraggablePreviewRenderParameters<
  TPayload = unknown,
  TDragData = unknown,
> = DragPreviewRenderParameters<TPayload, TDragData>;

export namespace DraggablePreview {
  export type RenderParameters<
    TPayload = unknown,
    TDragData = unknown,
  > = DraggablePreviewRenderParameters<TPayload, TDragData>;
  export type State = DraggablePreviewState;
  export type Props<TPayload = unknown, TDragData = unknown> = unknown extends TPayload
    ? DraggablePreviewProps
    : DraggablePreviewTypedProps<TPayload, TDragData>;
}
