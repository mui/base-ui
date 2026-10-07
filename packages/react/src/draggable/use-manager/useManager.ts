'use client';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useRegisterSource } from '../../utils/drag-and-drop/useRegisterSource';
import { registerMonitor, registerTarget } from '../../utils/drag-and-drop/registrations';
import { registerViewport, wakeAutoScroll } from '../../utils/drag-and-drop/autoScroller';
import { getActiveSession } from '../../utils/drag-and-drop/core/dragSession';
import { refreshDragSource } from '../../utils/drag-and-drop/dragSource';
import { cancelDrag } from '../../utils/drag-and-drop/synthetic/syntheticSensor';
import type {
  DraggableManager,
  InternalDragEngine,
  RegisterMonitorParameters,
  RegisterSourceParameters,
  RegisterTargetParameters,
  RegisterViewportParameters,
} from '../../utils/drag-and-drop/registrationTypes';

/**
 * Applies the latest options of every registration on `element`. The target and
 * viewport steps are the ones `Draggable.Target` and `Draggable.Viewport` take when
 * their props change. Both are harmless for an element registered as neither: the
 * target refresh runs only when the element is under the pointer, and a woken
 * scroll loop parks again.
 */
function refresh(element: HTMLElement): void {
  refreshDragSource(element);
  getActiveSession()?.scheduleTargetRefresh(element);
  wakeAutoScroll();
}

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
  // Preview content renders through the `Draggable.Provider` nearest this hook call.
  // Registrations and sensors are global, so the stateless registrations are
  // re-exposed as methods (see `registrations.ts` and `autoScroller.ts`).
  const registerSource = useRegisterSource();
  const engine = useRefWithInit((): InternalDragEngine => ({
    registerSource,
    registerTarget,
    registerViewport,
    registerMonitor,
    cancelDrag,
    refresh,
  })).current;
  // The public signatures require a payload when the caller's kind declares one.
  // Internal registrations keep it optional so components can forward theirs.
  return engine as DraggableManager;
}

export namespace useManager {
  export type ReturnValue = UseDraggableManagerReturnValue;
  export type RegisterSourceParameters<
    TPayload = undefined,
    TDragData = unknown,
  > = DraggableManagerRegisterSourceParameters<TPayload, TDragData>;
  export type RegisterTargetParameters<
    TSourcePayload = unknown,
    TTargetPayload = undefined,
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

/**
 * The options of `registerSource`, which are those of `Draggable.Root` plus `handle` and `preview`.
 * `payload` is required when `TPayload` is declared.
 */
export type DraggableManagerRegisterSourceParameters<
  TPayload = undefined,
  TDragData = unknown,
> = Omit<RegisterSourceParameters<TPayload, TDragData>, 'payload'> &
  ([TPayload] extends [undefined] ? { payload?: undefined } : { payload: TPayload });

/**
 * The options of `registerTarget`, which are those of `Draggable.Target`.
 * `payload` is required when `TTargetPayload` is declared.
 */
export type DraggableManagerRegisterTargetParameters<
  TSourcePayload = unknown,
  TTargetPayload = undefined,
  TDragData = unknown,
  TTargetDragData = unknown,
> = Omit<
  RegisterTargetParameters<TSourcePayload, TTargetPayload, TDragData, TTargetDragData>,
  'payload'
> &
  ([TTargetPayload] extends [undefined] ? { payload?: undefined } : { payload: TTargetPayload });

/** The options of `registerViewport`, which are those of `Draggable.Viewport`. */
export type DraggableManagerRegisterViewportParameters<
  TSourcePayload = unknown,
  TDragData = unknown,
> = RegisterViewportParameters<TSourcePayload, TDragData>;

/** The options of `registerMonitor`, which are those of `Draggable.useMonitor`. */
export type DraggableManagerRegisterMonitorParameters<
  TSourcePayload = unknown,
  TDragData = unknown,
> = RegisterMonitorParameters<TSourcePayload, TDragData>;
