'use client';
import * as React from 'react';
import { warn } from '@base-ui/utils/warn';
import { DraggableCollisionContext } from '../collision-provider/DraggableCollisionContext';
import { useDraggableContext } from '../DraggableContext';
import type {
  DragKind,
  DraggablePayload,
  DraggablePayloadGetter,
  DragSnapSteps,
  DropTargetResolutionContext,
} from '../../types/drag';
import { useRenderElement } from '../../internals/useRenderElement';
import type { StateAttributesMapping } from '../../internals/getStateAttributesProps';
import type { BaseUIComponentProps } from '../../internals/types';
import type {
  RegisterDraggableParameters,
  DragParametersWithOptionalPayload,
  DragParametersWithRequiredPayload,
} from '../../types/dragRegistration';
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
 * Documentation: [Base UI Draggable](https://base-ui.com/react/utils/draggable)
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
    collision = true,
    collisionElement,
    snap,
    collisionPayload = payload,
    disabled,
    activation,
    dragCursor,
    modifiers,
    // Event handlers
    onBeforeMoveStart,
    onMoveStart,
    onMove,
    onTargetChange,
    onMoveEnd,
    // Props forwarded to the DOM element
    ...elementProps
  } = componentProps;

  const { defaultKind } = useDraggableContext();

  // A fresh object per render is fine: `useDraggableElement` reads it through a
  // ref and never compares it.
  const params = {
    kind: kind ?? defaultKind,
    payload,
    getPayload,
    previewKey,
    disabled,
    activation,
    dragCursor,
    modifiers,
    onBeforeMoveStart,
    onMoveStart,
    onMove,
    onTargetChange,
    onMoveEnd,
  } as RegisterDraggableParameters<TData>;

  // Participate in the nearest enclosing collision provider of this source's kind:
  // nested providers of other kinds (a board of columns of cards) are walked past.
  const enclosingCollisionContext = React.useContext(DraggableCollisionContext);
  let collisionContext = enclosingCollisionContext;
  while (collisionContext && collisionContext.kind.id !== (kind ?? defaultKind).id) {
    collisionContext = collisionContext.parent;
  }
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      return;
    }
    if (enclosingCollisionContext && kind === undefined && collision !== false) {
      warn(
        'A Draggable.Root inside a Draggable.CollisionProvider has no explicit kind, ' +
          'so it is not a destination for other items. ' +
          'Pass the same kind as the provider to the root, or set collision={false} to opt out. ' +
          'See https://base-ui.com/react/utils/draggable#collision-provider.',
      );
    }
    // Participants are measured before any gesture exists, so a payload derived
    // from the gesture can't describe them. Silently opting the item out would be
    // the confusing outcome: it still drags, but nothing can be inserted around it.
    if (
      collisionContext &&
      collision !== false &&
      getPayload !== undefined &&
      collisionPayload === undefined
    ) {
      warn(
        'A Draggable.Root inside a Draggable.CollisionProvider uses `getPayload` without `collisionPayload`, ' +
          'so it is not a destination for other items. ' +
          'Pass `collisionPayload` with the static data the collision callbacks should report, or `collision={false}` to opt out on purpose. ' +
          'See https://base-ui.com/react/utils/draggable#collision-provider.',
      );
    }
  }, [enclosingCollisionContext, kind, collisionContext, collision, getPayload, collisionPayload]);
  const { ref, dragging, setHandleElement, previewHandle } = useDraggableElement<TData>(
    params,
    collisionContext
      ? {
          context: collisionContext,
          payload: collisionPayload,
          enabled: collision && (getPayload === undefined || collisionPayload !== undefined),
          element: collisionElement,
          snap,
        }
      : undefined,
  );

  const state: DraggableRoot.State = {
    dragging,
    disabled: disabled ?? false,
  };

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
  <TData>(props: DraggableRootPropsWithPayload<TData>): React.JSX.Element;
  (
    props: DraggableRootPropsBase<undefined> &
      DragParametersWithOptionalPayload<DraggablePayloadParameters<undefined>>,
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
  // - `draggable` would start native dragging alongside the pointer sensor.
  'children' | 'draggable'
> &
  // The preview is described by a `Draggable.Preview` (with or without children)
  // rendered inside this component, and the drag handle by a `Draggable.Handle`,
  // never from here.
  Omit<
    RegisterDraggableParameters<TData>,
    'dragPreview' | 'dragHandle' | 'payload' | 'getPayload' | 'kind'
  > & {
    children?: React.ReactNode | undefined;
    /** Whether this element participates in the nearest collision provider. @default true */
    collision?: boolean | undefined;
    /**
     * Divides this participant's border box into equal steps for the collision target's
     * `getSnappedLocalPoint()`. Uses the same coordinates and callback context as
     * `Draggable.Target`. Changes reported coordinates only, not the drag preview.
     */
    snap?:
      | DragSnapSteps
      | ((context: DropTargetResolutionContext<NoInfer<TData>>) => DragSnapSteps | undefined)
      | undefined;
    /** Static participant data when the source uses getPayload. Defaults to payload. */
    collisionPayload?: DraggablePayload<TData> | undefined;
    /**
     * The element used for collision hit testing and measurement. Defaults to this source.
     * Resolved once when the source registers; a new function takes effect on the next registration.
     */
    collisionElement?: ((element: HTMLElement) => HTMLElement) | undefined;
    /** The source kind. Defaults to the nearest provider's no-payload kind. */
    kind?: DragKind<TData> | undefined;
  };

export type DraggableRootProps<TData = undefined> = DraggableRootPropsBase<TData> &
  DraggableRootPayloadField<TData> &
  ([TData] extends [undefined] ? {} : { kind: DragKind<TData> });

/**
 * Props for a generic `Draggable.Root` wrapper whose payload is always required.
 * Use this alias when spreading props with an unbound payload type into the root.
 */
export type DraggableRootPropsWithPayload<TData> = DraggableRootPropsBase<TData> & {
  kind: DragKind<TData>;
} & RequiredDraggablePayload<TData>;

type DraggablePayloadParameters<TData> = Pick<
  RegisterDraggableParameters<TData>,
  'payload' | 'getPayload'
>;

type RequiredDraggablePayload<TData> = DragParametersWithRequiredPayload<
  DraggablePayloadParameters<TData>,
  DraggablePayload<TData>,
  DraggablePayloadGetter<TData>
>;

/**
 * Requires `payload` when the caller declares a payload type. Generic wrappers
 * use {@link DraggableRootPropsWithPayload} instead.
 */
type DraggableRootPayloadField<TData> = [TData] extends [undefined]
  ? DragParametersWithOptionalPayload<DraggablePayloadParameters<TData>>
  : RequiredDraggablePayload<TData>;

export namespace DraggableRoot {
  export type State = DraggableRootState;
  export type Props<TData = undefined> = DraggableRootProps<TData>;
  export type PropsWithPayload<TData> = DraggableRootPropsWithPayload<TData>;
}
