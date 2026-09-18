'use client';
import { useInnerDragEngine } from '../../utils/drag-and-drop/useInnerDragEngine';
import type { DragDropManager } from '../../types/dragRegistration';

/**
 * Returns the page-wide drag-and-drop manager. Registers drag sources, drop targets,
 * scroll containers, and monitors. Use `cancelDrag` to end the drag in progress.
 *
 * Use it to register an existing element, integrate a non-React widget, or keep
 * registrations in one place.
 *
 * Every call controls the same page-wide manager. Requires a `Draggable.Provider`
 * above the component calling this hook. Custom previews receive React context
 * from above that provider.
 *
 * Documentation: [Base UI useDragDropManager](https://base-ui.com/react/utils/draggable#usedragdropmanager)
 *
 * @public
 */
export function useDragDropManager(): UseDragDropManagerReturnValue {
  return useInnerDragEngine();
}

export namespace useDragDropManager {
  export type ReturnValue = UseDragDropManagerReturnValue;
}

/**
 * The page-wide imperative API returned by {@link useDragDropManager}.
 * `registerDraggable`, `registerDropTarget`, `registerAutoScroller`,
 * `registerMonitor` and `cancelDrag`.
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
  DragParametersWithOptionalPayload,
  DragParametersWithRequiredPayload,
  DragParametersWithInferredAccept,
  DragParametersWithRequiredAccept,
  DragParametersWithTargetKind,
  DragObserverAccept,
} from '../../types/dragRegistration';
export type { AcceptedDragPayload, AnyDragAccept, DragKind } from '../../types/drag';
// The return type of every `register*` method, re-exported so typing a held
// cleanup doesn't need a second import from `@base-ui/react/types`.
export type { DragCleanupFn } from '../../types/drag';
