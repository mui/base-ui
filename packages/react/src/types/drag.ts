import type * as React from 'react';

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

/** Options for `DropTargetRecord.getSnappedLocalPoint`. */
export interface DragSnappedLocalPointOptions {
  /**
   * The point to snap: the pointer position, or the dragged element's top-left corner.
   * Use `'source'` when committing where the element lands.
   * @default 'pointer'
   */
  anchor?: 'pointer' | 'source' | undefined;
}

/** A drop target under the pointer. */
export interface DropTargetRecord<TTargetPayload = unknown, TDragData = unknown> {
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
  /** The drop targets under the pointer, innermost first. */
  dropTargets: readonly DropTargetRecord[];
}

/** The locations carried by every drag event. */
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
  dragHandle: Element | null;
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
  matches(target: DropTargetRecord<unknown>): target is DropTargetRecord<TPayload, TDragData>;
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

/**
 * A drag kind or array of kinds accepted by generic registration APIs.
 * @public
 */
export type AnyDragAccept = DragAccept<unknown>;

/**
 * The payload type declared by `accept`. An array produces a union, and an omitted
 * `accept` produces `unknown`.
 * @public
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

/** The fields included in every drag event. */
export interface BaseDragEvent<TSourcePayload = unknown, TDragData = unknown> {
  /** The pointer position and drop targets, now and at previous moments of the drag. */
  location: DragLocationHistory;
  /** The item being dragged. */
  source: DragSource<TSourcePayload, TDragData>;
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

/**
 * The event object of each drag-and-drop event, indexed by the event name.
 * `DraggableEventMap<TPayload>['onMove']` is the event object passed to `onMove` callbacks.
 * For a drop target's handlers use {@link DropTargetEvent} (or {@link DropEvent}),
 * which add the target's own `target` record.
 */
export interface DraggableEventMap<TSourcePayload = unknown, TDragData = unknown> {
  onMoveStart: MoveStartEvent<TSourcePayload, TDragData>;
  onMove: MoveEvent<TSourcePayload, TDragData>;
  onTargetChange: DropTargetChangeEvent<TSourcePayload, TDragData>;
  onMoveEnd: MoveEndEvent<TSourcePayload, TDragData>;
}

/** Events received by a drop target, before its own target record is attached. */
export interface DropTargetEventMap<TSourcePayload = unknown, TDragData = unknown> {
  onDraggableStart: MoveStartEvent<TSourcePayload, TDragData>;
  onDraggableMove: MoveEvent<TSourcePayload, TDragData>;
  onDraggableEnter: BaseDragEvent<TSourcePayload, TDragData>;
  onDraggableLeave: BaseDragEvent<TSourcePayload, TDragData>;
  onDraggableDrop: DragDropEvent<TSourcePayload, TDragData>;
}

/** The drag context passed to a drag preview's `render` callback at drag start. */
export type DragPreviewRenderEvent<TSourcePayload = unknown, TDragData = unknown> = BaseDragEvent<
  TSourcePayload,
  TDragData
>;

/** The event object passed to `onMoveStart`. */
export type MoveStartEvent<TSourcePayload = unknown, TDragData = unknown> = BaseDragEvent<
  TSourcePayload,
  TDragData
>;

/** The event object passed to `onMove`. */
export type MoveEvent<TSourcePayload = unknown, TDragData = unknown> = BaseDragEvent<
  TSourcePayload,
  TDragData
>;

/** The event object passed to `onTargetChange`. */
export type DropTargetChangeEvent<TSourcePayload = unknown, TDragData = unknown> = BaseDragEvent<
  TSourcePayload,
  TDragData
>;

/** The event object passed to `onMoveEnd`. */
export type MoveEndEvent<TSourcePayload = unknown, TDragData = unknown> = BaseDragEvent<
  TSourcePayload,
  TDragData
> & {
  /**
   * Whether the drag was canceled rather than released. A release outside any drop
   * target isn't a cancellation. Read `eventDetails.reason` for the exact outcome.
   */
  canceled: boolean;
  /**
   * The drop target that received the drop, or `null` when the drag was released
   * outside any target or canceled.
   */
  dropTarget: DropTargetRecord | null;
};

/**
 * The event object passed to `onDraggableDrop`. This event fires only after release over an
 * accepting target, so `dropTarget` is never `null`. In a drop target's `onDraggableDrop`,
 * it is the same record as `target`.
 */
export type DragDropEvent<TSourcePayload = unknown, TDragData = unknown> = BaseDragEvent<
  TSourcePayload,
  TDragData
> & {
  dropTarget: DropTargetRecord;
};

/** The event object passed to a drop target's `onDraggableDrop`. */
export type DropEvent<
  TSourcePayload = unknown,
  TTargetPayload = unknown,
  TDragData = unknown,
  TTargetDragData = unknown,
> = Omit<DragDropEvent<TSourcePayload, TDragData>, 'dropTarget'> &
  DropTargetEventTarget<TTargetPayload, TTargetDragData> & {
    dropTarget: DropTargetRecord<TTargetPayload, TTargetDragData>;
  };

/**
 * The event object passed to a drop target's event `K`.
 * Use it to type a handler extracted out of the JSX, which `DraggableEventMap` alone
 * would leave without `target`:
 *
 * ```ts
 * function handleDragEnter(event: DropTargetEvent<'onDraggableEnter', CardPayload, SlotPayload>) {}
 * ```
 */
export type DropTargetEvent<
  K extends keyof DropTargetEventMap,
  TSourcePayload = unknown,
  TTargetPayload = unknown,
  TDragData = unknown,
  TTargetDragData = unknown,
> = K extends 'onDraggableDrop'
  ? DropEvent<TSourcePayload, TTargetPayload, TDragData, TTargetDragData>
  : DropTargetEventMap<TSourcePayload, TDragData>[K] &
      DropTargetEventTarget<TTargetPayload, TTargetDragData>;

/** Context passed to a draggable's `onBeforeMoveStart` callback. */
export interface MoveStartContext<TPayload = unknown, TDragData = unknown> {
  /**
   * The source being picked up. The same record is used if the drag starts.
   * Call `updateDragData` to initialize gesture data before targets resolve and previews render.
   * A canceled pickup does not carry its gesture data into the next attempt.
   */
  source: DragSource<TPayload, TDragData>;
  /** Pointer state at drag start. */
  input: DragInput;
  /** The draggable's own DOM element. */
  element: HTMLElement;
  /** The element the user pressed. `null` when the whole draggable is its own handle. */
  dragHandle: Element | null;
}

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
export type DragStartReason = 'pointer' | 'double-click';

/** Why a drag movement frame ran: pointer activity or a modifier-key change. */
export type DragMoveReason = 'pointer' | 'modifier-key';

type DragReasonToEvent<TReason extends string> = TReason extends 'pointer'
  ? PointerEvent
  : TReason extends 'double-click'
    ? MouseEvent | PointerEvent
    : TReason extends 'modifier-key' | 'escape-key' | 'tab-key'
      ? KeyboardEvent
      : TReason extends 'pointer-canceled' | 'capture-lost' | 'missed-release'
        ? PointerEvent
        : TReason extends 'window-blur'
          ? FocusEvent
          : TReason extends 'drop' | 'outside-release'
            ? PointerEvent | MouseEvent
            : Event;

/** The event details passed to `onBeforeMoveStart`. Call `cancel()` to prevent the drag. */
export type BeforeMoveStartEventDetails = {
  [TReason in DragStartReason]: {
    /** Why the pickup started: a pointer press, or a double-click / double-tap. */
    reason: TReason;
    /** The pointer or mouse event that attempted the pickup. */
    event: DragReasonToEvent<TReason>;
    /** Prevents the drag from starting. */
    cancel: () => void;
    /** Allows the native event to propagate when Base UI would stop it. */
    allowPropagation: () => void;
    /** Whether {@link cancel} has been called. */
    isCanceled: boolean;
    /** Whether {@link allowPropagation} has been called. */
    isPropagationAllowed: boolean;
    /** The element that initiated the pickup, when available. */
    trigger: Element | undefined;
  };
}[DragStartReason];

/**
 * How a drag ended when it wasn't canceled.
 *
 * - `'drop'`: Released over a drop target that accepted it.
 * - `'outside-release'`: Released outside any accepting drop target.
 */
export type DragCompletedReason = 'drop' | 'outside-release';

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
  | 'escape-key'
  | 'tab-key'
  | 'imperative-action'
  | 'window-blur'
  | 'page-hidden'
  | 'pointer-canceled'
  | 'capture-lost'
  | 'missed-release'
  | 'document-detached'
  | 'handler-error';

/** Why a drag ended, whether it completed or was canceled. */
export type DragEndReason = DragCompletedReason | DragCanceledReason;

/** The reason passed to `onDraggableDrop`. Always `'drop'`. */
export type DragDropReason = Extract<DragCompletedReason, 'drop'>;

/**
 * Why the drop targets under the pointer changed: the drag started, the pointer moved,
 * a modifier key changed, or the drag ended.
 */
export type DropTargetChangeReason = DragStartReason | DragMoveReason | DragEndReason;

/**
 * The second argument of every drag event handler: the event `reason` and the native `event`.
 * These events can't be canceled. Use `onBeforeMoveStart` to prevent a drag from starting.
 */
export type DragEventDetails<TReason extends string> = {
  [Reason in TReason]: {
    /** Why the event fired. */
    reason: Reason;
    /**
     * The native event. Reasons that don't come from a native event, such as
     * `'imperative-action'`, carry a generic `Event`.
     */
    event: DragReasonToEvent<Reason>;
  };
}[TReason];

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

/**
 * Maps each drag event to the details object its handler receives second.
 * The parallel of {@link DraggableEventMap}, which maps them to their payloads.
 */
export interface DraggableEventDetailsMap {
  onMoveStart: MoveStartEventDetails;
  onMove: MoveEventDetails;
  onTargetChange: DropTargetChangeEventDetails;
  onMoveEnd: MoveEndEventDetails;
}

/** The details object received as the second argument of a target handler. */
export interface DropTargetEventDetailsMap {
  onDraggableStart: MoveStartEventDetails;
  onDraggableMove: MoveEventDetails;
  onDraggableEnter: DropTargetChangeEventDetails;
  onDraggableLeave: DropTargetChangeEventDetails;
  onDraggableDrop: DragDropEventDetails;
}

/** The argument of a drop target's `canDrop` and `snap` functions. */
export interface DropTargetResolutionContext<TSourcePayload = unknown, TDragData = unknown> {
  /** The current pointer state. */
  input: DragInput;
  /** The item being dragged. */
  source: DragSource<TSourcePayload, TDragData>;
  /** The drop target's own DOM element. */
  element: Element;
}

/** A drop target's payload value. */
export type DropTargetPayload<TTargetPayload> = TTargetPayload;

/** The extra field included in the events of a drop target. */
export interface DropTargetEventTarget<TTargetPayload = unknown, TTargetDragData = unknown> {
  /** The drop target's own record. */
  target: DropTargetRecord<TTargetPayload, TTargetDragData>;
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
 * The drag preview of a source registered with `registerDraggable`.
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
    | ((parameters: DragPreviewRenderEvent<TSourcePayload, TDragData>) => React.ReactNode)
    | undefined;
}
