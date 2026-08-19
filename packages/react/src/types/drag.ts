import type * as React from 'react';

export type DragCleanupFn = () => void;

/**
 * The input method driving a drag.
 *
 * - `'pointer'`: a mouse, pen, or touch gesture.
 * - `'keyboard'`: a keyboard gesture, whose coordinates are synthesized.
 *
 * This event family covers Base UI registered draggable elements. Native
 * and external OS drags are outside it and would use a separate adapter and
 * event family rather than widening this union.
 */
export type DragMode = 'pointer' | 'keyboard';

/** Pointer device that initiated the drag. */
export type DragPointerType = 'mouse' | 'pen' | 'touch';

/** Pointer state captured at the moment a drag-and-drop event fires. */
export interface DragInput {
  /**
   * `MouseEvent.button` semantics: 0 = primary, 1 = middle, 2 = secondary.
   * Move-derived events (`onDrag`, `onDropTargetChange`) carry `-1`, as no button changed.
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
  /**
   * The pointer device that produced this input, or `null` for a keyboard drag.
   * Read the event's `mode` to detect a keyboard drag.
   */
  pointerType: DragPointerType | null;
  /** Whether the Control key was held. */
  ctrlKey: boolean;
  /** Whether the Shift key was held. */
  shiftKey: boolean;
  /** Whether the Alt key was held. */
  altKey: boolean;
  /** Whether the Meta (Command/Windows) key was held. */
  metaKey: boolean;
}

/**
 * The four modifier keys, as every event that carries them reports them.
 * @internal
 */
export type DragModifierKeys = Pick<DragInput, 'ctrlKey' | 'shiftKey' | 'altKey' | 'metaKey'>;

/** A 2D coordinate in CSS pixels. */
export interface DragPosition {
  x: number;
  y: number;
}

/**
 * Where the pointer sat inside a drop target, as a fraction of that target's border box:
 * `0` at the left/top edge, `1` at the right/bottom. See `DropTargetRecord.getLocalPoint`.
 */
export interface DragLocalPoint {
  x: number;
  y: number;
}

/**
 * The number of equal steps used to snap a drop target's local point on each
 * axis. An omitted axis or non-positive count is not snapped. Counts divide the
 * target's border box and do not depend on its rendered size. For example,
 * `{ y: 96 }` divides a day column into 15-minute slots at any height.
 */
export interface DragSnapSteps {
  x?: number | undefined;
  y?: number | undefined;
}

/** Options for `DropTargetRecord.getSnappedLocalPoint`. */
export interface DragSnappedLocalPointOptions {
  /**
   * The point to snap. `'pointer'` uses the pointer position. `'source'` applies
   * the grab offset first, so the result represents the dragged element's leading
   * edges. Use `'source'` when committing the element's position. Falls back to
   * `'pointer'` when no grab offset is available.
   * @default 'pointer'
   */
  anchor?: 'pointer' | 'source' | undefined;
}

/** A drop target in the active hover stack. */
export interface DropTargetRecord<TLocalData = unknown> {
  /** The drop target's own DOM element. */
  element: Element;
  /**
   * Human-readable name supplied by the drop target's `label`, used by the default
   * screen-reader announcements. `undefined` when the target was registered without one.
   */
  label: string | undefined;
  /**
   * Identity of the kind supplied by the drop target's `kind`, or `undefined` when the
   * target was registered without one. Test it with the kind's `matches`, which narrows
   * `payload` at the same time.
   */
  kind: symbol | undefined;
  /**
   * Data supplied by the drop target's `payload`.
   * `undefined` when the target was registered without one.
   */
  payload: TLocalData;
  /**
   * Where the pointer sat inside this target when the target was resolved, as a fraction
   * of the target's border box on each axis. Use it when the drop resolves to a value
   * spread across the target rather than to the target itself:
   *
   * ```tsx
   * <DropTarget.Root
   *   accept={eventKind}
   *   onDrop={({ self }) => {
   *     schedule(self.getLocalPoint().y * MINUTES_PER_DAY);
   *   }}
   * />
   * ```
   *
   * The first call measures the target. Later calls on the same record reuse the
   * measurement. Records are rebuilt on every move.
   *
   * Not clamped: an ancestor in the stack can have the pointer outside its own box, so
   * clamp where the domain requires it. Both axes report `0` for a target with no extent,
   * including one detached since the drag began.
   */
  getLocalPoint: () => DragLocalPoint;
  /**
   * Returns `getLocalPoint()` rounded to the target's `snap` steps and clamped
   * between `0` and `1`:
   *
   * ```tsx
   * <DropTarget.Root
   *   accept={eventKind}
   *   snap={{ y: 96 }}
   *   onDrop={({ source, self }) => {
   *     // Already a multiple of 15 minutes.
   *     schedule(source.payload.id, self.getSnappedLocalPoint().y * MINUTES_PER_DAY);
   *   }}
   * />
   * ```
   *
   * Pass `{ anchor: 'source' }` to snap the dragged element's leading edges instead
   * of the pointer. An axis without declared steps returns its clamped raw fraction.
   * This method shares the measurement from `getLocalPoint()`.
   */
  getSnappedLocalPoint: (options?: DragSnappedLocalPointOptions) => DragLocalPoint;
}

/**
 * Snapshot of the pointer state and the active drop targets at one moment.
 * Each event carries its own snapshot, so it keeps reporting the moment it fired.
 */
export interface DragLocation {
  input: DragInput;
  /** The active drop targets, innermost first. */
  dropTargets: readonly DropTargetRecord[];
}

/** The locations carried with every drag event. */
export interface DragLocationHistory {
  /** The location when the drag began. */
  initial: DragLocation;
  /** The location at the moment this event fires. */
  current: DragLocation;
  /**
   * The location at the prior event. On the first event of a drag it holds the
   * pickup input and no drop targets, so a `current` vs `previous` diff reads as
   * no movement rather than a jump.
   */
  previous: DragLocation;
}

/**
 * The drag source carried with every event.
 * Survives the original element being unmounted, for example by a virtualizer.
 *
 * Every source in this event family is a registered Base UI draggable.
 * Native and external OS drags, which may have no source element, are outside
 * this contract and would use a separate adapter and event family.
 */
export interface DragSource<TData = unknown> {
  /** The draggable's own DOM element. */
  element: HTMLElement;
  /**
   * Human-readable name supplied by the draggable's `label`, used by the default
   * screen-reader announcements. `undefined` when the source was registered without one.
   */
  label: string | undefined;
  /**
   * Identity of the kind supplied by the draggable's `kind`. Test it with the kind's
   * `matches`, which narrows `payload` at the same time.
   */
  kind: symbol;
  /** The element the user pressed. `null` when the whole draggable is its own handle. */
  dragHandle: Element | null;
  /**
   * Data supplied by the draggable's `payload`, evaluated at drag start.
   * `undefined` when the source was registered without one.
   */
  payload: TData;
}

/**
 * A kind of draggable item or drop target, created with `Draggable.createKind` or
 * `Draggable.createGlobalKind`.
 *
 * `TPayload` is the data things of this kind carry, so declaring it once on the kind
 * types `source.payload` and `self.payload` everywhere the kind is used.
 */
export interface DragKind<TPayload = unknown> {
  /**
   * The name or global key used to create this kind. This is not an accessible
   * name. Use `label` on a draggable or drop target instead.
   */
  readonly name: string;
  /**
   * The kind's runtime identity. `createKind` creates a fresh symbol for each call;
   * `createGlobalKind` interns it on the namespaced key.
   */
  readonly id: symbol;
  /**
   * Whether this drag source is of this kind, narrowing its `payload` to `TPayload`.
   */
  matches(source: DragSource<unknown>): source is DragSource<TPayload>;
  /**
   * Whether this drop target record is of this kind, narrowing its `payload` to `TPayload`.
   */
  matches(target: DropTargetRecord<unknown>): target is DropTargetRecord<TPayload>;
}

/**
 * One or more drag kinds accepted by a drop target or monitor. The accepted kinds
 * determine the type of `source.payload`.
 */
export type DragAccept<TPayload> = DragKind<TPayload> | ReadonlyArray<DragKind<TPayload>>;

/**
 * A drag kind or array of kinds accepted by generic registration APIs.
 * @public
 */
export type AnyDragAccept = DragKind<unknown> | ReadonlyArray<DragKind<unknown>>;

/**
 * The payload type declared by `accept`. An array produces a union, and an omitted
 * `accept` produces `unknown`.
 * @public
 */
// Distributive on purpose, so both the array entries and an `accept` that is itself a
// union (a wrapper forwarding `DragAccept<T>`) resolve to the union of their payloads.
export type AcceptedDragPayload<TAccept> =
  TAccept extends DragKind<infer TPayload>
    ? TPayload
    : TAccept extends ReadonlyArray<infer TKind>
      ? TKind extends DragKind<infer TPayload>
        ? TPayload
        : never
      : unknown;

/** Fields included in every drag-and-drop event. */
export interface BaseDragEvent<TSourceData = unknown> {
  location: DragLocationHistory;
  source: DragSource<TSourceData>;
  /**
   * The input method driving the drag.
   * This is the reliable way to detect a keyboard drag, as
   * `location.current.input.pointerType` is `null` for those.
   */
  mode: DragMode;
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
 * Determines where the drag preview sits relative to the pointer.
 *
 * - `'source'`: Keep the grab point the element was picked up by, so the preview lifts
 *   off without shifting.
 * - `'pointer'`: Place the preview's top-left under the pointer. Use it for a preview
 *   that isn't shaped like the source, such as a small label chip.
 * - `DragPosition`: A fixed offset, in CSS pixels, from the preview's top-left to the pointer.
 * - `function`: Called at drag start with the rendered preview, the source rect, and the
 *   pointer state. Return the offset to use.
 */
export type DragPreviewOffset =
  | DragPosition
  | 'source'
  | 'pointer'
  | ((parameters: DragPreviewOffsetParameters) => DragPosition);

/**
 * Determines where the drag preview is injected in the DOM.
 *
 * - `HTMLElement`: Inject into this element.
 * - `RefObject`: Inject into the ref element.
 * - `function`: Called at drag start with the source element. Return the element to
 *   inject into, or `null`/`undefined` to use the default behavior.
 */
export type DragPreviewContainer =
  | HTMLElement
  | { current: HTMLElement | null }
  | ((source: HTMLElement) => HTMLElement | null | undefined);

/**
 * The event object of each drag-and-drop event, indexed by the event name.
 * `DragEventMap<TData>['onDrag']` is the event object passed to `onDrag` callbacks.
 * For a drop target's handlers use {@link DropTargetEvent} (or {@link DropEvent}),
 * which add the target's own `self` record.
 */
export interface DragEventMap<TSourceData = unknown> {
  onDragStart: DragStartEvent<TSourceData>;
  onDrag: DragMoveEvent<TSourceData>;
  onDropTargetChange: DropTargetChangeEvent<TSourceData>;
  onDragEnter: BaseDragEvent<TSourceData>;
  onDragLeave: BaseDragEvent<TSourceData>;
  onDrop: DragDropEvent<TSourceData>;
  onDragEnd: DragEndEvent<TSourceData>;
}

/** The drag context passed to a drag preview's `render` callback at drag start. */
export type DragPreviewRenderEvent<TSourceData = unknown> = BaseDragEvent<TSourceData>;

/** The event object passed to `onDragStart`. */
export type DragStartEvent<TSourceData = unknown> = BaseDragEvent<TSourceData>;

/** The event object passed to `onDrag`. */
export type DragMoveEvent<TSourceData = unknown> = BaseDragEvent<TSourceData>;

/** The event object passed to `onDropTargetChange`. */
export type DropTargetChangeEvent<TSourceData = unknown> = BaseDragEvent<TSourceData>;

/** The event object passed to `onDragEnd`. */
export type DragEndEvent<TSourceData = unknown> = BaseDragEvent<TSourceData> & {
  /**
   * Whether the drag was aborted instead of released by the user.
   * A drag released outside of any drop target is not canceled; read `dropTarget` for that,
   * or `eventDetails.reason` for the exact outcome.
   */
  canceled: boolean;
  /**
   * The innermost drop target the release landed on, or `null` when the release was
   * over no target or the drag was canceled.
   */
  dropTarget: DropTargetRecord | null;
};

/**
 * The event object passed to `onDrop`. This event fires only after release over an
 * accepting target, so `dropTarget` is never `null`. In a drop target's `onDrop`,
 * it is the same record as `self`.
 */
export type DragDropEvent<TSourceData = unknown> = BaseDragEvent<TSourceData> & {
  dropTarget: DropTargetRecord;
};

/** The event object passed to a drop target's `onDrop`. */
export type DropEvent<TSourceData = unknown, TLocalData = unknown> = Omit<
  DragDropEvent<TSourceData>,
  'dropTarget'
> &
  DropTargetSelf<TLocalData> & {
    dropTarget: DropTargetRecord<TLocalData>;
  };

/**
 * The event object passed to a drop target's event `K`.
 * Use it to type a handler extracted out of the JSX, which `DragEventMap` alone
 * would leave without `self`:
 *
 * ```ts
 * function handleDragEnter(event: DropTargetEvent<'onDragEnter', CardPayload, SlotData>) {}
 * ```
 */
export type DropTargetEvent<
  K extends keyof DragEventMap,
  TSourceData = unknown,
  TLocalData = unknown,
> = DragEventMap<TSourceData>[K] & DropTargetSelf<TLocalData>;

/** Context passed to a draggable's `getPayload` and `onBeforeDragStart` callbacks. */
export interface DragStartContext {
  /** Pointer state at drag start. */
  input: DragInput;
  /** The draggable's own DOM element. */
  element: HTMLElement;
  /** The element the user pressed. `null` when the whole draggable is its own handle. */
  dragHandle: Element | null;
}

/** A draggable's payload value. */
// `NoInfer` because `kind` is what the payload type is inferred from: without it a
// `payload` that does not match the kind would widen `TData` instead of being rejected.
export type DraggablePayload<TData> = NoInfer<TData>;

/** Resolves a draggable's payload once, when the drag starts. */
export type DraggablePayloadGetter<TData> = (context: DragStartContext) => NoInfer<TData>;

/**
 * Determines the element that must receive the press for a drag to start.
 *
 * - `Element`: This element is the handle.
 * - `RefObject`: The ref element is the handle.
 * - `function`: Return the handle element, or `null`/`undefined` to make the whole
 *   draggable its own handle.
 */
export type DragHandle = Element | { current: Element | null } | (() => Element | null | undefined);

/** The input method about to drive the drag. */
export type DragStartReason = DragMode;

type DragReasonToEvent<TReason extends string> = TReason extends 'pointer'
  ? PointerEvent
  : TReason extends 'keyboard' | 'escape-key' | 'tab-key'
    ? KeyboardEvent
    : TReason extends 'pointer-down' | 'pointer-canceled' | 'capture-lost' | 'missed-release'
      ? PointerEvent
      : TReason extends 'focus-out' | 'window-blur'
        ? FocusEvent
        : TReason extends 'drop' | 'outside-release'
          ? PointerEvent | KeyboardEvent
          : Event;

/** The event details passed to `onBeforeDragStart`. Call `cancel()` to prevent the drag. */
export type BeforeDragStartEventDetails = {
  [TReason in DragStartReason]: {
    /** The input method attempting to start the drag. */
    reason: TReason;
    /** The pointer or keyboard event that attempted the pickup. */
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
 * Why a drag finished without being aborted.
 *
 * - `'drop'`: released over an accepting drop target. `onDrop` fires for this one only.
 * - `'outside-release'`: released over no accepting target, so nothing was committed.
 */
export type DragCompletedReason = 'drop' | 'outside-release';

/**
 * Why a drag was aborted.
 *
 * Escape and Tab represent deliberate user actions. The other reasons describe an
 * interrupted drag. Unless the distinction matters to your app, handle those reasons
 * together and include a default branch for reasons added in a future release.
 *
 * - `'escape-key'` / `'tab-key'`: the user pressed Escape or Tab.
 * - `'pointer-down'`: the user pressed a pointer during a keyboard drag.
 * - `'focus-out'`: focus moved into a text input, which needs the keys the drag was swallowing.
 * - `'imperative-action'`: the application called `cancelDrag()`.
 * - `'window-blur'` / `'page-hidden'`: the window lost focus, or the page was hidden.
 * - `'pointer-canceled'`: the browser or OS canceled the pointer stream.
 * - `'capture-lost'`: pointer capture moved away mid-gesture.
 * - `'missed-release'`: the button came up without a terminating event reaching Base UI.
 * - `'handler-error'`: one of your own handlers threw, so Base UI ended the drag.
 *   The original error is rethrown separately.
 * - `'document-detached'`: the drag's document lost its browsing context (iframe removed,
 *   popout closed).
 */
export type DragCanceledReason =
  | 'escape-key'
  | 'tab-key'
  | 'pointer-down'
  | 'focus-out'
  | 'imperative-action'
  | 'window-blur'
  | 'page-hidden'
  | 'pointer-canceled'
  | 'capture-lost'
  | 'missed-release'
  | 'document-detached'
  | 'handler-error';

/** Why a drag ended, in full. `canceled` on the event is `reason` being a cancel one. */
export type DragEndReason = DragCompletedReason | DragCanceledReason;

/** The reason passed to `onDrop`. Always `'drop'`. */
export type DragDropReason = Extract<DragCompletedReason, 'drop'>;

/**
 * Why the hovered drop targets changed: an input moved the drag (`'pointer'` /
 * `'keyboard'`), or the drag ended and the targets are being released.
 */
export type DropTargetChangeReason = DragMode | DragEndReason;

/**
 * The details of a drag event, passed as the second argument to every handler.
 * Contains the event `reason` and native `event`, which are not included in the
 * first handler argument. These events cannot be canceled because Base UI has
 * already applied the action. Use `onBeforeDragStart` to cancel a drag pickup.
 */
export type DragEventDetails<TReason extends string> = {
  [Reason in TReason]: {
    /** Why the event fired. */
    reason: Reason;
    /**
     * The native event behind the dispatch. Programmatic and lifecycle-only
     * reasons carry a generic `Event` placeholder.
     */
    event: DragReasonToEvent<Reason>;
  };
}[TReason];

/** The event details passed to `onDragStart`. */
export type DragStartEventDetails = DragEventDetails<DragStartReason>;
/** The event details passed to `onDrag`. */
export type DragMoveEventDetails = DragEventDetails<DragMode>;
/** The event details passed to `onDropTargetChange`, `onDragEnter` and `onDragLeave`. */
export type DropTargetChangeEventDetails = DragEventDetails<DropTargetChangeReason>;
/** The event details passed to `onDrop`. */
export type DragDropEventDetails = DragEventDetails<DragDropReason>;
/** The event details passed to `onDragEnd`. */
export type DragEndEventDetails = DragEventDetails<DragEndReason>;

/**
 * Maps each drag event to the details object its handler receives second.
 * The parallel of {@link DragEventMap}, which maps them to their payloads.
 */
export interface DragEventDetailsMap {
  onDragStart: DragStartEventDetails;
  onDrag: DragMoveEventDetails;
  onDropTargetChange: DropTargetChangeEventDetails;
  onDragEnter: DropTargetChangeEventDetails;
  onDragLeave: DropTargetChangeEventDetails;
  onDrop: DragDropEventDetails;
  onDragEnd: DragEndEventDetails;
}

/** Context passed to a drop target's `canDrop` and `getPayload` callbacks. */
export interface DropTargetResolutionContext<TSourceData = unknown> {
  /** Pointer state at the moment this callback runs. */
  input: DragInput;
  /** The drag source being evaluated against this target. */
  source: DragSource<TSourceData>;
  /** This drop target's own DOM element. */
  element: Element;
}

/** A drop target's payload value. */
// `TSourceData` stays for source compatibility with the former resolver union.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type DropTargetPayload<TSourceData, TLocalData> = TLocalData;

/** Resolves a drop target's payload each time the target is evaluated. */
export type DropTargetPayloadGetter<TSourceData, TLocalData> = (
  context: DropTargetResolutionContext<NoInfer<TSourceData>>,
) => TLocalData;

/** Extra fields included in the events of a drop target. */
export interface DropTargetSelf<TLocalData = unknown> {
  /** This drop target's own record. */
  self: DropTargetRecord<TLocalData>;
}

// ---------------------------------------------------------------------------
// Keyboard dragging
// ---------------------------------------------------------------------------

/** The arrow keys a keyboard drag responds to. */
export type DragKeyboardArrowKey = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight';

/** Parameters passed to every {@link DragKeyboardAnnouncements} callback. */
export interface DragKeyboardAnnouncementParameters<TSourceData = unknown> {
  /** The drag source being announced. */
  source: DragSource<TSourceData>;
  /** Where the drag started and where it is now, including its drop targets. */
  location: DragLocationHistory;
}

/**
 * Screen-reader announcements for a keyboard drag, pushed to a polite live region.
 * Each callback returns the text to announce, or `null` to stay silent.
 * Omit a callback to keep its default, localized by the nearest `LocalizationProvider`.
 */
export interface DragKeyboardAnnouncements<TSourceData = unknown> {
  /** Announced when the item is picked up. */
  pickedUp?:
    | ((parameters: DragKeyboardAnnouncementParameters<TSourceData>) => string | null)
    | undefined;
  /** Announced, debounced, as the item moves. */
  moved?:
    | ((parameters: DragKeyboardAnnouncementParameters<TSourceData>) => string | null)
    | undefined;
  /**
   * Announced when the item is released with Space or Enter, whether or not it
   * landed on a drop target.
   */
  dropped?:
    | ((parameters: DragKeyboardAnnouncementParameters<TSourceData>) => string | null)
    | undefined;
  /** Announced when the drag is canceled with Escape, Tab, or a blur. */
  canceled?:
    | ((parameters: DragKeyboardAnnouncementParameters<TSourceData>) => string | null)
    | undefined;
  /** Announced when an arrow press moves nowhere. Silent by default. */
  reachedEdge?:
    | ((parameters: DragKeyboardAnnouncementParameters<TSourceData>) => string | null)
    | undefined;
}

/** Parameters passed to a keyboard drag's `finalFocus` callback. */
export interface DragKeyboardFinalFocusParameters<TSourceData = unknown> {
  /** The drag source whose keyboard drag just ended. */
  source: DragSource<TSourceData>;
  /** The final location snapshot, captured before teardown. */
  location: DragLocationHistory;
  /** Whether the drag was aborted instead of released by the user. */
  canceled: boolean;
  /**
   * The innermost drop target the release landed on, or `null` when the release was
   * over no target or the drag was canceled.
   */
  dropTarget: DropTargetRecord | null;
}

/**
 * Determines the element to focus when a keyboard drag ends.
 *
 * - `false`: Do not move focus.
 * - `true`: Move focus based on the default behavior (the drag handle, the source
 *   element, or the drop target if the handle unmounted).
 * - `RefObject`: Move focus to the ref element.
 * - `function`: Called with the drag outcome. Return an element to focus, `true` or
 *   `null` to use the default behavior, or `false`/`undefined` to do nothing.
 */
export type DragKeyboardFinalFocus<TSourceData = unknown> =
  | boolean
  | { current: HTMLElement | null }
  | ((
      parameters: DragKeyboardFinalFocusParameters<TSourceData>,
    ) => boolean | HTMLElement | null | void);

/** What the default behavior would do for an arrow press during a keyboard drag. */
export type DragKeyboardMoveSuggestion =
  | {
      /** A drop target lies ahead in the pressed direction. */
      type: 'target';
      /** The target element the default collision chose. */
      element: Element;
      /**
       * Where the virtual cursor will be aimed inside `element`, measured before any
       * scrolling. Adjust it to aim at a different point of the target, for example to
       * keep a cross-axis coordinate.
       */
      position: DragPosition;
    }
  | {
      /** No target lies ahead, so the default is a fixed pixel step. */
      type: 'step';
      /** The stepped cursor position, clamped to the viewport. */
      position: DragPosition;
    };

/** A drop target that accepts the current drag, with a freshly measured rect. */
export interface DragKeyboardMoveTarget {
  /** The drop target element. */
  element: Element;
  /** The element's bounding rect, measured when `getTargets` was called. */
  rect: DOMRect;
  /** The resolved drop target record. */
  record: DropTargetRecord;
}

/** Parameters passed to a `keyboardMovement` resolver on every arrow press. */
export interface DragKeyboardMoveDetails<TSourceData = unknown> {
  /** The arrow key pressed. */
  key: DragKeyboardArrowKey;
  /** Unit vector for `key`. `ArrowUp` is `{ x: 0, y: -1 }`. */
  direction: DragPosition;
  /** Whether the Shift key was held. No multiplier is applied to a resolver result. */
  shiftKey: boolean;
  /** The native `keydown` event. */
  event: KeyboardEvent;
  /** The virtual cursor before this press, in client coordinates. */
  position: DragPosition;
  /** The drag source being moved. */
  source: DragSource<TSourceData>;
  /** The innermost drop target currently under the virtual cursor, or `null`. */
  target: DropTargetRecord | null;
  /** Where the drag started and where it is now, including its drop targets. */
  location: DragLocationHistory;
  /** What the default behavior would do for this press. */
  suggestion: DragKeyboardMoveSuggestion;
  /**
   * Runs the default directional collision and returns the nearest accepting drop
   * target ahead of the cursor, or `null` when none lies ahead. Pass `key` to look in
   * another direction than the pressed one, and `from` to look from another origin
   * than the current cursor.
   */
  findTarget: (options?: {
    key?: DragKeyboardArrowKey | undefined;
    from?: DragPosition | undefined;
  }) => Element | null;
  /** Returns every drop target accepting this drag, with freshly measured rects. */
  getTargets: () => DragKeyboardMoveTarget[];
}

/**
 * Determines what an arrow press does during a keyboard drag.
 *
 * - `DragPosition`: Move the virtual cursor to these client coordinates, clamped to
 *   the viewport.
 * - `Element`: Scroll the element into view and move onto it.
 * - `DragKeyboardMoveSuggestion`: Accept the suggested move, as is or with an adjusted
 *   `position`.
 * - `false`: Ignore the press, so nothing moves.
 * - `null`/`undefined`: Use the default behavior for this press.
 */
export type DragKeyboardMoveResult =
  | DragPosition
  | Element
  | DragKeyboardMoveSuggestion
  | false
  | null
  | undefined;

/**
 * Controls how arrow keys move a keyboard drag.
 * Called on every arrow press with the press, the drag context, and the suggested move.
 */
export type DragKeyboardMovement<TSourceData = unknown> = (
  details: DragKeyboardMoveDetails<TSourceData>,
) => DragKeyboardMoveResult;

/**
 * How a keyboard drag is started on a draggable.
 *
 * - `'auto'`: Space or Enter picks the element up while it is focused.
 * - `'manual'`: Only `useDragDropManager().startKeyboardDrag()` picks it up, so the element
 *   keeps its own Space and Enter. It stays focusable and announced as draggable.
 * - `'off'`: The element is never keyboard-draggable. The keyboard a11y attributes are
 *   omitted too, so screen readers don't announce a gesture that doesn't exist.
 */
export type DragKeyboardActivation = 'auto' | 'manual' | 'off';

/**
 * An element, a ref object, or a function that returns an element. Base UI resolves
 * it on every constrained move, so a ref can become available during a drag.
 */
export type DragElementReference =
  | HTMLElement
  | { current: HTMLElement | null }
  | (() => HTMLElement | null | undefined);

/** Parameters passed to a {@link DragModifier} on every frame of a drag. */
export interface DragModifierContext {
  /**
   * The point being constrained, in client coordinates. On `Draggable.Root` this is
   * the cursor; on a preview part it is the preview's proposed top-left.
   */
  point: DragPosition;
  /** The same measure when the drag began, the reference an axis lock or grid snaps against. */
  initialPoint: DragPosition;
  /**
   * The cursor this frame, in client coordinates. Identical to `point` on
   * `Draggable.Root`; on a preview part it stays the cursor while `point` is the
   * preview's proposed top-left.
   */
  input: DragPosition;
  /** The drag source element. */
  sourceElement: HTMLElement;
  /** The source element's bounding rect at drag start. */
  sourceRect: DOMRect;
  /**
   * The scale applied to the source by CSS `transform` or `zoom`, measured at drag
   * start across the source and its ancestors.
   *
   * The value is `1` when the source is not scaled. A rotation alone does not change
   * it. On a zoomable canvas, multiply a distance in canvas coordinates by this value
   * to convert it to client pixels. The `snapToGrid` preset does this automatically.
   */
  scale: DragPosition;
  /** The preview element's current rect, or `null` when there is no preview. */
  previewRect: DOMRect | null;
  /**
   * The offset from the preview's top-left to `point`, so the preview is drawn at
   * `point − previewOffset`. `(0, 0)` on a preview part and when there is no preview.
   */
  previewOffset: DragPosition;
  /** The input method driving the drag. */
  mode: DragMode;
  /**
   * Whether the Control key was held by the event that produced this move.
   *
   * During a pointer drag, pressing or releasing a modifier key reapplies the drag
   * modifiers on the next frame. During a keyboard drag, the flags describe each
   * arrow press. Ctrl, Alt, and Meta chords remain available for other shortcuts.
   *
   * Check `mode` with these flags because a key may behave differently for pointer
   * and keyboard drags. For example, Shift increases the step used by
   * `fixedStepKeyboardMovement`.
   */
  ctrlKey: boolean;
  /** Whether the Shift key was held by the event that produced this move. See `ctrlKey`. */
  shiftKey: boolean;
  /** Whether the Alt key was held by the event that produced this move. See `ctrlKey`. */
  altKey: boolean;
  /**
   * Whether the Meta (Command/Windows) key was held by the event that produced this move.
   * See `ctrlKey`.
   */
  metaKey: boolean;
  /** The document's window, for viewport-relative modifiers. */
  ownerWindow: Window;
}

/**
 * Modifies the drag position. Use it to lock an axis, snap to a grid, or constrain
 * the drag to an element or window. It receives the proposed point and returns the
 * point to use.
 *
 * Prebuilt modifiers: `restrictToVerticalAxis`, `restrictToHorizontalAxis`,
 * `restrictToWindowEdges`, `restrictToParentElement`, `restrictToElement`, `snapToGrid`.
 */
export type DragModifier = (context: DragModifierContext) => DragPosition;

/**
 * One or more {@link DragModifier}s, applied in order, each constraining the previous
 * one's result. Falsy array entries are skipped, so a modifier can be applied
 * conditionally, as in `[locked && restrictToVerticalAxis, snapToGrid(8)]`.
 */
export type DragModifiers = DragModifier | ReadonlyArray<DragModifier | false | null | undefined>;

/**
 * How the drag preview is placed and constrained.
 * Every field is read once, at drag start.
 */
export interface DragPreviewSettings {
  /**
   * Determines where the preview sits relative to the pointer. See
   * {@link DragPreviewOffset} for the supported values.
   * @default 'source'
   */
  offset?: DragPreviewOffset | undefined;
  /**
   * Constrains the preview without affecting the drag. The resolved drop target and
   * `location.current.input` remain unchanged.
   * Here the modifier's `point` is the preview's proposed top-left and `input` is the
   * cursor. Runs on every positioned frame, so keep modifiers cheap.
   *
   * To constrain the drag itself, use `modifiers` on `Draggable.Root`.
   */
  modifiers?: DragModifiers | undefined;
  /**
   * Whether to hide the preview. The drag continues while no preview is shown.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * Determines where the preview is injected in the DOM.
   * Defaults to the source's own parent, so the app's CSS still applies to it.
   *
   * Pass a container to keep structural selectors such as `:nth-child` and
   * `:last-child` unchanged, or to keep the preview mounted if the source subtree
   * unmounts. CSS selectors based on the source's ancestors may no longer match.
   * `Draggable.PreviewProvider` can set the container for a whole subtree.
   */
  container?: DragPreviewContainer | undefined;
}

/**
 * The drag preview of a source registered imperatively.
 * Omit it to use a sanitized clone of the source. The clone preserves classes
 * and live element state, but rewrites IDs to keep the document unique.
 *
 * Components describe the preview with `Draggable.Preview` or
 * `Draggable.ClonedPreview` instead.
 */
export interface DragPreviewParameters<TSourceData = unknown> extends DragPreviewSettings {
  /**
   * Renders the preview content, replacing the default clone of the source.
   * Return `null` or `false` to show no preview for this drag.
   */
  render?: ((parameters: DragPreviewRenderEvent<TSourceData>) => React.ReactNode) | undefined;
}
