'use client';
import * as React from 'react';
import { EMPTY_OBJECT } from '@base-ui/utils/empty';
import { warn } from '@base-ui/utils/warn';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import type { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import type {
  DraggableKind,
  DraggableInput,
  DraggableLocationHistory,
  DraggablePosition,
} from '../DraggableProvider';
import { useDraggableContext } from '../DraggableContext';
import { useDraggableRootContext } from '../root/DraggableRootContext';
import type { DragPreviewDeclaration } from '../../utils/drag-and-drop/dragPreviewDeclaration';
import type { DraggableRootModifiers, DraggableRootRecord } from '../root/DraggableRoot';
import * as DraggablePreviewDataAttributes from './DraggablePreviewDataAttributes';

/**
 * Configures what follows the pointer during a drag.
 * Without children, it configures the default clone of the source and renders nothing.
 * With children, it renders them in a `<div>` element, which Base UI copies beside the
 * source while dragging. The children read React context from above the nearest `<Draggable.Provider>`.
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
  const rootContext = useDraggableRootContext<TPayload, TDragData>();
  const draggableContext = useDraggableContext();
  const getProps = useStableCallback(() => props);
  const useClone = props.children == null || props.children === false;
  /* istanbul ignore else -- `process.env.NODE_ENV` is a build-time constant under test */
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    React.useEffect(() => {
      if (
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
  }

  // Resolved per drag, not per render.
  const render = useStableCallback(
    (parameters: DraggablePreviewRenderParameters<TPayload, TDragData>) => {
      // The engine reads the settings from the declaration. The remaining props go
      // to the rendered element.
      const { children, kind, offset, modifiers, disabled, container, ...componentProps } =
        getProps();
      // A typed preview must never call its render function with a payload of a
      // different kind. That only happens when the part sits under the wrong root.
      // Decline the preview for that drag instead of breaking the callback's type.
      if (kind !== undefined && !kind.matches(parameters.source)) {
        return null;
      }
      const resolved = typeof children === 'function' ? children(parameters) : children;
      // Pass a declined preview to the engine unchanged. An empty element would still
      // follow the pointer.
      if (resolved == null || resolved === false) {
        return resolved;
      }
      return <PreviewElement {...componentProps}>{resolved}</PreviewElement>;
    },
  );

  // The engine publishes content through the provider seen from the root's
  // position, so a provider mounted between the root and this part would never
  // receive it, and the content would miss that provider's context.
  if (!useClone && props.disabled !== true && draggableContext !== rootContext.previewContext) {
    throw new Error(
      'Base UI: the <Draggable.Provider> for this preview is inside its ' +
        '<Draggable.Root>, so the root cannot use it to render the preview. ' +
        'Move the provider above the <Draggable.Root>. ' +
        'See https://base-ui.com/react/utils/draggable.',
    );
  }

  // Tell the draggable what its preview is: `render` to own the content, or `null`
  // for a clone of the source. The settings are read through `getProps` at drag start.
  const declaration = React.useMemo<DragPreviewDeclaration<TPayload, TDragData>>(
    () => ({ getSettings: getProps, render: useClone ? null : render }),
    [getProps, render, useClone],
  );
  useIsoLayoutEffect(
    () => rootContext.previewHandle.declare(declaration),
    [rootContext.previewHandle, declaration],
  );

  return null;
}

const EMPTY_STATE: DraggablePreviewState = EMPTY_OBJECT;
// The styling hook the engine also sets on the preview. It is set here too, so the
// content can be styled the same way before the engine copies it.
const PREVIEW_ELEMENT_PROPS = { [DraggablePreviewDataAttributes.dragPreview as string]: '' };

/**
 * The element a `Draggable.Preview` declares. The overlay renders it off-document,
 * not where the `Draggable.Preview` is written, and the engine copies it into the
 * element that follows the pointer.
 */
function PreviewElement(props: PreviewElementProps): React.ReactNode {
  const { className, style, render, ...elementProps } = props;

  return useRenderElement('div', props, {
    state: EMPTY_STATE,
    props: [PREVIEW_ELEMENT_PROPS, elementProps],
  });
}

/** The `Draggable.Preview`'s own props, snapshotted at drag start. */
type PreviewElementProps = Omit<
  DraggablePreviewProps,
  'children' | keyof DraggablePreviewSettings
> & {
  children?: React.ReactNode | undefined;
};

export interface DraggablePreviewState {}

export interface DraggablePreviewProps
  extends
    Omit<
      BaseUIComponentProps<'div', DraggablePreviewState>,
      // - `children` is widened below.
      // - The element is rendered at drag start, in the overlay rather than here, and
      // the preview is a copy of it, so a ref would point at no visible node.
      'children' | 'ref'
    >,
    DraggablePreviewSettings {
  /**
   * The preview content. Omit it to clone the source instead.
   * Pass a function to build the content from the drag source when the drag starts,
   * and again on each `source.renderPreview()` call. It can return `null` to show no
   * preview. Its `source.payload` is `unknown` unless a `kind` is passed.
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
   * when the drag starts, and again on each `source.renderPreview()` call. It can
   * return `null` to show no preview.
   */
  children?:
    | React.ReactNode
    | ((parameters: DraggablePreviewRenderParameters<TPayload, TDragData>) => React.ReactNode)
    | undefined;
};

/**
 * The argument of `<Draggable.Preview>`'s children function and of `registerSource`'s
 * `preview.render`, called when the drag starts and on each `source.renderPreview()`.
 */
export interface DraggablePreviewRenderParameters<TSourcePayload = unknown, TDragData = unknown> {
  /** The item being dragged. */
  source: DraggableRootRecord<TSourcePayload, TDragData>;
  /** The pointer position and drop targets when the preview renders. */
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
   * Where to insert the preview element in the DOM. Defaults to the end of the
   * source's parent, so the same CSS applies to it. Pass a container to keep
   * selectors such as `:last-child` on the source's siblings unchanged during the drag.
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
   * Renders the preview content instead of cloning the source, when the drag starts
   * and on each `source.renderPreview()` call. Return `null` to show no preview. It
   * plays the role of `<Draggable.Preview>`'s children function, not of its `render`
   * prop. A single root element becomes the preview element. Other content is wrapped
   * in a `<div>`.
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
