import type * as React from 'react';
import type {
  BaseUIChangeEventDetails,
  BaseUIGenericEventDetails,
} from '../internals/createBaseUIEventDetails';
import type { REASONS } from '../internals/reasons';

export type DragCleanupFn = () => void;

/** Pointer device that initiated the drag. */
export type DragPointerType = 'mouse' | 'pen' | 'touch';

/** The pointer state at the moment a drag event fires. */
export interface DragInput {
  /**
   * `MouseEvent.button` semantics: 0 = primary, 1 = middle, 2 = secondary.
   * Move-derived events (`onMove`, `onTargetChange`) carry `-1`, as no button changed.
   * Read `buttons` for what is held mid-drag.
   */
  button: number;
  /** `MouseEvent.buttons` bitmask. */
  buttons: number;
  /** Pointer X relative to the viewport, in CSS pixels. */
  clientX: number;
  /** Pointer Y relative to the viewport, in CSS pixels. */
  clientY: number;
  /** Pointer X relative to the document, in CSS pixels (includes scroll). */
  pageX: number;
  /** Pointer Y relative to the document, in CSS pixels (includes scroll). */
  pageY: number;
  /** The pointer device that produced this input. */
  pointerType: DragPointerType;
  /** Whether the Control key was held. */
  ctrlKey: boolean;
  /** Whether the Shift key was held. */
  shiftKey: boolean;
  /** Whether the Alt key was held. */
  altKey: boolean;
  /** Whether the Meta (Command/Windows) key was held. */
  metaKey: boolean;
}

/** A 2D coordinate in CSS pixels. */
export interface DragPosition {
  x: number;
  y: number;
}

/**
 * Where the pointer is within a drop target, as a fraction of its size:
 * `0` at the left or top edge, `1` at the right or bottom edge.
 */
export interface DragLocalPoint {
  x: number;
  y: number;
}

/**
 * The number of equal steps a drop target is divided into on each axis, for
 * `getSnappedLocalPoint()`. An omitted axis isn't snapped. Steps don't depend on
 * the target's size, so `{ y: 96 }` splits a day column into 15-minute slots at any height.
 */
export interface DragSnapSteps {
  x?: number | undefined;
  y?: number | undefined;
}

/** Options for `getSnappedLocalPoint()` on a drop target record. */
export interface DragSnappedLocalPointOptions {
  /**
   * The point to snap: the pointer position, or the dragged element's top-left corner.
   * Use `'source'` when committing where the element lands.
   * @default 'pointer'
   */
  anchor?: 'pointer' | 'source' | undefined;
}

/** A drop target under the pointer. */
export interface DraggableTargetRecord<TTargetPayload = unknown, TDragData = unknown> {
  /** The drop target's own DOM element. */
  element: Element;
  /**
   * The identity of the target's `kind`, or `undefined` when it has none.
   * Test it with a kind's `matches` method, which also narrows `payload`.
   */
  kind: symbol | undefined;
  /**
   * The target's `payload`, or `undefined` when it has none.
   */
  readonly payload: TTargetPayload;
  /** Replaces the payload until the `payload` prop changes. */
  updatePayload(payload: TTargetPayload): void;
  /** Data stored for this target during the current drag. Starts as `undefined`. */
  readonly dragData: TDragData | undefined;
  /** Stores data for this target for the rest of the current drag. */
  updateDragData(dragData: TDragData): void;
  /**
   * Returns where the pointer is within this target, as a fraction of its size on
   * each axis: `0` at the left or top edge, `1` at the right or bottom edge.
   * Use it when a drop means a value spread across the target, such as a time in a day column:
   *
   * ```tsx
   * <Draggable.Target
   *   accept={eventKind}
   *   onDraggableDrop={({ target }) => {
   *     schedule(target.getLocalPoint().y * MINUTES_PER_DAY);
   *   }}
   * />
   * ```
   *
   * The value isn't clamped, since an outer target can have the pointer outside its
   * own box while a nested target is under it. A target with no size reports `0` on both axes.
   */
  getLocalPoint: () => DragLocalPoint;
  /**
   * Returns `getLocalPoint()` rounded to the target's `snap` steps and clamped between `0` and `1`:
   *
   * ```tsx
   * <Draggable.Target
   *   accept={eventKind}
   *   snap={{ y: 96 }}
   *   onDraggableDrop={({ source, target }) => {
   *     // Already a multiple of 15 minutes.
   *     schedule(source.payload.id, target.getSnappedLocalPoint().y * MINUTES_PER_DAY);
   *   }}
   * />
   * ```
   *
   * Pass `{ anchor: 'source' }` to snap the dragged element's top-left corner instead
   * of the pointer. An axis without steps returns its clamped fraction.
   */
  getSnappedLocalPoint: (options?: DragSnappedLocalPointOptions) => DragLocalPoint;
}

/**
 * The pointer state and the drop targets under the pointer at one moment.
 */
export interface DragLocation {
  /** The pointer state. */
  input: DragInput;
  /** The drop targets under the pointer that accept the drag, innermost first. */
  targets: readonly DraggableTargetRecord[];
}

/** Where the drag is and has been, available as `eventDetails.location` in drag handlers. */
export interface DragLocationHistory {
  /** The pointer's offset from the source's top-left corner at pickup, in CSS pixels. */
  grabOffset?: DragPosition | undefined;
  /** The location where the drag started. */
  initial: DragLocation;
  /** The location at the moment this event fires. */
  current: DragLocation;
  /**
   * The location at the previous event. On the first event of a drag, it holds the
   * pickup position and no drop targets.
   */
  previous: DragLocation;
}

/**
 * The item being dragged, carried by every drag event.
 * It stays usable if its element unmounts during the drag, for example in a virtualized list.
 */
export interface DragSource<TPayload = unknown, TDragData = unknown> {
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

declare class DragKindPayload<TPayload, TDragData> {
  private payload: (payload: TPayload) => TPayload;
  private dragData: (dragData: TDragData) => TDragData;
}

/**
 * A kind of draggable item or drop target, created with `Draggable.createKind` or
 * `Draggable.createGlobalKind`. Its payload type is declared once and types
 * `source.payload` and `target.payload` everywhere the kind is used.
 */
export interface DragKind<
  in out TPayload = unknown,
  in out TDragData = unknown,
> extends DragKindPayload<TPayload, TDragData> {
  /**
   * The name or global key the kind was created with. A debugging aid only.
   */
  readonly name: string;
  /**
   * The kind's identity. Unique per `createKind` call, and shared by `createGlobalKind`
   * calls with the same key.
   */
  readonly id: symbol;
  /**
   * Whether a drag source is of this kind. Narrows its `payload` type.
   */
  matches(source: DragSource<unknown>): source is DragSource<TPayload, TDragData>;
  /**
   * Whether a drop target is of this kind. Narrows its `payload` type.
   */
  matches(
    target: DraggableTargetRecord<unknown>,
  ): target is DraggableTargetRecord<TPayload, TDragData>;
}

/**
 * One or more kinds accepted by a drop target, viewport, or monitor.
 * They determine the type of `source.payload`.
 */
export type DragAccept<TPayload, TDragData = unknown> =
  DragAcceptedKind<TPayload, TDragData> | ReadonlyArray<DragAcceptedKind<TPayload, TDragData>>;

/** A kind used to observe payloads, without declaring a payload under that kind. */
export type DragAcceptedKind<TPayload = unknown, TDragData = unknown> = Pick<
  DragKind<TPayload, TDragData>,
  'name' | 'id' | 'matches'
>;

/** A drag kind or array of kinds accepted by generic registration APIs. */
export type AnyDragAccept = DragAccept<unknown>;

/**
 * The payload type declared by `accept`. An array produces a union, and an omitted
 * `accept` produces `unknown`.
 */
// Distributive on purpose, so both the array entries and an `accept` that is itself a
// union (a wrapper forwarding `DragAccept<T>`) resolve to the union of their payloads.
export type AcceptedDragPayload<TAccept> =
  TAccept extends DragAcceptedKind<infer TPayload, any>
    ? TPayload
    : TAccept extends ReadonlyArray<infer TKind>
      ? TKind extends DragAcceptedKind<infer TPayload, any>
        ? TPayload
        : never
      : unknown;

/** The drag data declared by accepted kinds. An array produces a union. */
export type AcceptedDragData<TAccept> =
  TAccept extends DragAcceptedKind<any, infer TDragData>
    ? TDragData
    : TAccept extends ReadonlyArray<infer TKind>
      ? TKind extends DragAcceptedKind<any, infer TDragData>
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
  source: DragSource<TSourcePayload, TDragData>;
  /**
   * The drop target that would receive the drop if the drag were released now, or
   * `null` when there is none: `eventDetails.location.current.targets[0]`.
   * In `onMoveEnd`, it is the target that received the drop, or `null` when the drag
   * was canceled or released outside any target.
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
  source: DragSource<TSourcePayload, TDragData>;
  /** This drop target's own record. */
  target: DraggableTargetRecord<TTargetPayload, TTargetDragData>;
}

/** The first argument of `onBeforeMoveStart`: the item about to be picked up. */
export interface BeforeMoveStartValue<TPayload = unknown, TDragData = unknown> {
  /**
   * The source being picked up. The same record is used if the drag starts.
   * Call `updateDragData` to initialize gesture data before targets resolve and previews render.
   * A canceled pickup does not carry its gesture data into the next attempt.
   */
  source: DragSource<TPayload, TDragData>;
}

/** The argument of a drag preview's render function, called when the drag starts. */
export interface DraggablePreviewRenderParameters<TSourcePayload = unknown, TDragData = unknown> {
  /** The item being dragged. */
  source: DragSource<TSourcePayload, TDragData>;
  /** The pointer position and drop targets when the drag started. */
  location: DragLocationHistory;
}

/** Parameters passed to a drag preview's `offset` callback. */
export interface DragPreviewOffsetParameters {
  /** The preview element, after its content has rendered, so it has a size. */
  container: HTMLElement;
  /** The drag source element's bounding rect at drag start, in client coordinates. */
  sourceRect: DOMRect;
  /** Pointer state at drag start. */
  input: DragInput;
}

/**
 * Where the drag preview sits relative to the pointer.
 *
 * - `'source'`: The preview lifts off the source without shifting.
 * - `'pointer'`: The preview's top-left corner sits under the pointer.
 * - `DragPosition`: A fixed offset from the preview's top-left corner to the pointer, in CSS pixels.
 * - `function`: Called when the drag starts with the rendered preview, the source's
 *   rectangle, and the pointer state. Returns the offset to use.
 */
export type DragPreviewOffset =
  DragPosition | 'source' | 'pointer' | ((parameters: DragPreviewOffsetParameters) => DragPosition);

/**
 * Where the drag preview element is inserted in the DOM.
 *
 * - `HTMLElement`: This element.
 * - `RefObject`: The element the ref points to.
 * - `function`: Called when the drag starts with the source element. Returns the
 *   container, or `null` to use the default.
 */
export type DragPreviewContainer =
  | HTMLElement
  | { current: HTMLElement | null }
  | ((source: HTMLElement) => HTMLElement | null | undefined);

/** A draggable's payload value. */
// `NoInfer` because `kind` is what the payload type is inferred from: without it a
// `payload` that does not match the kind would widen `TPayload` instead of being rejected.
export type DraggablePayload<TPayload> = NoInfer<TPayload>;

/**
 * The element that must be pressed to start a drag.
 *
 * - `Element`: This element.
 * - `RefObject`: The element the ref points to.
 * - `function`: Returns the handle, or `null` to make the whole draggable its own handle.
 */
export type DragHandle = Element | { current: Element | null } | (() => Element | null | undefined);

/**
 * How a drag started: a pointer press that met its activation threshold, or a
 * double-click or double-tap.
 */
export type DragStartReason = typeof REASONS.pointer | typeof REASONS.doubleClick;

/** Why a drag movement frame ran: pointer activity or a modifier-key change. */
export type DragMoveReason = typeof REASONS.pointer | typeof REASONS.modifierKey;

/**
 * How a drag ended when it wasn't canceled.
 *
 * - `'drop'`: Released over a drop target that accepted it.
 * - `'outside-release'`: Released outside any accepting drop target.
 */
export type DragCompletedReason = typeof REASONS.drop | typeof REASONS.outsideRelease;

/**
 * Why a drag was canceled. Escape and Tab are deliberate user actions; the other
 * reasons describe an interrupted drag. Handle unknown reasons too, since more may
 * be added in the future.
 *
 * - `'escape-key'` / `'tab-key'`: The user pressed Escape or Tab.
 * - `'imperative-action'`: The application called `cancelDrag()`.
 * - `'window-blur'` / `'page-hidden'`: The window lost focus, or the page was hidden.
 * - `'pointer-canceled'`: The browser or the operating system canceled the pointer.
 * - `'capture-lost'`: Another element captured the pointer during the drag.
 * - `'missed-release'`: The button was released without Base UI receiving the event.
 * - `'handler-error'`: One of your handlers threw. The error is rethrown separately.
 * - `'document-detached'`: The document was removed, for example a closed iframe.
 */
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

/** Why a drag ended, whether it completed or was canceled. */
export type DragEndReason = DragCompletedReason | DragCanceledReason;

/** The reason passed to `onDraggableDrop`. Always `'drop'`. */
export type DragDropReason = typeof REASONS.drop;

/**
 * Why the drop targets under the pointer changed: the drag started, the pointer moved,
 * a modifier key changed, or the drag ended.
 */
export type DropTargetChangeReason = DragStartReason | DragMoveReason | DragEndReason;

/** The properties every drag event details object adds to `reason` and `event`. */
export interface DragEventDetailsProperties {
  /** The pointer position and drop targets, now and at previous moments of the drag. */
  location: DragLocationHistory;
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
  input: DragInput;
}

/** The event details passed to `onBeforeMoveStart`. Call `cancel()` to prevent the drag. */
export type BeforeMoveStartEventDetails = BaseUIChangeEventDetails<
  DragStartReason,
  BeforeMoveStartEventDetailsProperties
>;

/** The event details passed to `onMoveStart`. */
export type MoveStartEventDetails = DragEventDetails<DragStartReason>;
/** The event details passed to `onMove`. */
export type MoveEventDetails = DragEventDetails<DragMoveReason>;
/** The event details passed to `onTargetChange`, `onDraggableEnter` and `onDraggableLeave`. */
export type DropTargetChangeEventDetails = DragEventDetails<DropTargetChangeReason>;
/** The event details passed to `onDraggableDrop`. */
export type DragDropEventDetails = DragEventDetails<DragDropReason>;
/** The event details passed to `onMoveEnd`. */
export type MoveEndEventDetails = DragEventDetails<DragEndReason>;

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

/** The argument of a drop target's `canDrop` and `snap` functions. */
export interface DraggableTargetResolutionContext<TSourcePayload = unknown, TDragData = unknown> {
  /** The current pointer state. */
  input: DragInput;
  /** The item being dragged. */
  source: DragSource<TSourcePayload, TDragData>;
  /** The drop target's own DOM element. */
  element: Element;
}

/**
 * An element, a ref to one, or a function returning one. Resolved on every move,
 * so a ref can become available during a drag.
 */
export type DragElementReference =
  HTMLElement | { current: HTMLElement | null } | (() => HTMLElement | null | undefined);

/** The argument of a {@link DragModifier}, on every frame of a drag. */
export interface DragModifierContext {
  /**
   * The point to constrain, in client pixels. On `Draggable.Root`, it's the pointer
   * position. On `Draggable.Preview`, it's the preview's proposed top-left corner.
   */
  point: DragPosition;
  /** The same point when the drag started. Axis locks and grid snaps anchor to it. */
  initialPoint: DragPosition;
  /**
   * The point before any modifier of this chain ran, in client pixels.
   * On `Draggable.Preview`, it already includes the root's modifiers.
   */
  input: DragPosition;
  /** The drag source element. */
  sourceElement: HTMLElement;
  /** The source element's bounding rectangle when the drag started. */
  sourceRect: DOMRect;
  /**
   * The scale applied to the element by CSS `transform` or `zoom`, including its
   * ancestors. `1` when nothing is scaled. Multiply a distance in the element's own
   * units by this value to convert it to client pixels.
   */
  scale: DragPosition;
  /** The preview element's current bounding rectangle, or `null` when there is no preview. */
  previewRect: DOMRect | null;
  /**
   * The offset from the preview's top-left corner to `point`. `{ x: 0, y: 0 }` on
   * `Draggable.Preview` and when there is no preview.
   */
  previewOffset: DragPosition;
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
export type DragModifier = (context: DragModifierContext) => DragPosition;

/**
 * One or more {@link DragModifier}s, applied in order. Each receives the previous one's
 * result. Falsy entries are skipped, so a modifier can be applied conditionally,
 * as in `[locked && restrictToVerticalAxis, snapToGrid(8)]`.
 */
export type DragModifiers = DragModifier | ReadonlyArray<DragModifier | false | null | undefined>;

/**
 * How the drag preview is positioned. Read once, when the drag starts.
 */
export interface DragPreviewSettings {
  /**
   * Where the preview sits relative to the pointer.
   * @default 'source'
   */
  offset?: DragPreviewOffset | undefined;
  /**
   * One or more modifiers that constrain the preview only. The drop position still
   * follows the pointer. To constrain the drag itself, use `modifiers` on `Draggable.Root`.
   */
  modifiers?: DragModifiers | undefined;
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
  container?: DragPreviewContainer | undefined;
}

/**
 * The drag preview of a source registered with `registerSource`.
 * Omit it to use a clone of the source. `Draggable.Root` uses `Draggable.Preview` instead.
 */
export interface DragPreviewParameters<
  TSourcePayload = unknown,
  TDragData = unknown,
> extends DragPreviewSettings {
  /**
   * Renders the preview content instead of cloning the source.
   * Return `null` to show no preview for this drag.
   */
  render?:
    | ((parameters: DraggablePreviewRenderParameters<TSourcePayload, TDragData>) => React.ReactNode)
    | undefined;
}

// The per-event types of each part, named after the part and the event. The parts
// re-export them and alias them on their namespace, such as `Draggable.Root.MoveValue`.

export interface DraggableRootBeforeMoveStartValue<
  TPayload = unknown,
  TDragData = unknown,
> extends BeforeMoveStartValue<TPayload, TDragData> {}
export type DraggableRootBeforeMoveStartEventDetails = BeforeMoveStartEventDetails;
export type DraggableRootBeforeMoveStartEventReason =
  DraggableRootBeforeMoveStartEventDetails['reason'];
export interface DraggableRootMoveStartValue<
  TPayload = unknown,
  TDragData = unknown,
> extends DragSourceEventValue<TPayload, TDragData> {}
export type DraggableRootMoveStartEventDetails = MoveStartEventDetails;
export type DraggableRootMoveStartEventReason = DraggableRootMoveStartEventDetails['reason'];
export interface DraggableRootMoveValue<
  TPayload = unknown,
  TDragData = unknown,
> extends DragSourceEventValue<TPayload, TDragData> {}
export type DraggableRootMoveEventDetails = MoveEventDetails;
export type DraggableRootMoveEventReason = DraggableRootMoveEventDetails['reason'];
export interface DraggableRootTargetChangeValue<
  TPayload = unknown,
  TDragData = unknown,
> extends DragSourceEventValue<TPayload, TDragData> {}
export type DraggableRootTargetChangeEventDetails = DropTargetChangeEventDetails;
export type DraggableRootTargetChangeEventReason = DraggableRootTargetChangeEventDetails['reason'];
export interface DraggableRootMoveEndValue<
  TPayload = unknown,
  TDragData = unknown,
> extends DragSourceEventValue<TPayload, TDragData> {}
export type DraggableRootMoveEndEventDetails = MoveEndEventDetails;
export type DraggableRootMoveEndEventReason = DraggableRootMoveEndEventDetails['reason'];

export interface DraggableTargetStartValue<
  TSourcePayload = unknown,
  TTargetPayload = unknown,
  TDragData = unknown,
  TTargetDragData = unknown,
> extends DropTargetEventValue<TSourcePayload, TTargetPayload, TDragData, TTargetDragData> {}
export type DraggableTargetStartEventDetails = DropTargetEventDetailsMap['onDraggableStart'];
export type DraggableTargetStartEventReason = DraggableTargetStartEventDetails['reason'];
export interface DraggableTargetMoveValue<
  TSourcePayload = unknown,
  TTargetPayload = unknown,
  TDragData = unknown,
  TTargetDragData = unknown,
> extends DropTargetEventValue<TSourcePayload, TTargetPayload, TDragData, TTargetDragData> {}
export type DraggableTargetMoveEventDetails = DropTargetEventDetailsMap['onDraggableMove'];
export type DraggableTargetMoveEventReason = DraggableTargetMoveEventDetails['reason'];
export interface DraggableTargetEnterValue<
  TSourcePayload = unknown,
  TTargetPayload = unknown,
  TDragData = unknown,
  TTargetDragData = unknown,
> extends DropTargetEventValue<TSourcePayload, TTargetPayload, TDragData, TTargetDragData> {}
export type DraggableTargetEnterEventDetails = DropTargetEventDetailsMap['onDraggableEnter'];
export type DraggableTargetEnterEventReason = DraggableTargetEnterEventDetails['reason'];
export interface DraggableTargetLeaveValue<
  TSourcePayload = unknown,
  TTargetPayload = unknown,
  TDragData = unknown,
  TTargetDragData = unknown,
> extends DropTargetEventValue<TSourcePayload, TTargetPayload, TDragData, TTargetDragData> {}
export type DraggableTargetLeaveEventDetails = DropTargetEventDetailsMap['onDraggableLeave'];
export type DraggableTargetLeaveEventReason = DraggableTargetLeaveEventDetails['reason'];
export interface DraggableTargetDropValue<
  TSourcePayload = unknown,
  TTargetPayload = unknown,
  TDragData = unknown,
  TTargetDragData = unknown,
> extends DropTargetEventValue<TSourcePayload, TTargetPayload, TDragData, TTargetDragData> {}
export type DraggableTargetDropEventDetails = DropTargetEventDetailsMap['onDraggableDrop'];
export type DraggableTargetDropEventReason = DraggableTargetDropEventDetails['reason'];
