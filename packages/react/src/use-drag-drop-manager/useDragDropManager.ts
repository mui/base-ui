'use client';
import { useInnerDragEngine } from '../utils/drag-and-drop/useInnerDragEngine';
import type { DragDropManager } from '../types/dragRegistration';

export {
  createKind,
  createGlobalKind,
  anyDragKind as anyKind,
} from '../utils/drag-and-drop/dragKind';

/**
 * Returns the page-wide drag-and-drop manager. It includes the registration methods that
 * `Draggable.Root`, `DropTarget.Root`, `DragAutoScroll.Root`, and `useDragMonitor`
 * are built on, plus `cancelDrag` to end the drag in progress.
 *
 * Use it to register an existing element, integrate a non-React widget, or keep
 * registrations in one place.
 *
 * Every call controls the same page-wide manager. Base UI reads the nearest
 * `Draggable.PreviewProvider` at the hook's call site.
 *
 * Documentation: [Base UI useDragDropManager](https://base-ui.com/react/utils/use-drag-drop-manager)
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
  WithOptionalPayload,
  WithRequiredPayload,
  WithInferredAccept,
  WithRequiredAccept,
} from '../types/dragRegistration';
export type { AcceptedDragPayload, AnyDragAccept, DragKind } from '../types/drag';
// The return type of every `register*` method, re-exported so typing a held
// cleanup doesn't need a second import from `@base-ui/react/types`.
export type { DragCleanupFn } from '../types/drag';
