'use client';
import * as React from 'react';
import { warn } from '@base-ui/utils/warn';
import { DraggableCollisionContext } from '../collision-provider/DraggableCollisionContext';
import { useDraggableContext } from '../DraggableContext';
import type {
  DraggablePayload,
  BeforeMoveStartEventDetailsProperties,
  DragStartReason,
  DropTargetChangeEventDetails,
  MoveEndEventDetails,
  MoveEventDetails,
  MoveStartEventDetails,
} from '../../utils/drag-and-drop/types';
import type { DraggableKind, DraggablePosition } from '../DraggableProvider';
import type {
  DraggableTargetSnapSteps,
  DraggableTargetResolutionContext,
} from '../target/DraggableTarget';
import { useRenderElement } from '../../internals/useRenderElement';
import type { StateAttributesMapping } from '../../internals/getStateAttributesProps';
import type { BaseUIComponentProps } from '../../internals/types';
import type { RegisterSourceParameters } from '../../utils/drag-and-drop/registrationTypes';
import { useDraggableElement } from './useDraggableElement';
import { DraggableRootContext } from './DraggableRootContext';
import type { BaseUIChangeEventDetails } from '../../internals/createBaseUIEventDetails';

const stateAttributesMapping: StateAttributesMapping<DraggableRootState> = {
  // The engine sets `data-dragging` after it builds and measures the preview, so the
  // clone never inherits it. Rendering it from React could land it before the clone.
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
  componentProps: DraggableRootPropsBase<TPayload, TDragData>,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    // Rendering props
    className,
    render,
    style,
    // Drag source props. Destructured so they stay out of `elementProps`, which
    // is spread onto the `<div>` as attributes.
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

  const draggableContext = useDraggableContext();

  // The engine compares registrations field by field before re-normalizing, so a
  // new object on every render is fine.
  const params = {
    kind: kind ?? draggableContext.defaultKind,
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

  // Join the nearest collision provider of this source's kind. Providers of other
  // kinds in between are skipped, as on a board whose columns contain cards.
  const enclosingCollisionContext = React.useContext(DraggableCollisionContext);
  let collisionContext = enclosingCollisionContext;
  while (collisionContext && collisionContext.kind.id !== params.kind.id) {
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

  const contextValue = React.useMemo(
    () => ({
      setHandleElement,
      previewHandle,
      // The engine publishes preview content through the provider seen from here.
      // `Draggable.Preview` compares its own nearest provider against it.
      previewContext: draggableContext,
      disabled: disabled ?? false,
    }),
    [setHandleElement, previewHandle, draggableContext, disabled],
  );

  const element = useRenderElement('div', componentProps, {
    state,
    ref: [forwardedRef, ref],
    props: elementProps,
    stateAttributesMapping,
  });

  return (
    <DraggableRootContext.Provider value={contextValue}>{element}</DraggableRootContext.Provider>
  );
  // One generic signature, as in `Select.Root`. `Props` requires `payload` when the
  // kind declares one, so `kind={card}` without a payload is a type error instead of
  // an `undefined` payload at runtime. A generic wrapper can spread its
  // `Props<Payload>` through because the argument infers from the same alias.
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

// Every `Draggable.Root` prop, with `kind` and `payload` optional.
// `DraggableRootProps` requires both when the kind declares a payload.
type DraggableRootPropsBase<TPayload, TDragData = unknown> = Omit<
  BaseUIComponentProps<'div', DraggableRootState>,
  // - `children` is widened below.
  // - `draggable` would start native dragging alongside the pointer sensor.
  'children' | 'draggable'
> &
  // A `Draggable.Preview` rendered inside this component declares the preview, and a
  // `Draggable.Handle` declares the handle. Neither is a prop.
  Omit<RegisterSourceParameters<TPayload, TDragData>, 'preview' | 'handle' | 'kind'> & {
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
  ([TPayload] extends [undefined]
    ? {}
    : { kind: DraggableKind<TPayload, TDragData>; payload: DraggablePayload<TPayload> });

/**
 * The item being dragged, carried by every drag event.
 * It stays usable if its element unmounts during the drag, for example in a virtualized list.
 */
export interface DraggableRootRecord<TPayload = unknown, TDragData = unknown> {
  /** The draggable's own DOM element. */
  element: HTMLElement;
  /**
   * The identity of the draggable's `kind`.
   * Test it with a kind's `matches` method, which also narrows `payload`.
   */
  kind: symbol;
  /** The handle the user pressed, or `null` when the whole draggable is its own handle. */
  handle: Element | null;
  /**
   * The draggable's `payload`, or `undefined` when it has none.
   */
  readonly payload: TPayload;
  /**
   * Replaces the payload. The new value persists after the drag, until the `payload` prop changes.
   */
  updatePayload(payload: TPayload): void;
  /** Data stored for the current drag. Starts as `undefined` on every drag. */
  readonly dragData: TDragData | undefined;
  /** Stores data for the rest of the current drag. */
  updateDragData(dragData: TDragData): void;
}

/**
 * The element `restrictToElement` keeps the drag inside. Accepts an element, a ref to one,
 * or a function returning one. It is resolved on every move, so a ref can be set during a drag.
 */
export type DraggableRootElementReference =
  HTMLElement | { current: HTMLElement | null } | (() => HTMLElement | null | undefined);

/** The argument of a {@link DraggableRootModifier}, on every frame of a drag. */
export interface DraggableRootModifierContext {
  /**
   * The point to constrain, in client pixels. On `Draggable.Root`, it's the pointer
   * position. On `Draggable.Preview`, it's the preview's proposed top-left corner.
   */
  point: DraggablePosition;
  /** The same point when the drag started. Axis locks and grid snaps anchor to it. */
  initialPoint: DraggablePosition;
  /**
   * The point before any modifier of this chain ran, in client pixels.
   * On `Draggable.Preview`, it already includes the root's modifiers.
   */
  input: DraggablePosition;
  /** The drag source element. */
  sourceElement: HTMLElement;
  /** The source element's bounding rectangle when the drag started. */
  sourceRect: DOMRect;
  /**
   * The scale applied to the element by CSS `transform` or `zoom`, including its
   * ancestors. `1` when nothing is scaled. Multiply a distance in the element's own
   * units by this value to convert it to client pixels.
   */
  scale: DraggablePosition;
  /** The preview element's current bounding rectangle, or `null` when there is no preview. */
  previewRect: DOMRect | null;
  /**
   * The offset from the preview's top-left corner to `point`. `{ x: 0, y: 0 }` on
   * `Draggable.Preview` and when there is no preview.
   */
  previewOffset: DraggablePosition;
  /**
   * Whether the Control key is held. Pressing or releasing a modifier key
   * reapplies the modifiers on the next frame.
   */
  ctrlKey: boolean;
  /** Whether the Shift key is held. */
  shiftKey: boolean;
  /** Whether the Alt key is held. */
  altKey: boolean;
  /** Whether the Meta (Command or Windows) key is held. */
  metaKey: boolean;
  /** The window of the source's document. */
  ownerWindow: Window;
}

/**
 * A function that constrains the drag position. It receives the proposed point and
 * returns the point to use. Use it to lock an axis, snap to a grid, or keep the drag
 * inside an element.
 */
export type DraggableRootModifier = (context: DraggableRootModifierContext) => DraggablePosition;

/**
 * One or more {@link DraggableRootModifier}s, applied in order. Each receives the previous one's
 * result. Falsy entries are skipped, so a modifier can be applied conditionally,
 * as in `[locked && restrictToVerticalAxis, snapToGrid(8)]`.
 */
export type DraggableRootModifiers =
  DraggableRootModifier | ReadonlyArray<DraggableRootModifier | false | null | undefined>;

/** The event details passed to `onBeforeMoveStart`. Call `cancel()` to prevent the drag. */
export type DraggableRootBeforeMoveStartEventDetails<
  TPayload = unknown,
  TDragData = unknown,
> = BaseUIChangeEventDetails<
  DragStartReason,
  BeforeMoveStartEventDetailsProperties<TPayload, TDragData>
>;

export type DraggableRootBeforeMoveStartEventReason =
  DraggableRootBeforeMoveStartEventDetails['reason'];

export type DraggableRootMoveStartEventDetails<
  TPayload = unknown,
  TDragData = unknown,
> = MoveStartEventDetails<TPayload, TDragData>;

export type DraggableRootMoveStartEventReason = DraggableRootMoveStartEventDetails['reason'];

export type DraggableRootMoveEventDetails<
  TPayload = unknown,
  TDragData = unknown,
> = MoveEventDetails<TPayload, TDragData>;

export type DraggableRootMoveEventReason = DraggableRootMoveEventDetails['reason'];

export type DraggableRootTargetChangeEventDetails<
  TPayload = unknown,
  TDragData = unknown,
> = DropTargetChangeEventDetails<TPayload, TDragData>;

export type DraggableRootTargetChangeEventReason = DraggableRootTargetChangeEventDetails['reason'];

export type DraggableRootMoveEndEventDetails<
  TPayload = unknown,
  TDragData = unknown,
> = MoveEndEventDetails<TPayload, TDragData>;

/**
 * Why a drag ended. More cancel reasons may be added, so handle unknown values too.
 * Read `eventDetails.canceled` to tell a cancel from a release.
 *
 * - `'drop'`: Released over a drop target that accepted it.
 * - `'outside-release'`: Released outside any accepting drop target.
 * - `'escape-key'` / `'tab-key'`: The user pressed Escape or Tab.
 * - `'imperative-action'`: The application called `cancelDrag()`.
 * - `'window-blur'` / `'page-hidden'`: The window lost focus, or the page was hidden.
 * - `'pointer-canceled'`: The browser or the operating system canceled the pointer.
 * - `'capture-lost'`: Another element captured the pointer during the drag.
 * - `'missed-release'`: The button was released without Base UI receiving the event.
 * - `'handler-error'`: One of your handlers threw. The error is rethrown separately.
 * - `'document-detached'`: The document was removed, for example a closed iframe.
 */
export type DraggableRootMoveEndEventReason = DraggableRootMoveEndEventDetails['reason'];

/**
 * When a `pointerdown` becomes a drag, selected by `type`:
 * - `immediate`: any `pointerdown` starts the drag.
 * - `distance`: the drag starts after the pointer has moved by `distance` CSS pixels.
 * - `press-hold`: the drag starts after `delay` ms of holding still. Movement
 *   larger than `tolerance` CSS pixels (default 5) cancels the gesture.
 * - `double-click`: with a mouse, the drag starts on a double-click, follows the
 *   pointer without a held button, and ends on the next primary click. With touch
 *   or pen, the drag starts on the second tap of a double-tap while the pointer
 *   is still down, and ends on release.
 */
export type DraggableRootActivation =
  | { type: 'immediate' }
  | { type: 'distance'; distance: number }
  | { type: 'press-hold'; delay: number; tolerance?: number | undefined }
  | { type: 'double-click' };

/**
 * A single activation applied to all pointer types, or a per-pointer map.
 * Missing entries fall back to the per-pointer defaults. Pass an array of these
 * values to enable multiple activation methods. Set a pointer entry to `false`
 * to disable pickup for that pointer type, overriding all methods in an array.
 */
export type DraggableRootActivationConfig =
  | DraggableRootActivation
  | {
      mouse?: DraggableRootActivation | false | undefined;
      touch?: DraggableRootActivation | false | undefined;
      pen?: DraggableRootActivation | false | undefined;
    };

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
  export type BeforeMoveStartEventDetails<
    TPayload = unknown,
    TDragData = unknown,
  > = DraggableRootBeforeMoveStartEventDetails<TPayload, TDragData>;
  export type BeforeMoveStartEventReason = DraggableRootBeforeMoveStartEventReason;
  export type MoveStartEventDetails<
    TPayload = unknown,
    TDragData = unknown,
  > = DraggableRootMoveStartEventDetails<TPayload, TDragData>;
  export type MoveStartEventReason = DraggableRootMoveStartEventReason;
  export type MoveEventDetails<
    TPayload = unknown,
    TDragData = unknown,
  > = DraggableRootMoveEventDetails<TPayload, TDragData>;
  export type MoveEventReason = DraggableRootMoveEventReason;
  export type TargetChangeEventDetails<
    TPayload = unknown,
    TDragData = unknown,
  > = DraggableRootTargetChangeEventDetails<TPayload, TDragData>;
  export type TargetChangeEventReason = DraggableRootTargetChangeEventReason;
  export type MoveEndEventDetails<
    TPayload = unknown,
    TDragData = unknown,
  > = DraggableRootMoveEndEventDetails<TPayload, TDragData>;
  export type MoveEndEventReason = DraggableRootMoveEndEventReason;
  export type State = DraggableRootState;
  export type Props<TPayload = undefined, TDragData = unknown> = DraggableRootProps<
    TPayload,
    TDragData
  >;
}
