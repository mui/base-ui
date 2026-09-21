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
        /** Static payload. Function values are preserved without being invoked. */
        payload: TPayload;
        /** Resolves the payload from the current drag context. */
        getPayload?: never | undefined;
      }
    | {
        /** Static payload. Function values are preserved without being invoked. */
        payload?: never | undefined;
        /** Resolves the payload from the current drag context. */
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
        /** Static payload. Function values are preserved without being invoked. */
        payload?: TParameters['payload'] | undefined;
        /** Resolves the payload from the current drag context. */
        getPayload?: never | undefined;
      }
    | {
        /** Static payload. Function values are preserved without being invoked. */
        payload?: never | undefined;
        /** Resolves the payload from the current drag context. */
        getPayload?: TParameters['getPayload'] | undefined;
      }
  );

/** Parameters accepted by `Draggable.Root` and `registerDraggable`, except the element. */
// `onGenerateDragPreview` is omitted because the engine overwrites it to publish the
// preview it built.
export type RegisterDraggableParameters<TPayload = undefined> = Omit<
  DraggableConfig<TPayload>,
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
export type RegisterDraggableParametersWithPayload<TPayload> = DragParametersWithRequiredPayload<
  RegisterDraggableParameters<TPayload>,
  DraggablePayload<TPayload>,
  DraggablePayloadGetter<TPayload>
>;

/** Public drop-target parameters, whose `accept` declaration is required. */
export type RegisterDropTargetParameters<TSourcePayload = unknown, TTargetPayload = unknown> = Omit<
  InternalRegisterDropTargetParameters<TSourcePayload, TTargetPayload>,
  'accept'
> & {
  /**
   * One or more drag source kinds accepted by this target.
   *
   * Required here: `registerDropTarget` joins the page-wide manager directly, with
   * no provider kind to default to, and `Draggable.Target` props with typed
   * payloads need it to determine `source.payload`. Pass `Draggable.anyKind` to
   * accept every drag. In that case, `source.payload` is `unknown`.
   *
   * The target ignores a source whose kind is not accepted. An ancestor target can
   * still accept it. Base UI checks `accept` before `canDrop`.
   */
  accept: NonNullable<
    InternalRegisterDropTargetParameters<TSourcePayload, TTargetPayload>['accept']
  >;
};

/**
 * Drop target registration parameters whose local payload is required.
 * @public
 */
export type RegisterDropTargetParametersWithPayload<TSourcePayload, TTargetPayload> =
  DragParametersWithRequiredPayload<
    RegisterDropTargetParameters<TSourcePayload, NoInfer<TTargetPayload>>,
    DropTargetPayload<TTargetPayload>,
    DropTargetPayloadGetter<TSourcePayload, TTargetPayload>
  >;

/** Checks a target's payload against the payload promised by its own kind. */
export type DragParametersWithTargetKind<
  TSourcePayload,
  TKind extends DragKind<any> | undefined,
> = {
  kind?: TKind | undefined;
  payload?: NoInfer<AcceptedDragPayload<TKind>> | undefined;
  getPayload?:
    DropTargetPayloadGetter<TSourcePayload, NoInfer<AcceptedDragPayload<TKind>>> | undefined;
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
export type DragObserverAccept<TSourcePayload> = unknown extends TSourcePayload
  ? { accept?: DragAccept<TSourcePayload> | undefined }
  : { accept: DragAccept<TSourcePayload> };

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
  registerDraggable: <TPayload = undefined>(
    element: HTMLElement,
    getParameters: () => RegisterDraggableParameters<TPayload>,
    /** Whether parameter identity is an immutable revision key. React-backed registrations opt in. */
    cacheParameters?: boolean,
  ) => DragCleanupFn;
  registerDropTarget: <TSourcePayload = unknown, TTargetPayload = unknown>(
    element: HTMLElement,
    getParameters: () => InternalRegisterDropTargetParameters<TSourcePayload, TTargetPayload>,
  ) => DragCleanupFn;
}

/**
 * The public parameters plus the channel through which a `Draggable.Preview` reaches
 * the engine. Consumers never write that field, which is why it is absent from
 * `RegisterDraggableParameters`.
 */
export type InternalDraggableParameters<TPayload = undefined> =
  RegisterDraggableParameters<TPayload> & {
    getDragPreviewDeclaration?:
      (() => DragPreviewDeclaration<NoInfer<TPayload>> | null) | undefined;
  };

/**
 * Parameters accepted by `Draggable.Viewport` and `registerAutoScroller`.
 * Registered scroll containers, including the page, scroll during a drag.
 * Use these parameters to disable scrolling, limit the axes, change the speed,
 * or implement custom scrolling with `onDragScroll`.
 */
export type RegisterAutoScrollerParameters<TSourcePayload = unknown> =
  InternalRegisterAutoScrollerParameters<TSourcePayload> & DragObserverAccept<TSourcePayload>;

export type RegisterMonitorParameters<TSourcePayload = unknown> =
  InternalRegisterMonitorParameters<TSourcePayload> & DragObserverAccept<TSourcePayload>;

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
  // caller declares a `TPayload` of their own, mirroring `Draggable.Root`.
  registerDraggable: {
    <TPayload>(
      element: HTMLElement,
      getParameters: () => Omit<RegisterDraggableParameters<TPayload>, 'payload' | 'getPayload'> & {
        payload?: never | undefined;
        getPayload: DraggablePayloadGetter<TPayload>;
      },
    ): DragCleanupFn;
    <TPayload>(
      element: HTMLElement,
      getParameters: () => RegisterDraggableParametersWithPayload<TPayload>,
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
  // caller declares a `TTargetPayload` of their own, mirroring `Draggable.Target`.
  registerDropTarget: {
    // Target payload is `undefined` at the fallback, not `unknown`: `kind` is typed
    // from it, so a payload-carrying kind can't register without a payload.
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
      TTargetPayload,
      TKind extends DragKind<any> | undefined = DragKind<TTargetPayload> | undefined,
    >(
      element: HTMLElement,
      getParameters: () => DragParametersWithRequiredAccept<
        RegisterDropTargetParametersWithPayload<AcceptedDragPayload<TAccept>, TTargetPayload>,
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
