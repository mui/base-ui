'use client';
import * as React from 'react';
import { warn } from '@base-ui/utils/warn';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import type { BaseUIComponentProps } from '../../internals/types';
import type { DragKind, DragPreviewSettings, DragPreviewRenderEvent } from '../../types/drag';
import { DraggablePreviewElement } from './DraggablePreviewElement';
import { useDeclaredPreview } from './useDeclaredPreview';
import {
  createClonedDragPreviewElement,
  createDragPreviewHostElement,
} from '../../utils/drag-and-drop/synthetic/cloneDragPreview';

/**
 * Customizes what follows the pointer while the draggable is dragged.
 * Omit children, or pass null or false, to configure the default clone of the source.
 * Renders a `<div>` beside the source in the DOM by default, and nothing where the
 * component is written. Receives React context from above the nearest `Draggable.Provider`.
 * Place the provider inside any contexts the preview needs.
 *
 * Documentation: [Base UI Draggable](https://base-ui.com/react/utils/draggable)
 */
export function DraggablePreview<TPayload>(
  props: DraggablePreviewTypedProps<TPayload>,
): React.ReactNode;
export function DraggablePreview(props: DraggablePreviewProps): React.ReactNode;
export function DraggablePreview<TPayload = unknown>(
  props: DraggablePreviewProps | DraggablePreviewTypedProps<TPayload>,
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
  const render = useStableCallback((parameters: DragPreviewRenderEvent<TPayload>) => {
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
  });

  useDeclaredPreview<TPayload>(
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
   * Whether to hide the preview. The drag continues while no preview is shown.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * The preview content. Omit it, or pass null or false, to clone the source.
   * A render function returning null or false hides the preview. Pass a function
   * to build it from the drag payload, resolved once at drag start.
   * Its payload is `unknown` until a `kind` is
   * supplied through {@link DraggablePreviewTypedProps}.
   */
  children?:
    React.ReactNode | ((parameters: DragPreviewRenderEvent) => React.ReactNode) | undefined;
  /** Omitted on an untyped preview. */
  kind?: undefined;
}

/**
 * Props for a payload-aware preview. `kind` both types the render callback and
 * checks the active source before that callback runs.
 */
export type DraggablePreviewTypedProps<TPayload> = Omit<
  DraggablePreviewProps,
  'children' | 'kind'
> & {
  /** The source kind whose payload the render callback accepts. */
  kind: DragKind<TPayload>;
  /** Preview content, resolved once at drag start with the kind's payload type. */
  children?:
    | React.ReactNode
    | ((parameters: DragPreviewRenderEvent<TPayload>) => React.ReactNode)
    | undefined;
};

export namespace DraggablePreview {
  export type State = DraggablePreviewState;
  export type Props<TPayload = unknown> = unknown extends TPayload
    ? DraggablePreviewProps
    : DraggablePreviewTypedProps<TPayload>;
}
