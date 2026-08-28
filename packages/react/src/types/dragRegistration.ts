import type { DraggableConfig } from '../utils/drag-and-drop/draggable';
import type { DragPreviewDeclaration } from '../utils/drag-and-drop/dragPreviewDeclaration';
import type { RegisterDropTargetParameters as InternalRegisterDropTargetParameters } from '../utils/drag-and-drop/dropTarget';
import type { RegisterAutoScrollerParameters as InternalRegisterAutoScrollerParameters } from '../utils/drag-and-drop/autoScroller';
import type { RegisterMonitorParameters } from '../utils/drag-and-drop/monitor';
import type {
  AcceptedDragPayload,
  AnyDragAccept,
  DragCleanupFn,
  DragKind,
  DraggablePayload,
  DraggablePayloadGetter,
  DropTargetPayload,
  DropTargetPayloadGetter,
} from './drag';

/** Requires exactly one of a parameter type's `payload` and `getPayload` fields. */
export type WithRequiredPayload<
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
        payload?: never | undefined;
        getPayload: TPayloadGetter;
      }
  );

/** Allows at most one of a parameter type's `payload` and `getPayload` fields. */
export type WithOptionalPayload<TParameters extends { payload?: unknown; getPayload?: unknown }> =
  Omit<TParameters, 'payload' | 'getPayload'> &
    (
      | {
          /** Static payload data. Function values are preserved without being invoked. */
          payload?: TParameters['payload'] | undefined;
          /** Resolves payload data from the current drag context. */
          getPayload?: never | undefined;
        }
      | {
          payload?: never | undefined;
          getPayload?: TParameters['getPayload'] | undefined;
        }
    );

/** Parameters accepted by `Draggable.Root` and `registerDraggable`, except the element. */
// `onGenerateDragPreview` is omitted because the engine overwrites it to publish the
// preview it built, `previewContainerDefault` because the React layer wires it from the
// nearest `Draggable.PreviewProvider`.
export type RegisterDraggableParameters<TData = undefined> = Omit<
  DraggableConfig<TData>,
  | 'element'
  | 'onGenerateDragPreview'
  | 'getDragPreviewDeclaration'
  | 'previewContainerDefault'
  | 'styleNonce'
  | 'disableStyleElements'
>;

/**
 * `RegisterDraggableParameters` for the overload that infers `TData` from a required `payload`.
 * @public
 */
export type RegisterDraggableParametersWithPayload<TData> = WithRequiredPayload<
  RegisterDraggableParameters<TData>,
  DraggablePayload<TData>,
  DraggablePayloadGetter<TData>
>;

/** Public drop-target parameters, whose `accept` declaration is required. */
export type RegisterDropTargetParameters<TSourceData = unknown, TLocalData = unknown> = Omit<
  InternalRegisterDropTargetParameters<TSourceData, TLocalData>,
  'accept'
> & {
  accept: NonNullable<InternalRegisterDropTargetParameters<TSourceData, TLocalData>['accept']>;
};

/**
 * Drop target registration parameters whose local payload is required.
 * @public
 */
export type RegisterDropTargetParametersWithPayload<TSourceData, TLocalData> = WithRequiredPayload<
  RegisterDropTargetParameters<TSourceData, NoInfer<TLocalData>>,
  DropTargetPayload<TSourceData, TLocalData>,
  DropTargetPayloadGetter<TSourceData, TLocalData>
>;

/**
 * Preserves the accepted kinds while inferring callback payload types.
 * @public
 */
export type WithInferredAccept<TParameters, TAccept extends AnyDragAccept> = TParameters & {
  accept?: TAccept | undefined;
};

/**
 * Preserves the accepted kinds while requiring `accept`.
 * @public
 */
export type WithRequiredAccept<TParameters, TAccept extends AnyDragAccept> = TParameters & {
  accept: TAccept;
};

/**
 * {@link DragDropManager} with a single, payload-optional `registerDraggable` signature.
 * `Draggable.Root` enforces the payload requirement at its own boundary and then
 * forwards a uniform parameters object, so the overloads would only get in the way.
 * @internal
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
 * @internal
 */
export type InternalDraggableParameters<TData = undefined> = RegisterDraggableParameters<TData> & {
  getDragPreviewDeclaration?: (() => DragPreviewDeclaration<NoInfer<TData>> | null) | undefined;
};

/**
 * React's native HTML drag-and-drop props omitted from `Draggable.Root` and
 * `DropTarget.Root`. Base UI uses some of these names, such as `onDragStart` and
 * `onDrop`, for its own handlers. Including both sets would create unusable unions
 * of unrelated handler types.
 *
 * The native events are still reachable through `render`, whose element props are
 * merged over the component's own:
 *
 * ```jsx
 * <DropTarget.Root
 *   accept={card}
 *   onDrop={handleEngineDrop}
 *   render={<div onDrop={handleFileDrop} onDragOver={allowFileDrop} />}
 * />
 * ```
 */
export type NativeDragEventProps =
  | 'onDrag'
  | 'onDragCapture'
  | 'onDragEnd'
  | 'onDragEndCapture'
  | 'onDragEnter'
  | 'onDragEnterCapture'
  | 'onDragExit'
  | 'onDragExitCapture'
  | 'onDragLeave'
  | 'onDragLeaveCapture'
  | 'onDragOver'
  | 'onDragOverCapture'
  | 'onDragStart'
  | 'onDragStartCapture'
  | 'onDrop'
  | 'onDropCapture';

/**
 * Parameters accepted by `DragAutoScroll.Root` and `registerAutoScroller`.
 * Scroll containers, including the page, scroll automatically during a drag.
 * Use these parameters to disable scrolling, limit the axes, change the speed,
 * or implement custom scrolling with `applyScroll`.
 */
export type RegisterAutoScrollerParameters<TSourceData = unknown> =
  InternalRegisterAutoScrollerParameters<TSourceData>;

export type { RegisterMonitorParameters };

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
      getParameters: () => WithOptionalPayload<RegisterDraggableParameters<undefined>>,
    ): DragCleanupFn;
  };
  /**
   * Registers a drop target, a place a matching drag can be released, and returns a
   * cleanup that unregisters it.
   */
  // Overloaded so `payload` both drives inference and stays required once the
  // caller declares a `TLocalData` of their own, mirroring `DropTarget.Root`.
  registerDropTarget: {
    // Local data is `undefined` at the fallback, not `unknown`: `kind` is typed
    // from it, so a payload-carrying kind can't register without payload data.
    <TAccept extends AnyDragAccept = DragKind<unknown>>(
      element: HTMLElement,
      getParameters: () => WithRequiredAccept<
        Omit<
          InternalRegisterDropTargetParameters<AcceptedDragPayload<TAccept>, undefined>,
          'payload' | 'getPayload'
        >,
        TAccept
      > & { payload?: never | undefined; getPayload?: never | undefined },
    ): DragCleanupFn;
    <TAccept extends AnyDragAccept, TLocalData>(
      element: HTMLElement,
      getParameters: () => WithRequiredAccept<
        RegisterDropTargetParametersWithPayload<AcceptedDragPayload<TAccept>, TLocalData>,
        TAccept
      >,
    ): DragCleanupFn;
  };
  /**
   * Registers auto-scroll parameters for an element, and returns a cleanup that
   * unregisters them.
   *
   * Scroll containers work without registration. Register one to change its
   * behavior. `disabled` excludes the element, and `overflow: hidden` or
   * `overflow: clip` prevents the page from scrolling. For a canvas moved by a
   * CSS `transform`, use `applyScroll` to apply the scroll delta yourself.
   */
  registerAutoScroller: <TAccept extends AnyDragAccept = DragKind<unknown>>(
    element: HTMLElement,
    getParameters: () => WithInferredAccept<
      RegisterAutoScrollerParameters<AcceptedDragPayload<TAccept>>,
      TAccept
    >,
  ) => DragCleanupFn;
  /**
   * Registers a monitor that observes every matching drag, and returns a cleanup
   * that unregisters it.
   */
  registerMonitor: <TAccept extends AnyDragAccept = DragKind<unknown>>(
    getParameters: () => WithInferredAccept<
      RegisterMonitorParameters<AcceptedDragPayload<TAccept>>,
      TAccept
    >,
  ) => DragCleanupFn;
  /**
   * Cancels the drag in progress, if any.
   * Fires `onDragEnd` with `canceled: true`.
   */
  cancelDrag: () => void;
}
