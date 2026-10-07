import type { DraggableConfig } from './draggable';
import type { DropTargetParameters } from './dropTarget';
import type { ViewportParameters } from './autoScroller';
import type { MonitorParameters } from './monitor';
import type { DraggableKind, DraggableAccept } from '../../draggable/DraggableProvider';
import type { AcceptedDragPayload, AcceptedDragData, DraggablePayload } from './types';

/**
 * Parameters accepted by `Draggable.Root` and `registerSource`. `onGenerateDragPreview`
 * is omitted because the engine overwrites it to publish the preview it built.
 */
export type RegisterSourceParameters<TPayload = undefined, TDragData = unknown> = Omit<
  DraggableConfig<TPayload, TDragData>,
  'onGenerateDragPreview' | 'styleNonce' | 'disableStyleElements'
>;

/** Public drop-target parameters, whose `accept` declaration is required. */
export type RegisterTargetParameters<
  TSourcePayload = unknown,
  TTargetPayload = unknown,
  TDragData = unknown,
  TTargetDragData = unknown,
> = Omit<
  DropTargetParameters<TSourcePayload, TTargetPayload, TDragData, TTargetDragData>,
  'accept'
> & {
  /**
   * One or more kinds of draggable this target accepts. Pass `Draggable.anyKind`
   * to accept every drag, with `source.payload` typed as `unknown`.
   *
   * Drags of other kinds ignore this target, but an ancestor target can still accept them.
   */
  accept: NonNullable<
    DropTargetParameters<TSourcePayload, TTargetPayload, TDragData, TTargetDragData>['accept']
  >;
};

/**
 * Adds `accept`, typed as the inferred kinds so the callbacks get their payload
 * types. It is optional when the accepted payload and drag data are `unknown`, and
 * required otherwise.
 */
export type DragParametersWithInferredAccept<
  TParameters,
  TAccept extends DraggableAccept<unknown>,
> = TParameters &
  ([unknown, unknown] extends [AcceptedDragPayload<TAccept>, AcceptedDragData<TAccept>]
    ? { accept?: TAccept | undefined }
    : { accept: TAccept });

/** A typed observer must declare which source kinds provide its payload and drag data. */
export type DragObserverAccept<TSourcePayload, TDragData = unknown> = [unknown, unknown] extends [
  TSourcePayload,
  TDragData,
]
  ? { accept?: DraggableAccept<TSourcePayload, TDragData> | undefined }
  : { accept: DraggableAccept<TSourcePayload, TDragData> };

/**
 * Adds a required `accept`, typed as the inferred kinds.
 */
export type DragParametersWithRequiredAccept<
  TParameters,
  TAccept extends DraggableAccept<unknown>,
> = TParameters & {
  /** One or more drag source kinds accepted by this target. */
  accept: TAccept;
};

/**
 * {@link DraggableManager} with a single `registerSource` signature where `payload`
 * is optional. `Draggable.Root` enforces the payload requirement in its own props and
 * forwards one parameters shape, so it doesn't need the overloads.
 */
export interface InternalDragEngine extends Omit<
  DraggableManager,
  'registerSource' | 'registerTarget'
> {
  registerSource: <TPayload = undefined, TDragData = unknown>(
    element: HTMLElement,
    getParameters: () => RegisterSourceParameters<TPayload, TDragData>,
    payloadOwner?: object,
  ) => () => void;
  registerTarget: <
    TSourcePayload = unknown,
    TTargetPayload = unknown,
    TDragData = unknown,
    TTargetDragData = unknown,
  >(
    element: HTMLElement,
    getParameters: () => DropTargetParameters<
      TSourcePayload,
      TTargetPayload,
      TDragData,
      TTargetDragData
    >,
  ) => () => void;
}

/**
 * The options of `Draggable.Viewport` and `registerViewport`.
 */
export type RegisterViewportParameters<
  TSourcePayload = unknown,
  TDragData = unknown,
> = ViewportParameters<TSourcePayload, TDragData> & DragObserverAccept<TSourcePayload, TDragData>;

export type RegisterMonitorParameters<
  TSourcePayload = unknown,
  TDragData = unknown,
> = MonitorParameters<TSourcePayload, TDragData> & DragObserverAccept<TSourcePayload, TDragData>;

/**
 * The page-wide drag manager returned by `useManager`.
 *
 * Each `register*` method takes a function returning the options, and returns a
 * cleanup function that unregisters.
 */
export interface DraggableManager {
  /**
   * Registers an element as a drag source, with the options of `Draggable.Root`.
   * Returns a cleanup function that unregisters it.
   */
  // Overloaded so `payload` both drives inference and stays required once the
  // caller declares a `TPayload` of their own, mirroring `Draggable.Root.Props`.
  registerSource: {
    <TPayload, TDragData = unknown>(
      element: HTMLElement,
      getParameters: () => RegisterSourceParameters<TPayload, TDragData> & {
        payload: DraggablePayload<TPayload>;
      },
    ): () => void;
    <TKind extends DraggableKind<undefined, any> = DraggableKind<undefined, unknown>>(
      element: HTMLElement,
      getParameters: () => Omit<
        RegisterSourceParameters<undefined, AcceptedDragData<TKind>>,
        'kind'
      > & { kind: TKind },
    ): () => void;
  };
  /**
   * Registers an element as a drop target, with the options of `Draggable.Target`.
   * Returns a cleanup function that unregisters it.
   */
  // Infer target data from its kind while requiring the declared payload.
  registerTarget: <
    TAccept extends DraggableAccept<unknown> = DraggableKind<unknown, unknown>,
    TTargetPayload = undefined,
    TKind extends DraggableKind<NoInfer<TTargetPayload>, any> | undefined =
      DraggableKind<TTargetPayload, unknown> | undefined,
  >(
    element: HTMLElement,
    getParameters: () => DragParametersWithRequiredAccept<
      Omit<
        RegisterTargetParameters<
          AcceptedDragPayload<TAccept>,
          TTargetPayload,
          AcceptedDragData<TAccept>,
          AcceptedDragData<TKind>
        >,
        'kind'
      >,
      TAccept
    > & {
      kind?: TKind | undefined;
      payload?: NoInfer<AcceptedDragPayload<TKind>> | undefined;
    } & ([TTargetPayload] extends [undefined] ? {} : { payload: TTargetPayload }),
  ) => () => void;
  /**
   * Registers a scroll container, with the options of `Draggable.Viewport`.
   * Pass `document.documentElement` to scroll the page.
   * Returns a cleanup function that unregisters it.
   */
  registerViewport: <TAccept extends DraggableAccept<unknown> = DraggableKind<unknown, unknown>>(
    element: HTMLElement,
    getParameters: () => DragParametersWithInferredAccept<
      RegisterViewportParameters<AcceptedDragPayload<TAccept>, AcceptedDragData<TAccept>>,
      TAccept
    >,
  ) => () => void;
  /**
   * Registers a monitor, with the options of `useMonitor`.
   * Returns a cleanup function that unregisters it.
   */
  registerMonitor: <TAccept extends DraggableAccept<unknown> = DraggableKind<unknown, unknown>>(
    getParameters: () => DragParametersWithInferredAccept<
      RegisterMonitorParameters<AcceptedDragPayload<TAccept>, AcceptedDragData<TAccept>>,
      TAccept
    >,
  ) => () => void;
  /**
   * Cancels the drag in progress, if any. `onMoveEnd` fires with a `null` target
   * and the `'imperative-action'` reason.
   */
  cancelDrag: () => void;
  /**
   * Applies a change to an element's options right away. Call it after the values
   * returned by the element's options function have changed.
   *
   * Most changes don't need it, because Base UI calls the options function each
   * time it needs a value. Call `refresh` when one of these changes:
   *
   * - A source's `disabled` or `handle`. Otherwise its idle styles, which prevent
   *   text selection and the long-press menu on the source or its handle, are
   *   updated only on the next press.
   * - A source's `payload` during its drag, so `useActiveDrag()` returns the new value.
   * - A target's `disabled`, `accept`, or `canDrop` during a drag. Otherwise a
   *   target under a pointer that doesn't move keeps its hover state, and
   *   `onDraggableEnter` and `onDraggableLeave` wait for the pointer to move.
   * - A viewport's options during a drag. Otherwise auto-scrolling starts or stops
   *   only when the pointer moves.
   *
   * It updates every source, target, and viewport registered on the element, and
   * does nothing for an element that isn't registered. `Draggable.Root`,
   * `Draggable.Target`, and `Draggable.Viewport` do this themselves when their
   * props change.
   */
  refresh: (element: HTMLElement) => void;
}
