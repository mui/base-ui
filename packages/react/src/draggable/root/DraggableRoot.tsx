'use client';
import * as React from 'react';
import { useRenderElement } from '../../internals/useRenderElement';
import type { StateAttributesMapping } from '../../internals/getStateAttributesProps';
import type { BaseUIComponentProps } from '../../internals/types';
import type {
  NativeDragEventProps,
  RegisterDraggableParameters,
  WithOptionalPayload,
  WithRequiredPayload,
} from '../../types/dragRegistration';
import type { DraggablePayload, DraggablePayloadGetter } from '../../types/drag';
import { useDraggableElement } from './useDraggableElement';
import { DraggableRootContext } from './DraggableRootContext';
import { useDragPreviewContext } from '../../utils/drag-and-drop/overlay/DragPreviewContext';

const stateAttributesMapping: StateAttributesMapping<DraggableRootState> = {
  // The engine owns `data-dragging`: it lands only once the preview has been built
  // and measured, so the clone never inherits it. React writing it too would race
  // that ordering.
  dragging: () => null,
};

/**
 * Makes its element a drag source, so it can be picked up with the pointer and
 * dropped on matching drop targets.
 * Renders a `<div>` element.
 *
 * While dragging, a clone of the element follows the pointer by default.
 *
 * Documentation: [Base UI Draggable](https://base-ui.com/react/components/draggable)
 */
export const DraggableRoot = React.forwardRef(function DraggableRoot<TData = undefined>(
  componentProps: DraggableRootPropsBase<TData> & {
    payload?: DraggablePayload<TData> | undefined;
    getPayload?: DraggablePayloadGetter<TData> | undefined;
  },
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    // Rendering props
    className,
    render,
    style,
    children,
    // Drag source props. Listed explicitly because whatever stays in
    // `elementProps` is spread onto the `<div>`, where an engine parameter would
    // land as an attribute.
    kind,
    payload,
    getPayload,
    previewKey,
    disabled,
    pointerActivation,
    dragCursor,
    modifiers,
    // Event handlers
    onBeforeDragStart,
    onDragStart,
    onDrag,
    onDropTargetChange,
    onDrop,
    onDragEnd,
    // Props forwarded to the DOM element
    ...elementProps
  } = componentProps;

  // A fresh object per render is fine: `useDraggableElement` reads it through a
  // ref and never compares it.
  const params = {
    kind,
    payload,
    getPayload,
    previewKey,
    disabled,
    pointerActivation,
    dragCursor,
    modifiers,
    onBeforeDragStart,
    onDragStart,
    onDrag,
    onDropTargetChange,
    onDrop,
    onDragEnd,
  } as RegisterDraggableParameters<TData>;

  const { ref, dragging, setHandleElement, previewHandle } = useDraggableElement<TData>(params);

  const state: DraggableRoot.State = { dragging, disabled: disabled ?? false };

  // The provider seen from here is the one the engine publishes preview content
  // through; `Draggable.Preview` compares its own nearest provider against it.
  const previewContext = useDragPreviewContext();

  const contextValue = React.useMemo(
    () => ({
      setHandleElement,
      previewHandle,
      previewContext,
      disabled: disabled ?? false,
    }),
    [setHandleElement, previewHandle, previewContext, disabled],
  );

  const element = useRenderElement('div', componentProps, {
    state,
    ref: [forwardedRef, ref],
    props: [{ children }, elementProps],
    stateAttributesMapping,
  });

  return (
    <DraggableRootContext.Provider value={contextValue}>{element}</DraggableRootContext.Provider>
  );
  // Overloaded so `payload` stays required for a kind that declares one: a
  // `kind={card}` with no payload can't leave the engine emitting `undefined` where a
  // `Card` was promised. Expressing that as a conditional on the props type instead
  // would make it a deferred conditional a generic wrapper can't spread into.
}) as {
  <TData>(
    props: DraggableRootPropsBase<TData> & RequiredDraggablePayload<TData>,
  ): React.JSX.Element;
  (
    props: DraggableRootPropsBase<undefined> &
      WithOptionalPayload<DraggablePayloadParameters<undefined>>,
  ): React.JSX.Element;
};

export interface DraggableRootState {
  /**
   * Whether this element is the one currently being dragged.
   */
  dragging: boolean;
  /**
   * Whether the draggable is disabled.
   */
  disabled: boolean;
}

// Every `Draggable.Root` prop except its payload fields; the overloads and `Props` below
// each add it back with their own optionality. See `DraggableConfig.payload`.
type DraggableRootPropsBase<TData> = Omit<
  BaseUIComponentProps<'div', DraggableRootState>,
  // - `children` is widened below.
  // - the whole native HTML5 drag event family is replaced by this engine
  'children' | 'draggable' | NativeDragEventProps
> &
  // The preview is described by a `Draggable.Preview` or a `Draggable.ClonedPreview`
  // rendered inside this component, and the drag handle by a `Draggable.Handle`,
  // never from here.
  Omit<
    RegisterDraggableParameters<TData>,
    'dragPreview' | 'dragHandle' | 'payload' | 'getPayload'
  > & { children?: React.ReactNode | undefined };

export type DraggableRootProps<TData = undefined> = DraggableRootPropsBase<TData> &
  DraggableRootPayloadField<TData>;

/**
 * Props for a generic `Draggable.Root` wrapper whose payload is always required.
 * Use this alias when spreading props with an unbound payload type into the root.
 */
export type DraggableRootPropsWithPayload<TData> = DraggableRootPropsBase<TData> &
  RequiredDraggablePayload<TData>;

type DraggablePayloadParameters<TData> = Pick<
  RegisterDraggableParameters<TData>,
  'payload' | 'getPayload'
>;

type RequiredDraggablePayload<TData> = WithRequiredPayload<
  DraggablePayloadParameters<TData>,
  DraggablePayload<TData>,
  DraggablePayloadGetter<TData>
>;

/**
 * Requires `payload` when the caller declares a payload type. Generic wrappers
 * use {@link DraggableRootPropsWithPayload} instead.
 */
type DraggableRootPayloadField<TData> = [TData] extends [undefined]
  ? WithOptionalPayload<DraggablePayloadParameters<TData>>
  : RequiredDraggablePayload<TData>;

export namespace DraggableRoot {
  export type State = DraggableRootState;
  export type Props<TData = undefined> = DraggableRootProps<TData>;
  export type PropsWithPayload<TData> = DraggableRootPropsWithPayload<TData>;
}
