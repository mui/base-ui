'use client';
import { useInnerDragEngine } from '../utils/drag-and-drop/useInnerDragEngine';
import type { DragEngine } from '../types/dragRegistration';

export {
  createKind,
  createGlobalKind,
  anyDragKind as anyKind,
} from '../utils/drag-and-drop/dragKind';

/**
 * Returns the drag engine's imperative API: the registration methods that
 * `Draggable.Root`, `DropTarget.Root`, `DragAutoScroll.Root`, and `useDragMonitor`
 * are built on, plus `startKeyboardDrag` to open a keyboard drag from your own
 * trigger and `cancelDrag` to end the drag in progress.
 *
 * Reach for it to drive drag and drop from your own code rather than the components and hooks:
 * registering an element you already hold, bridging a non-React widget,
 * or centralizing every registration in one place.
 *
 * The engine itself is global, but the two React-context inputs (the locale used
 * for default announcements and the nearest `Draggable.PreviewProvider`) are read
 * at *this hook's* call site, not at each element's position in the tree. Put both
 * providers above the component that calls `useDragEngine`, even when the elements
 * it registers render further down.
 *
 * Documentation: [Base UI useDragEngine](https://base-ui.com/react/utils/use-drag-engine)
 *
 * @public
 */
export function useDragEngine(): UseDragEngineReturnValue {
  return useInnerDragEngine();
}

export namespace useDragEngine {
  export type ReturnValue = UseDragEngineReturnValue;
}

/**
 * The drag engine's imperative API returned by {@link useDragEngine}:
 * `registerDraggable`, `registerDropTarget`, `registerAutoScroller`,
 * `registerMonitor`, `startKeyboardDrag`, and `cancelDrag`.
 */
export interface UseDragEngineReturnValue extends DragEngine {}

// The `WithPayload` variants, the `accept` wrappers and `DragKind` come along
// because the signatures above reference them: without them the generated
// reference renders those names with no definition on the page.
export type {
  DragEngine,
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
