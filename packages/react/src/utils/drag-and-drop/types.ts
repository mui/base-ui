import type {
  DraggableAcceptedKind,
  DraggableInput,
  DraggableLocationHistory,
} from '../../draggable/DraggableProvider';
import type { DraggableRootRecord } from '../../draggable/root/DraggableRoot';
import type { DraggableTargetRecord } from '../../draggable/target/DraggableTarget';
import type { BaseUIGenericEventDetails } from '../../internals/createBaseUIEventDetails';
import type { REASONS } from '../../internals/reasons';

/**
 * The engine's internal drag types: the shared building blocks of the public event
 * types, the reason unions, and the dispatch maps. Public types live on the part
 * that owns them, such as `Draggable.Root.Record` in `DraggableRoot.tsx`.
 */

export type DragCleanupFn = () => void;

/**
 * The payload type declared by `accept`. An array produces a union, and an omitted
 * `accept` produces `unknown`.
 */
// Distributive on purpose, so both the array entries and an `accept` that is itself a
// union (a wrapper forwarding `DraggableAccept<T>`) resolve to the union of their payloads.
export type AcceptedDragPayload<TAccept> =
  TAccept extends DraggableAcceptedKind<infer TPayload, any>
    ? TPayload
    : TAccept extends ReadonlyArray<infer TKind>
      ? TKind extends DraggableAcceptedKind<infer TPayload, any>
        ? TPayload
        : never
      : unknown;

/** The drag data declared by accepted kinds. An array produces a union. */
export type AcceptedDragData<TAccept> =
  TAccept extends DraggableAcceptedKind<any, infer TDragData>
    ? TDragData
    : TAccept extends ReadonlyArray<infer TKind>
      ? TKind extends DraggableAcceptedKind<any, infer TDragData>
        ? TDragData
        : never
      : unknown;

/**
 * The first argument of the drag handlers of a source, a monitor, and a collision provider:
 * the dragged item and the target it is over.
 */
export interface DragSourceEventValue<
  TSourcePayload = unknown,
  TDragData = unknown,
  TTargetPayload = unknown,
  TTargetDragData = unknown,
> {
  /** The item being dragged. */
  source: DraggableRootRecord<TSourcePayload, TDragData>;
  /**
   * The drop target that would receive the drop if the drag were released now, or
   * `null` when there is none: `eventDetails.location.current.targets[0]`.
   */
  target: DraggableTargetRecord<TTargetPayload, TTargetDragData> | null;
}

/** The first argument of a drop target's handlers: the dragged item and this target. */
export interface DropTargetEventValue<
  TSourcePayload = unknown,
  TTargetPayload = unknown,
  TDragData = unknown,
  TTargetDragData = unknown,
> {
  /** The item being dragged. */
  source: DraggableRootRecord<TSourcePayload, TDragData>;
  /** This drop target's own record. */
  target: DraggableTargetRecord<TTargetPayload, TTargetDragData>;
}

/** A draggable's payload value. */
// `NoInfer` because `kind` is what the payload type is inferred from: without it a
// `payload` that does not match the kind would widen `TPayload` instead of being rejected.
export type DraggablePayload<TPayload> = NoInfer<TPayload>;

/**
 * How a drag started: a pointer press that met its activation threshold, or a
 * double-click or double-tap.
 */
export type DragStartReason = typeof REASONS.pointer | typeof REASONS.doubleClick;

/** Why a drag movement frame ran: pointer activity or a modifier-key change. */
export type DragMoveReason = typeof REASONS.pointer | typeof REASONS.modifierKey;

/** Why a drag was canceled. Each reason is described on `DraggableRootMoveEndEventReason`. */
export type DragCanceledReason =
  | typeof REASONS.escapeKey
  | typeof REASONS.tabKey
  | typeof REASONS.imperativeAction
  | typeof REASONS.windowBlur
  | typeof REASONS.pageHidden
  | typeof REASONS.pointerCanceled
  | typeof REASONS.captureLost
  | typeof REASONS.missedRelease
  | typeof REASONS.documentDetached
  | typeof REASONS.handlerError;

/** Why a drag ended, whether it was released or canceled. */
export type DragEndReason =
  typeof REASONS.drop | typeof REASONS.outsideRelease | DragCanceledReason;

/**
 * Why the drop targets under the pointer changed: the drag started, the pointer moved,
 * a modifier key changed, or the drag ended.
 */
export type DropTargetChangeReason = DragStartReason | DragMoveReason | DragEndReason;

/** The properties every drag event details object adds to `reason` and `event`. */
export interface DragEventDetailsProperties {
  /** The pointer position and drop targets, now and at previous moments of the drag. */
  location: DraggableLocationHistory;
}

/**
 * The second argument of every drag event handler: the event `reason`, the native `event`,
 * and the drag `location`. These events can't be canceled. Use `onBeforeMoveStart` to
 * prevent a drag from starting.
 */
export type DragEventDetails<TReason extends string> = BaseUIGenericEventDetails<
  TReason,
  DragEventDetailsProperties
>;

/** The properties `onBeforeMoveStart`'s event details add to the Base UI change details. */
export interface BeforeMoveStartEventDetailsProperties {
  /** The pointer state at pickup. */
  input: DraggableInput;
}

/** The event details passed to `onMoveStart`. */
export type MoveStartEventDetails = DragEventDetails<DragStartReason>;

/** The event details passed to `onMove`. */
export type MoveEventDetails = DragEventDetails<DragMoveReason>;

/** The event details passed to `onTargetChange`, `onDraggableEnter` and `onDraggableLeave`. */
export type DropTargetChangeEventDetails = DragEventDetails<DropTargetChangeReason>;

/** The event details passed to `onDraggableDrop`. */
export type DragDropEventDetails = DragEventDetails<typeof REASONS.drop>;

/** The properties `onMoveEnd`'s event details add to the drag event details. */
export interface MoveEndEventDetailsProperties extends DragEventDetailsProperties {
  /**
   * Whether the drag was canceled rather than released, for example with Escape or
   * `cancelDrag()`. A release outside any drop target is not a cancel.
   *
   * Other Base UI events describe what happened through `reason` alone. A drag keeps
   * this flag as well because cancel reasons are open-ended: more may be added, so a
   * check against a list of them would silently miss the new ones. Read `canceled` to
   * tell a cancel from a release, and `reason` to tell a drop (`'drop'`) from a release
   * outside any drop target (`'outside-release'`).
   *
   * Not to be confused with `isCanceled` on the details of `onBeforeMoveStart` and
   * `onDragScroll`, which reports whether a handler called `cancel()`.
   */
  canceled: boolean;
}

/** The event details passed to `onMoveEnd`. */
export type MoveEndEventDetails = BaseUIGenericEventDetails<
  DragEndReason,
  MoveEndEventDetailsProperties
>;

/** Maps each drag source and monitor event to the details object its handler receives second. */
export interface DraggableEventDetailsMap {
  onMoveStart: MoveStartEventDetails;
  onMove: MoveEventDetails;
  onTargetChange: DropTargetChangeEventDetails;
  onMoveEnd: MoveEndEventDetails;
}

/** Maps each drop target event to the details object its handler receives second. */
export interface DropTargetEventDetailsMap {
  onDraggableStart: MoveStartEventDetails;
  onDraggableMove: MoveEventDetails;
  onDraggableEnter: DropTargetChangeEventDetails;
  onDraggableLeave: DropTargetChangeEventDetails;
  onDraggableDrop: DragDropEventDetails;
}
