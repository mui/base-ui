'use client';
import { useInnerDragEngine } from '../../utils/drag-and-drop/useInnerDragEngine';
import type { DragDropManager } from '../../types/dragRegistration';

/**
 * Returns the page-wide drag manager. Use it to register drag sources, drop targets,
 * scroll containers, and monitors without rendering the Draggable parts, and to
 * cancel the drag in progress.
 *
 * The manager is stable for each hook instance. All instances share the page's drag
 * session. Requires a `<Draggable.Provider>` above the component calling this hook.
 *
 * Documentation: [Base UI useManager](https://base-ui.com/react/utils/draggable#usemanager)
 *
 * @public
 */
export function useDragDropManager(): UseDragDropManagerReturnValue {
  // The public signatures require payloads according to the caller's kind.
  // Internal registrations accept optional payloads for component forwarding.
  return useInnerDragEngine() as DragDropManager;
}

export namespace useDragDropManager {
  export type ReturnValue = UseDragDropManagerReturnValue;
}

/**
 * The page-wide drag manager returned by `Draggable.useManager`.
 */
export interface UseDragDropManagerReturnValue extends DragDropManager {}

// The `WithPayload` variants, the `accept` wrappers and `DragKind` come along
// because the signatures above reference them: without them the generated
// reference renders those names with no definition on the page.
export type {
  DragDropManager,
  RegisterDraggableParameters,
  RegisterDraggableParametersWithPayload,
  RegisterDropTargetParameters,
  RegisterDropTargetParametersWithPayload,
  RegisterAutoScrollerParameters,
  RegisterMonitorParameters,
  DragParametersWithInferredAccept,
  DragParametersWithRequiredAccept,
  DragParametersWithTargetKind,
  DragObserverAccept,
} from '../../types/dragRegistration';
export type {
  AcceptedDragData,
  AcceptedDragPayload,
  AnyDragAccept,
  DragKind,
} from '../../types/drag';
// The return type of every `register*` method, re-exported so typing a held
// cleanup doesn't need a second import from `@base-ui/react/types`.
export type { DragCleanupFn } from '../../types/drag';
