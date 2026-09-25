import type { DraggableConfig } from '../utils/drag-and-drop/draggable';
import type { DragPreviewDeclaration } from '../utils/drag-and-drop/dragPreviewDeclaration';
import type { RegisterTargetParameters as InternalRegisterTargetParameters } from '../utils/drag-and-drop/dropTarget';
import type { RegisterViewportParameters as InternalRegisterViewportParameters } from '../utils/drag-and-drop/autoScroller';
import type { RegisterMonitorParameters as InternalRegisterMonitorParameters } from '../utils/drag-and-drop/monitor';
import type {
  AcceptedDragPayload,
  AcceptedDragData,
  DragCleanupFn,
  DragKind,
  DragAccept,
  DraggablePayload,
} from './drag';

/** Parameters accepted by `Draggable.Root` and `registerSource`, except the element. */
// `onGenerateDragPreview` is omitted because the engine overwrites it to publish the
// preview it built.
export type RegisterSourceParameters<TPayload = undefined, TDragData = unknown> = Omit<
  DraggableConfig<TPayload, TDragData>,
  | 'element'
  | 'onGenerateDragPreview'
  | 'getDragPreviewDeclaration'
  | 'styleNonce'
  | 'disableStyleElements'
>;

/** Public drop-target parameters, whose `accept` declaration is required. */
export type RegisterTargetParameters<
  TSourcePayload = unknown,
  TTargetPayload = unknown,
  TDragData = unknown,
  TTargetDragData = unknown,
> = Omit<
  InternalRegisterTargetParameters<TSourcePayload, TTargetPayload, TDragData, TTargetDragData>,
  'accept'
> & {
  /**
   * One or more kinds of draggable this target accepts. Pass `Draggable.anyKind`
   * to accept every drag, with `source.payload` typed as `unknown`.
   *
   * Drags of other kinds ignore this target, but an ancestor target can still accept them.
   */
  accept: NonNullable<
    InternalRegisterTargetParameters<
      TSourcePayload,
      TTargetPayload,
      TDragData,
      TTargetDragData
    >['accept']
  >;
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
  TAccept extends DragAccept<unknown>,
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
  TAccept extends DragAccept<unknown>,
> = TParameters & {
  /** One or more drag source kinds accepted by this target. */
  accept: TAccept;
};

/**
 * {@link DraggableManager} with a single, payload-optional `registerSource` signature.
 * `Draggable.Root` enforces the payload requirement at its own boundary and then
 * forwards a uniform parameters object, so the overloads would only get in the way.
 */
export interface InternalDragEngine extends Omit<
  DraggableManager,
  'registerSource' | 'registerTarget'
> {
  registerSource: <TPayload = undefined, TDragData = unknown>(
    element: HTMLElement,
    getParameters: () => RegisterSourceParameters<TPayload, TDragData>,
    payloadOwner?: object,
  ) => DragCleanupFn;
  registerTarget: <
    TSourcePayload = unknown,
    TTargetPayload = unknown,
    TDragData = unknown,
    TTargetDragData = unknown,
  >(
    element: HTMLElement,
    getParameters: () => InternalRegisterTargetParameters<
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
 * `RegisterSourceParameters`.
 */
export type InternalDraggableParameters<
  TPayload = undefined,
  TDragData = unknown,
> = RegisterSourceParameters<TPayload, TDragData> & {
  getDragPreviewDeclaration?:
    (() => DragPreviewDeclaration<NoInfer<TPayload>, NoInfer<TDragData>> | null) | undefined;
};

/**
 * The options of `Draggable.Viewport` and `registerViewport`.
 */
export type RegisterViewportParameters<
  TSourcePayload = unknown,
  TDragData = unknown,
> = InternalRegisterViewportParameters<TSourcePayload, TDragData> &
  DragObserverAccept<TSourcePayload, TDragData>;

export type RegisterMonitorParameters<
  TSourcePayload = unknown,
  TDragData = unknown,
> = InternalRegisterMonitorParameters<TSourcePayload, TDragData> &
  DragObserverAccept<TSourcePayload, TDragData>;

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
  // caller declares a `TPayload` of their own, mirroring `Draggable.Root`.
  registerSource: {
    <TPayload, TDragData = unknown>(
      element: HTMLElement,
      getParameters: () => RegisterSourceParameters<TPayload, TDragData> & {
        payload: DraggablePayload<TPayload>;
      },
    ): DragCleanupFn;
    <TKind extends DragKind<undefined, any> = DragKind<undefined>>(
      element: HTMLElement,
      getParameters: () => Omit<
        RegisterSourceParameters<undefined, AcceptedDragData<TKind>>,
        'kind'
      > & { kind: TKind },
    ): DragCleanupFn;
  };
  /**
   * Registers an element as a drop target, with the options of `Draggable.Target`.
   * Returns a cleanup function that unregisters it.
   */
  // Infer target data from its kind while requiring the declared payload.
  registerTarget: <
    TAccept extends DragAccept<unknown> = DragKind<unknown>,
    TTargetPayload = undefined,
    TKind extends DragKind<NoInfer<TTargetPayload>, any> | undefined =
      DragKind<TTargetPayload> | undefined,
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
    > &
      DragParametersWithTargetKind<TKind> &
      ([TTargetPayload] extends [undefined] ? {} : { payload: TTargetPayload }),
  ) => DragCleanupFn;
  /**
   * Registers a scroll container, with the options of `Draggable.Viewport`.
   * Pass `document.documentElement` to scroll the page.
   * Returns a cleanup function that unregisters it.
   */
  registerViewport: <TAccept extends DragAccept<unknown> = DragKind<unknown>>(
    element: HTMLElement,
    getParameters: () => DragParametersWithInferredAccept<
      RegisterViewportParameters<AcceptedDragPayload<TAccept>, AcceptedDragData<TAccept>>,
      TAccept
    >,
  ) => DragCleanupFn;
  /**
   * Registers a monitor, with the options of `useMonitor`.
   * Returns a cleanup function that unregisters it.
   */
  registerMonitor: <TAccept extends DragAccept<unknown> = DragKind<unknown>>(
    getParameters: () => DragParametersWithInferredAccept<
      RegisterMonitorParameters<AcceptedDragPayload<TAccept>, AcceptedDragData<TAccept>>,
      TAccept
    >,
  ) => DragCleanupFn;
  /**
   * Cancels the drag in progress, if any. `onMoveEnd` fires with a `null` target
   * and the `'imperative-action'` reason.
   */
  cancelDrag: () => void;
}
