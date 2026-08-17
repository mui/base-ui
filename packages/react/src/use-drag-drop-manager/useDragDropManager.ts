'use client';
import { useInnerDragEngine } from '../utils/drag-and-drop/useInnerDragEngine';
import type { DragDropManager } from '../types/dragRegistration';

export {
  createKind,
  createGlobalKind,
  anyDragKind as anyKind,
} from '../utils/drag-and-drop/dragKind';

/**
 * Returns the page-global drag-and-drop manager: the registration methods that
 * `Draggable.Root`, `DropTarget.Root`, `DragAutoScroll.Root`, and `useDragMonitor`
 * are built on, plus `startKeyboardDrag` to open a keyboard drag from your own
 * trigger and `cancelDrag` to end the drag in progress.
 *
 * Reach for it to drive drag and drop from your own code rather than the components and hooks:
 * registering an element you already hold, bridging a non-React widget,
 * or centralizing every registration in one place.
 *
 * Every call controls the same page-global manager. The two React-context inputs (the locale used
 * for default announcements and the nearest `Draggable.PreviewProvider`) are read
 * at *this hook's* call site, not at each element's position in the tree. Put both
 * providers above the component that calls `useDragDropManager`, even when the elements
 * it registers render further down.
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
 * The page-global imperative API returned by {@link useDragDropManager}:
 * `registerDraggable`, `registerDropTarget`, `registerAutoScroller`,
 * `registerMonitor`, `startKeyboardDrag`, and `cancelDrag`.
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
