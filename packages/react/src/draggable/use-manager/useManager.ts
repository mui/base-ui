'use client';
import { useInnerDragEngine } from '../../utils/drag-and-drop/useInnerDragEngine';
import type {
  DraggableManager,
  RegisterMonitorParameters,
  RegisterSourceParameters,
  RegisterTargetParameters,
  RegisterViewportParameters,
} from '../../types/dragRegistration';

/**
 * Returns the page-wide drag manager. Use it to register drag sources, drop targets,
 * viewports, and monitors without rendering the Draggable parts, and to
 * cancel the drag in progress.
 *
 * The manager is stable for each hook instance. All instances share the page's drag
 * session. Requires a `<Draggable.Provider>` above the component calling this hook.
 *
 * Documentation: [Base UI useManager](https://base-ui.com/react/utils/draggable#usemanager)
 */
export function useManager(): UseDraggableManagerReturnValue {
  // The public signatures require payloads according to the caller's kind.
  // Internal registrations accept optional payloads for component forwarding.
  return useInnerDragEngine() as DraggableManager;
}

export namespace useManager {
  export type ReturnValue = UseDraggableManagerReturnValue;
  export type RegisterSourceParameters<
    TPayload = undefined,
    TDragData = unknown,
  > = DraggableManagerRegisterSourceParameters<TPayload, TDragData>;
  export type RegisterTargetParameters<
    TSourcePayload = unknown,
    TTargetPayload = unknown,
    TDragData = unknown,
    TTargetDragData = unknown,
  > = DraggableManagerRegisterTargetParameters<
    TSourcePayload,
    TTargetPayload,
    TDragData,
    TTargetDragData
  >;
  export type RegisterViewportParameters<
    TSourcePayload = unknown,
    TDragData = unknown,
  > = DraggableManagerRegisterViewportParameters<TSourcePayload, TDragData>;
  export type RegisterMonitorParameters<
    TSourcePayload = unknown,
    TDragData = unknown,
  > = DraggableManagerRegisterMonitorParameters<TSourcePayload, TDragData>;
}

/**
 * The page-wide drag manager returned by `Draggable.useManager`.
 */
export interface UseDraggableManagerReturnValue extends DraggableManager {}

/** The options of `registerSource`: the options of `Draggable.Root`, plus `handle` and `preview`. */
export type DraggableManagerRegisterSourceParameters<
  TPayload = undefined,
  TDragData = unknown,
> = RegisterSourceParameters<TPayload, TDragData>;

/** The options of `registerTarget`: the options of `Draggable.Target`. */
export type DraggableManagerRegisterTargetParameters<
  TSourcePayload = unknown,
  TTargetPayload = unknown,
  TDragData = unknown,
  TTargetDragData = unknown,
> = RegisterTargetParameters<TSourcePayload, TTargetPayload, TDragData, TTargetDragData>;

/** The options of `registerViewport`: the options of `Draggable.Viewport`. */
export type DraggableManagerRegisterViewportParameters<
  TSourcePayload = unknown,
  TDragData = unknown,
> = RegisterViewportParameters<TSourcePayload, TDragData>;

/** The options of `registerMonitor`: the options of `Draggable.useMonitor`. */
export type DraggableManagerRegisterMonitorParameters<
  TSourcePayload = unknown,
  TDragData = unknown,
> = RegisterMonitorParameters<TSourcePayload, TDragData>;
