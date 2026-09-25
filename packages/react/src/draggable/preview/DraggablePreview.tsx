'use client';
import * as React from 'react';
import { warn } from '@base-ui/utils/warn';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import type { BaseUIComponentProps } from '../../internals/types';
import type {
  DraggableKind,
  DraggableInput,
  DraggableLocationHistory,
  DraggablePosition,
} from '../DraggableProvider';
import { DraggablePreviewElement } from './DraggablePreviewElement';
import { useDeclaredPreview } from './useDeclaredPreview';
import {
  createClonedDragPreviewElement,
  createDragPreviewHostElement,
} from '../../utils/drag-and-drop/synthetic/cloneDragPreview';
import type { DraggableRootModifiers, DraggableRootRecord } from '../root/DraggableRoot';

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
    (parameters: DraggablePreviewRenderParameters<TPayload, TDragData>) => {
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
    DraggablePreviewSettings {
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
    | React.ReactNode
    | ((parameters: DraggablePreviewRenderParameters) => React.ReactNode)
    | undefined;
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
  kind: DraggableKind<TPayload, TDragData>;
  /**
   * The preview content. Pass a function to build the content from the drag source
   * when the drag starts. It can return `null` to show no preview for that drag.
   */
  children?:
    | React.ReactNode
    | ((parameters: DraggablePreviewRenderParameters<TPayload, TDragData>) => React.ReactNode)
    | undefined;
};

/**
 * The argument of `<Draggable.Preview>`'s children function and of `registerSource`'s
 * `preview.render`, called when the drag starts.
 */
export interface DraggablePreviewRenderParameters<TSourcePayload = unknown, TDragData = unknown> {
  /** The item being dragged. */
  source: DraggableRootRecord<TSourcePayload, TDragData>;
  /** The pointer position and drop targets when the drag started. */
  location: DraggableLocationHistory;
}

/** Parameters passed to a drag preview's `offset` callback. */
export interface DraggablePreviewOffsetParameters {
  /** The preview element, after its content has rendered, so it has a size. */
  container: HTMLElement;
  /** The drag source element's bounding rect at drag start, in client coordinates. */
  sourceRect: DOMRect;
  /** Pointer state at drag start. */
  input: DraggableInput;
}

/**
 * Where the drag preview sits relative to the pointer.
 *
 * - `'source'`: The preview lifts off the source without shifting.
 * - `'pointer'`: The preview's top-left corner sits under the pointer.
 * - `DraggablePosition`: A fixed offset from the preview's top-left corner to the pointer, in CSS pixels.
 * - `function`: Called when the drag starts with the rendered preview, the source's
 *   rectangle, and the pointer state. Returns the offset to use.
 */
export type DraggablePreviewOffset =
  | DraggablePosition
  | 'source'
  | 'pointer'
  | ((parameters: DraggablePreviewOffsetParameters) => DraggablePosition);

/**
 * Where the drag preview element is inserted in the DOM.
 *
 * - `HTMLElement`: This element.
 * - `RefObject`: The element the ref points to.
 * - `function`: Called when the drag starts with the source element. Returns the
 *   container, or `null` to use the default.
 */
export type DraggablePreviewContainer =
  | HTMLElement
  | { current: HTMLElement | null }
  | ((source: HTMLElement) => HTMLElement | null | undefined);

/**
 * How the drag preview is positioned. Read once, when the drag starts.
 */
export interface DraggablePreviewSettings {
  /**
   * Where the preview sits relative to the pointer.
   * @default 'source'
   */
  offset?: DraggablePreviewOffset | undefined;
  /**
   * One or more modifiers that constrain the preview only. The drop position still
   * follows the pointer. To constrain the drag itself, use `modifiers` on `Draggable.Root`.
   */
  modifiers?: DraggableRootModifiers | undefined;
  /**
   * Whether to show no preview. The drag still runs.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * Where to insert the preview element in the DOM. Defaults to beside the source,
   * so the same CSS applies to it. Pass a container to keep selectors such as
   * `:last-child` on the source's siblings unchanged during the drag.
   */
  container?: DraggablePreviewContainer | undefined;
}

/**
 * The drag preview of a source registered with `registerSource`.
 * Omit it to use a clone of the source. `Draggable.Root` uses `Draggable.Preview` instead.
 */
export interface DraggablePreviewParameters<
  TSourcePayload = unknown,
  TDragData = unknown,
> extends DraggablePreviewSettings {
  /**
   * Renders the preview content instead of cloning the source.
   * Return `null` to show no preview for this drag. It plays the role of
   * `<Draggable.Preview>`'s children function, not of its `render` prop.
   */
  render?:
    | ((parameters: DraggablePreviewRenderParameters<TSourcePayload, TDragData>) => React.ReactNode)
    | undefined;
}

export namespace DraggablePreview {
  export type Offset = DraggablePreviewOffset;
  export type OffsetParameters = DraggablePreviewOffsetParameters;
  export type Container = DraggablePreviewContainer;
  export type Settings = DraggablePreviewSettings;
  export type Parameters<
    TSourcePayload = unknown,
    TDragData = unknown,
  > = DraggablePreviewParameters<TSourcePayload, TDragData>;
  export type RenderParameters<
    TPayload = unknown,
    TDragData = unknown,
  > = DraggablePreviewRenderParameters<TPayload, TDragData>;
  export type State = DraggablePreviewState;
  export type Props<TPayload = unknown, TDragData = unknown> = unknown extends TPayload
    ? DraggablePreviewProps
    : DraggablePreviewTypedProps<TPayload, TDragData>;
}
