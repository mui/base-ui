'use client';
import * as React from 'react';
import { warn } from '@base-ui/utils/warn';
import { DraggableCollisionContext } from '../collision-provider/DraggableCollisionContext';
import { useDraggableContext } from '../DraggableContext';
import type {
  DraggableRootBeforeMoveStartValue,
  DraggableRootBeforeMoveStartEventDetails,
  DraggableRootBeforeMoveStartEventReason,
  DraggableRootMoveStartValue,
  DraggableRootMoveStartEventDetails,
  DraggableRootMoveStartEventReason,
  DraggableRootMoveValue,
  DraggableRootMoveEventDetails,
  DraggableRootMoveEventReason,
  DraggableRootTargetChangeValue,
  DraggableRootTargetChangeEventDetails,
  DraggableRootTargetChangeEventReason,
  DraggableRootMoveEndValue,
  DraggableRootMoveEndEventDetails,
  DraggableRootMoveEndEventReason,
  DraggableKind,
  DraggablePayload,
  DraggableTargetSnapSteps,
  DraggableTargetResolutionContext,
  DraggableRootRecord,
  DraggableRootModifier,
  DraggableRootModifiers,
  DraggableRootModifierContext,
  DraggableRootElementReference,
} from '../../types/drag';
import { useRenderElement } from '../../internals/useRenderElement';
import type { StateAttributesMapping } from '../../internals/getStateAttributesProps';
import type { BaseUIComponentProps } from '../../internals/types';
import type { RegisterSourceParameters } from '../../types/dragRegistration';
import { useDraggableElement } from './useDraggableElement';
import { DraggableRootContext } from './DraggableRootContext';
import { useDragPreviewContext } from '../../utils/drag-and-drop/overlay/DragPreviewContext';
import type {
  DraggableRootActivation,
  DraggableRootActivationConfig,
} from '../../utils/drag-and-drop/activation';

const stateAttributesMapping: StateAttributesMapping<DraggableRootState> = {
  // The engine owns `data-dragging`: it lands only once the preview has been built
  // and measured, so the clone never inherits it. React writing it too would race
  // that ordering.
  dragging: () => null,
};

/**
 * An element that can be picked up with the pointer and dropped on a matching drop target.
 * While dragging, a clone of the element follows the pointer by default.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Draggable](https://base-ui.com/react/utils/draggable)
 */
export const DraggableRoot = React.forwardRef(function DraggableRoot<
  TPayload = undefined,
  TDragData = unknown,
>(
  componentProps: DraggableRootPropsBase<TPayload, TDragData> & {
    payload?: DraggablePayload<TPayload> | undefined;
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

  // A fresh object per render is intended: `useDraggableElement` reads it through
  // a getter and uses its identity as the cache key for the normalized config, so
  // memoizing it here would silently stop parameter updates.
  const params = {
    kind: kind ?? defaultKind,
    payload,
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
  } as RegisterSourceParameters<TPayload, TDragData>;

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
          'See https://base-ui.com/react/utils/draggable#collisionprovider.',
      );
    }
  }, [enclosingCollisionContext, kind, collision]);
  const { ref, dragging, setHandleElement, previewHandle } = useDraggableElement<
    TPayload,
    TDragData
  >(
    params,
    collisionContext
      ? {
          context: collisionContext,
          payload: collisionPayload,
          enabled: collision,
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
  // One generic signature, like `Select.Root`: `Props` makes `payload` required for a
  // kind that declares one, so a `kind={card}` with no payload can't leave the engine
  // emitting `undefined` where a `Card` was promised. A generic wrapper can spread its
  // `Props<Payload>` straight through, since the argument infers from the same alias.
}) as <TPayload = undefined, TDragData = unknown>(
  props: DraggableRootProps<TPayload, TDragData>,
) => React.JSX.Element;

export interface DraggableRootState {
  /**
   * Whether this element is being dragged.
   */
  dragging: boolean;
  /**
   * Whether the draggable is disabled.
   */
  disabled: boolean;
}

// Every `Draggable.Root` prop except `kind`'s requirement and `payload`: `DraggableRootProps`
// adds them back with the optionality the kind's payload implies.
type DraggableRootPropsBase<TPayload, TDragData = unknown> = Omit<
  BaseUIComponentProps<'div', DraggableRootState>,
  // - `children` is widened below.
  // - `draggable` would start native dragging alongside the pointer sensor.
  'children' | 'draggable'
> &
  // The preview is described by a `Draggable.Preview` (with or without children)
  // rendered inside this component, and the drag handle by a `Draggable.Handle`,
  // never from here.
  Omit<RegisterSourceParameters<TPayload, TDragData>, 'preview' | 'handle' | 'payload' | 'kind'> & {
    children?: React.ReactNode | undefined;
    /**
     * Whether other items of the nearest matching collision provider can be dropped on this one.
     * @default true
     */
    collision?: boolean | undefined;
    /**
     * Divides this item into equal steps for `getSnappedLocalPoint()` when another item
     * is dragged over it. Accepts step counts or a function returning them.
     * Doesn't affect the preview's position.
     */
    snap?:
      | DraggableTargetSnapSteps
      | ((
          context: DraggableTargetResolutionContext<NoInfer<TPayload>, NoInfer<TDragData>>,
        ) => DraggableTargetSnapSteps | undefined)
      | undefined;
    /**
     * The payload reported by the collision provider when another item is dragged over this one.
     * Defaults to `payload`.
     */
    collisionPayload?: DraggablePayload<TPayload> | undefined;
    /**
     * Returns the element measured for collisions, for example a padded row wrapper
     * so that the gaps between items count too. Defaults to the root's own element.
     */
    collisionElement?: ((element: HTMLElement) => HTMLElement) | undefined;
    /**
     * The kind of this item, created with `Draggable.createKind`.
     * Defaults to the kind of the nearest `<Draggable.Provider>`, which carries no payload.
     */
    kind?: DraggableKind<TPayload, TDragData> | undefined;
  };

export type DraggableRootProps<TPayload = undefined, TDragData = unknown> = DraggableRootPropsBase<
  TPayload,
  TDragData
> &
  DraggableRootPayloadField<TPayload> &
  ([TPayload] extends [undefined] ? {} : { kind: DraggableKind<TPayload, TDragData> });

type RequiredDraggablePayload<TPayload> = {
  /**
   * The data attached to this item, available as `source.payload` in every drag event
   * and drop target handler. Its type comes from `kind`, and it is required when the
   * kind declares one.
   */
  payload: DraggablePayload<TPayload>;
};

type DraggableRootPayloadField<TPayload> = [TPayload] extends [undefined]
  ? {
      /**
       * The data attached to this item, available as `source.payload` in every drag event
       * and drop target handler. Its type comes from `kind`, and it is required when the
       * kind declares one.
       */
      payload?: DraggablePayload<TPayload> | undefined;
    }
  : RequiredDraggablePayload<TPayload>;

export type {
  DraggableRootBeforeMoveStartValue,
  DraggableRootBeforeMoveStartEventDetails,
  DraggableRootBeforeMoveStartEventReason,
  DraggableRootMoveStartValue,
  DraggableRootMoveStartEventDetails,
  DraggableRootMoveStartEventReason,
  DraggableRootMoveValue,
  DraggableRootMoveEventDetails,
  DraggableRootMoveEventReason,
  DraggableRootTargetChangeValue,
  DraggableRootTargetChangeEventDetails,
  DraggableRootTargetChangeEventReason,
  DraggableRootMoveEndValue,
  DraggableRootMoveEndEventDetails,
  DraggableRootMoveEndEventReason,
  DraggableRootRecord,
  DraggableRootModifier,
  DraggableRootModifiers,
  DraggableRootModifierContext,
  DraggableRootElementReference,
} from '../../types/drag';

export type {
  DraggableRootActivation,
  DraggableRootActivationConfig,
} from '../../utils/drag-and-drop/activation';

export namespace DraggableRoot {
  export type Activation = DraggableRootActivation;
  export type ActivationConfig = DraggableRootActivationConfig;
  export type Record<TPayload = unknown, TDragData = unknown> = DraggableRootRecord<
    TPayload,
    TDragData
  >;
  export type Modifier = DraggableRootModifier;
  export type Modifiers = DraggableRootModifiers;
  export type ModifierContext = DraggableRootModifierContext;
  export type ElementReference = DraggableRootElementReference;
  export type BeforeMoveStartValue<
    TPayload = unknown,
    TDragData = unknown,
  > = DraggableRootBeforeMoveStartValue<TPayload, TDragData>;
  export type BeforeMoveStartEventDetails = DraggableRootBeforeMoveStartEventDetails;
  export type BeforeMoveStartEventReason = DraggableRootBeforeMoveStartEventReason;
  export type MoveStartValue<TPayload = unknown, TDragData = unknown> = DraggableRootMoveStartValue<
    TPayload,
    TDragData
  >;
  export type MoveStartEventDetails = DraggableRootMoveStartEventDetails;
  export type MoveStartEventReason = DraggableRootMoveStartEventReason;
  export type MoveValue<TPayload = unknown, TDragData = unknown> = DraggableRootMoveValue<
    TPayload,
    TDragData
  >;
  export type MoveEventDetails = DraggableRootMoveEventDetails;
  export type MoveEventReason = DraggableRootMoveEventReason;
  export type TargetChangeValue<
    TPayload = unknown,
    TDragData = unknown,
  > = DraggableRootTargetChangeValue<TPayload, TDragData>;
  export type TargetChangeEventDetails = DraggableRootTargetChangeEventDetails;
  export type TargetChangeEventReason = DraggableRootTargetChangeEventReason;
  export type MoveEndValue<TPayload = unknown, TDragData = unknown> = DraggableRootMoveEndValue<
    TPayload,
    TDragData
  >;
  export type MoveEndEventDetails = DraggableRootMoveEndEventDetails;
  export type MoveEndEventReason = DraggableRootMoveEndEventReason;
  export type State = DraggableRootState;
  export type Props<TPayload = undefined, TDragData = unknown> = DraggableRootProps<
    TPayload,
    TDragData
  >;
}
