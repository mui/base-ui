import type { DraggableConfig } from '../utils/drag-and-drop/draggable';
import type { DragPreviewDeclaration } from '../utils/drag-and-drop/dragPreviewDeclaration';
import type { RegisterDropTargetParameters as InternalRegisterDropTargetParameters } from '../utils/drag-and-drop/dropTarget';
import type { RegisterAutoScrollerParameters as InternalRegisterAutoScrollerParameters } from '../utils/drag-and-drop/autoScroller';
import type { RegisterMonitorParameters as InternalRegisterMonitorParameters } from '../utils/drag-and-drop/monitor';
import type {
  AcceptedDragPayload,
  AnyDragAccept,
  DragCleanupFn,
  DragKind,
  DragAccept,
  DraggablePayload,
  DraggablePayloadGetter,
  DropTargetPayload,
  DropTargetPayloadGetter,
} from './drag';

/**
 * Requires exactly one of a parameter type's `payload` and `getPayload` fields.
 */
export type DragParametersWithRequiredPayload<
  TParameters extends { payload?: unknown; getPayload?: unknown },
  TPayload = Exclude<TParameters['payload'], undefined>,
  TPayloadGetter = Exclude<TParameters['getPayload'], undefined>,
> = Omit<TParameters, 'payload' | 'getPayload'> &
  (
    | {
        /** Static payload data. Function values are preserved without being invoked. */
        payload: TPayload;
        /** Resolves payload data from the current drag context. */
        getPayload?: never | undefined;
      }
    | {
        /** Static payload data. Function values are preserved without being invoked. */
        payload?: never | undefined;
        /** Resolves payload data from the current drag context. */
        getPayload: TPayloadGetter;
      }
  );

/**
 * Allows at most one of a parameter type's `payload` and `getPayload` fields.
 */
export type DragParametersWithOptionalPayload<
  TParameters extends { payload?: unknown; getPayload?: unknown },
> = Omit<TParameters, 'payload' | 'getPayload'> &
  (
    | {
        /** Static payload data. Function values are preserved without being invoked. */
        payload?: TParameters['payload'] | undefined;
        /** Resolves payload data from the current drag context. */
        getPayload?: never | undefined;
      }
    | {
        /** Static payload data. Function values are preserved without being invoked. */
        payload?: never | undefined;
        /** Resolves payload data from the current drag context. */
        getPayload?: TParameters['getPayload'] | undefined;
      }
  );

/** Parameters accepted by `Draggable.Root` and `registerDraggable`, except the element. */
// `onGenerateDragPreview` is omitted because the engine overwrites it to publish the
// preview it built.
export type RegisterDraggableParameters<TData = undefined> = Omit<
  DraggableConfig<TData>,
  | 'element'
  | 'onGenerateDragPreview'
  | 'getDragPreviewDeclaration'
  | 'styleNonce'
  | 'disableStyleElements'
>;

/**
 * `RegisterDraggableParameters` for the overload that infers `TData` from a required `payload`.
 * @public
 */
export type RegisterDraggableParametersWithPayload<TData> = DragParametersWithRequiredPayload<
  RegisterDraggableParameters<TData>,
  DraggablePayload<TData>,
  DraggablePayloadGetter<TData>
>;

/** Public drop-target parameters, whose `accept` declaration is required. */
export type RegisterDropTargetParameters<TSourceData = unknown, TLocalData = unknown> = Omit<
  InternalRegisterDropTargetParameters<TSourceData, TLocalData>,
  'accept'
> & {
  /**
   * One or more drag source kinds accepted by this target.
   *
   * Every registration uses the same page-wide drag manager, so this value is
   * required here. Pass `Draggable.anyKind` to accept every drag. In that case,
   * `source.payload` is `unknown`.
   *
   * The target ignores a source whose kind is not accepted. An ancestor target can
   * still accept it. Base UI checks `accept` before `canDrop`.
   */
  accept: NonNullable<InternalRegisterDropTargetParameters<TSourceData, TLocalData>['accept']>;
};

/**
 * Drop target registration parameters whose local payload is required.
 * @public
 */
export type RegisterDropTargetParametersWithPayload<TSourceData, TLocalData> =
  DragParametersWithRequiredPayload<
    RegisterDropTargetParameters<TSourceData, NoInfer<TLocalData>>,
    DropTargetPayload<TLocalData>,
    DropTargetPayloadGetter<TSourceData, TLocalData>
  >;

/** Checks a target's data against the payload promised by its own kind. */
export type DragParametersWithTargetKind<
  TSourceData,
  TKind extends DragKind<unknown> | undefined,
> = {
  kind?: TKind | undefined;
  payload?: NoInfer<AcceptedDragPayload<TKind>> | undefined;
  getPayload?:
    DropTargetPayloadGetter<TSourceData, NoInfer<AcceptedDragPayload<TKind>>> | undefined;
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
export type DragObserverAccept<TSourceData> = unknown extends TSourceData
  ? { accept?: DragAccept<TSourceData> | undefined }
  : { accept: DragAccept<TSourceData> };

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
  registerDraggable: <TData = undefined>(
    element: HTMLElement,
    getParameters: () => RegisterDraggableParameters<TData>,
    /** Whether parameter identity is an immutable revision key. React-backed registrations opt in. */
    cacheParameters?: boolean,
  ) => DragCleanupFn;
  registerDropTarget: <TSourceData = unknown, TLocalData = unknown>(
    element: HTMLElement,
    getParameters: () => InternalRegisterDropTargetParameters<TSourceData, TLocalData>,
  ) => DragCleanupFn;
}

/**
 * The public parameters plus the channel through which a `Draggable.Preview` reaches
 * the engine. Consumers never write that field, which is why it is absent from
 * `RegisterDraggableParameters`.
 */
export type InternalDraggableParameters<TData = undefined> = RegisterDraggableParameters<TData> & {
  getDragPreviewDeclaration?: (() => DragPreviewDeclaration<NoInfer<TData>> | null) | undefined;
};

/**
 * Parameters accepted by `Draggable.Viewport` and `registerAutoScroller`.
 * Registered scroll containers, including the page, scroll during a drag.
 * Use these parameters to disable scrolling, limit the axes, change the speed,
 * or implement custom scrolling with `onDragScroll`.
 */
export type RegisterAutoScrollerParameters<TSourceData = unknown> =
  InternalRegisterAutoScrollerParameters<TSourceData> & DragObserverAccept<TSourceData>;

export type RegisterMonitorParameters<TSourceData = unknown> =
  InternalRegisterMonitorParameters<TSourceData> & DragObserverAccept<TSourceData>;

/**
 * The page-wide drag-and-drop manager returned by `useDragDropManager`.
 *
 * Each `register*` method takes a parameter getter and returns a cleanup that
 * unregisters. Callbacks and dynamic options are read when used; source identity,
 * preview settings, monitor eligibility, and idle gesture styles have the timing
 * documented by their registration methods.
 */
export interface DragDropManager {
  /**
   * Registers a drag source and returns a cleanup that unregisters it.
   *
   * Base UI reads behavior from the getter on every event. It applies gesture
   * styles when the element registers, then reads them again on the next pointer
   * press. Re-register the element to update the idle styles immediately.
   */
  // Overloaded so `payload` both drives inference and stays required once the
  // caller declares a `TData` of their own, mirroring `Draggable.Root`.
  registerDraggable: {
    <TData>(
      element: HTMLElement,
      getParameters: () => Omit<RegisterDraggableParameters<TData>, 'payload' | 'getPayload'> & {
        payload?: never | undefined;
        getPayload: DraggablePayloadGetter<TData>;
      },
    ): DragCleanupFn;
    <TData>(
      element: HTMLElement,
      getParameters: () => RegisterDraggableParametersWithPayload<TData>,
    ): DragCleanupFn;
    (
      element: HTMLElement,
      getParameters: () => DragParametersWithOptionalPayload<
        RegisterDraggableParameters<undefined>
      >,
    ): DragCleanupFn;
  };
  /**
   * Registers a drop target, a place a matching drag can be released, and returns a
   * cleanup that unregisters it.
   */
  // Overloaded so `payload` both drives inference and stays required once the
  // caller declares a `TLocalData` of their own, mirroring `Draggable.Target`.
  registerDropTarget: {
    // Local data is `undefined` at the fallback, not `unknown`: `kind` is typed
    // from it, so a payload-carrying kind can't register without payload data.
    <TAccept extends AnyDragAccept = DragKind<unknown>>(
      element: HTMLElement,
      getParameters: () => DragParametersWithRequiredAccept<
        Omit<
          InternalRegisterDropTargetParameters<AcceptedDragPayload<TAccept>, undefined>,
          'payload' | 'getPayload'
        >,
        TAccept
      > & { payload?: never | undefined; getPayload?: never | undefined },
    ): DragCleanupFn;
    <
      TAccept extends AnyDragAccept,
      TLocalData,
      TKind extends DragKind<unknown> | undefined = DragKind<TLocalData> | undefined,
    >(
      element: HTMLElement,
      getParameters: () => DragParametersWithRequiredAccept<
        RegisterDropTargetParametersWithPayload<AcceptedDragPayload<TAccept>, TLocalData>,
        TAccept
      > &
        DragParametersWithTargetKind<AcceptedDragPayload<TAccept>, TKind>,
    ): DragCleanupFn;
  };
  /**
   * Registers auto-scroll parameters for an element, and returns a cleanup that
   * unregisters them.
   *
   * Each scroll container, including the page, needs its own registration. `disabled` excludes the element, and `overflow: hidden` or
   * `overflow: clip` prevents the page from scrolling. For a canvas moved by a
   * CSS `transform`, use `onDragScroll` to apply the scroll delta yourself.
   */
  registerAutoScroller: <TAccept extends AnyDragAccept = DragKind<unknown>>(
    element: HTMLElement,
    getParameters: () => DragParametersWithInferredAccept<
      RegisterAutoScrollerParameters<AcceptedDragPayload<TAccept>>,
      TAccept
    >,
  ) => DragCleanupFn;
  /**
   * Registers a monitor that observes every matching drag, and returns a cleanup
   * that unregisters it.
   */
  registerMonitor: <TAccept extends AnyDragAccept = DragKind<unknown>>(
    getParameters: () => DragParametersWithInferredAccept<
      RegisterMonitorParameters<AcceptedDragPayload<TAccept>>,
      TAccept
    >,
  ) => DragCleanupFn;
  /**
   * Cancels the drag in progress, if any.
   * Fires `onMoveEnd` with `canceled: true`.
   */
  cancelDrag: () => void;
}
