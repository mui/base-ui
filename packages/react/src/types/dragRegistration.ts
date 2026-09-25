import type { DraggableConfig } from '../utils/drag-and-drop/draggable';
import type { DragPreviewDeclaration } from '../utils/drag-and-drop/dragPreviewDeclaration';
import type { RegisterDropTargetParameters as InternalRegisterDropTargetParameters } from '../utils/drag-and-drop/dropTarget';
import type { RegisterAutoScrollerParameters as InternalRegisterAutoScrollerParameters } from '../utils/drag-and-drop/autoScroller';
import type { RegisterMonitorParameters as InternalRegisterMonitorParameters } from '../utils/drag-and-drop/monitor';
import type {
  AcceptedDragPayload,
  AcceptedDragData,
  AnyDragAccept,
  DragCleanupFn,
  DragKind,
  DragAccept,
  DraggablePayload,
  DropTargetPayload,
} from './drag';

/** Parameters accepted by `Draggable.Root` and `registerDraggable`, except the element. */
// `onGenerateDragPreview` is omitted because the engine overwrites it to publish the
// preview it built.
export type RegisterDraggableParameters<TPayload = undefined, TDragData = unknown> = Omit<
  DraggableConfig<TPayload, TDragData>,
  | 'element'
  | 'onGenerateDragPreview'
  | 'getDragPreviewDeclaration'
  | 'styleNonce'
  | 'disableStyleElements'
>;

/**
 * Registration parameters for a draggable with a required payload.
 * @public
 */
export type RegisterDraggableParametersWithPayload<
  TPayload,
  TDragData = unknown,
> = RegisterDraggableParameters<TPayload, TDragData> & { payload: DraggablePayload<TPayload> };

/** Public drop-target parameters, whose `accept` declaration is required. */
export type RegisterDropTargetParameters<
  TSourcePayload = unknown,
  TTargetPayload = unknown,
  TDragData = unknown,
  TTargetDragData = unknown,
> = Omit<
  InternalRegisterDropTargetParameters<TSourcePayload, TTargetPayload, TDragData, TTargetDragData>,
  'accept'
> & {
  /**
   * One or more kinds of draggable this target accepts. Pass `Draggable.anyKind`
   * to accept every drag, with `source.payload` typed as `unknown`.
   *
   * Drags of other kinds ignore this target, but an ancestor target can still accept them.
   */
  accept: NonNullable<
    InternalRegisterDropTargetParameters<
      TSourcePayload,
      TTargetPayload,
      TDragData,
      TTargetDragData
    >['accept']
  >;
};

/**
 * Drop target registration parameters whose local payload is required.
 * @public
 */
export type RegisterDropTargetParametersWithPayload<
  TSourcePayload,
  TTargetPayload,
  TDragData = unknown,
  TTargetDragData = unknown,
> = RegisterDropTargetParameters<TSourcePayload, TTargetPayload, TDragData, TTargetDragData> & {
  payload: DropTargetPayload<TTargetPayload>;
};

/** Checks a target's payload against its own kind. */
export type DragParametersWithTargetKind<TKind extends DragKind<any, any> | undefined> = {
  kind?: TKind | undefined;
  payload?: NoInfer<AcceptedDragPayload<TKind>> | undefined;
};

/**
 * Preserves the accepted kinds while inferring callback payload types.
 */
export type DragParametersWithInferredAccept<
  TParameters,
  TAccept extends AnyDragAccept,
> = TParameters &
  (unknown extends AcceptedDragPayload<TAccept>
    ? { accept?: TAccept | undefined }
    : { accept: TAccept });

/** A typed observer must declare which source kinds provide its payload. */
export type DragObserverAccept<TSourcePayload, TDragData = unknown> = unknown extends TSourcePayload
  ? { accept?: DragAccept<TSourcePayload, TDragData> | undefined }
  : { accept: DragAccept<TSourcePayload, TDragData> };

/**
 * Preserves the accepted kinds while requiring `accept`.
 */
export type DragParametersWithRequiredAccept<
  TParameters,
  TAccept extends AnyDragAccept,
> = TParameters & {
  /** One or more drag source kinds accepted by this target. */
  accept: TAccept;
};

/**
 * {@link DragDropManager} with a single, payload-optional `registerDraggable` signature.
 * `Draggable.Root` enforces the payload requirement at its own boundary and then
 * forwards a uniform parameters object, so the overloads would only get in the way.
 */
export interface InternalDragEngine extends Omit<
  DragDropManager,
  'registerDraggable' | 'registerDropTarget'
> {
  registerDraggable: <TPayload = undefined, TDragData = unknown>(
    element: HTMLElement,
    getParameters: () => RegisterDraggableParameters<TPayload, TDragData>,
    payloadOwner?: object,
  ) => DragCleanupFn;
  registerDropTarget: <
    TSourcePayload = unknown,
    TTargetPayload = unknown,
    TDragData = unknown,
    TTargetDragData = unknown,
  >(
    element: HTMLElement,
    getParameters: () => InternalRegisterDropTargetParameters<
      TSourcePayload,
      TTargetPayload,
      TDragData,
      TTargetDragData
    >,
  ) => DragCleanupFn;
}

/**
 * The public parameters plus the channel through which a `Draggable.Preview` reaches
 * the engine. Consumers never write that field, which is why it is absent from
 * `RegisterDraggableParameters`.
 */
export type InternalDraggableParameters<
  TPayload = undefined,
  TDragData = unknown,
> = RegisterDraggableParameters<TPayload, TDragData> & {
  getDragPreviewDeclaration?:
    (() => DragPreviewDeclaration<NoInfer<TPayload>, NoInfer<TDragData>> | null) | undefined;
};

/**
 * The options of `Draggable.Viewport` and `registerAutoScroller`.
 */
export type RegisterAutoScrollerParameters<
  TSourcePayload = unknown,
  TDragData = unknown,
> = InternalRegisterAutoScrollerParameters<TSourcePayload, TDragData> &
  DragObserverAccept<TSourcePayload, TDragData>;

export type RegisterMonitorParameters<
  TSourcePayload = unknown,
  TDragData = unknown,
> = InternalRegisterMonitorParameters<TSourcePayload, TDragData> &
  DragObserverAccept<TSourcePayload, TDragData>;

/**
 * The page-wide drag manager returned by `useDragDropManager`.
 *
 * Each `register*` method takes a function returning the options, and returns a
 * cleanup function that unregisters.
 */
export interface DragDropManager {
  /**
   * Registers an element as a drag source, with the options of `Draggable.Root`.
   * Returns a cleanup function that unregisters it.
   */
  // Overloaded so `payload` both drives inference and stays required once the
  // caller declares a `TPayload` of their own, mirroring `Draggable.Root`.
  registerDraggable: {
    <TPayload, TDragData = unknown>(
      element: HTMLElement,
      getParameters: () => RegisterDraggableParametersWithPayload<TPayload, TDragData>,
    ): DragCleanupFn;
    <TKind extends DragKind<undefined, any> = DragKind<undefined>>(
      element: HTMLElement,
      getParameters: () => Omit<
        RegisterDraggableParameters<undefined, AcceptedDragData<TKind>>,
        'kind'
      > & { kind: TKind },
    ): DragCleanupFn;
  };
  /**
   * Registers an element as a drop target, with the options of `Draggable.Target`.
   * Returns a cleanup function that unregisters it.
   */
  // Infer target data from its kind while requiring the declared payload.
  registerDropTarget: <
    TAccept extends AnyDragAccept = DragKind<unknown>,
    TTargetPayload = undefined,
    TKind extends DragKind<NoInfer<TTargetPayload>, any> | undefined =
      DragKind<TTargetPayload> | undefined,
  >(
    element: HTMLElement,
    getParameters: () => DragParametersWithRequiredAccept<
      Omit<
        RegisterDropTargetParameters<
          AcceptedDragPayload<TAccept>,
          TTargetPayload,
          AcceptedDragData<TAccept>,
          AcceptedDragData<TKind>
        >,
        'kind'
      >,
      TAccept
    > &
      DragParametersWithTargetKind<TKind> &
      ([TTargetPayload] extends [undefined] ? {} : { payload: TTargetPayload }),
  ) => DragCleanupFn;
  /**
   * Registers a scroll container, with the options of `Draggable.Viewport`.
   * Pass `document.documentElement` to scroll the page.
   * Returns a cleanup function that unregisters it.
   */
  registerAutoScroller: <TAccept extends AnyDragAccept = DragKind<unknown>>(
    element: HTMLElement,
    getParameters: () => DragParametersWithInferredAccept<
      RegisterAutoScrollerParameters<AcceptedDragPayload<TAccept>, AcceptedDragData<TAccept>>,
      TAccept
    >,
  ) => DragCleanupFn;
  /**
   * Registers a monitor, with the options of `useDragMonitor`.
   * Returns a cleanup function that unregisters it.
   */
  registerMonitor: <TAccept extends AnyDragAccept = DragKind<unknown>>(
    getParameters: () => DragParametersWithInferredAccept<
      RegisterMonitorParameters<AcceptedDragPayload<TAccept>, AcceptedDragData<TAccept>>,
      TAccept
    >,
  ) => DragCleanupFn;
  /**
   * Cancels the drag in progress, if any. `onMoveEnd` fires with `canceled: true`
   * and the `'imperative-action'` reason.
   */
  cancelDrag: () => void;
}
