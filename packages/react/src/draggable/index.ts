export * as Draggable from './index.parts';

export type * from './root/DraggableRoot';
export type * from './handle/DraggableHandle';
export type * from './preview/DraggablePreview';
export type * from './DraggableProvider';
export type { UseDraggableActiveDragReturnValue } from './use-active-drag';

// The event and option types a `Draggable.*` consumer needs to type extracted
// handlers and props, re-exported so this entry point is self-sufficient (they
// also remain available from `@base-ui/react/types`; both resolve to the
// same declarations, so the star exports stay unambiguous).
export type {
  BaseDragEvent,
  BeforeMoveStartEventDetails,
  DraggablePayload,
  DraggablePayloadGetter,
  DragAccept,
  DragKind,
  DragModifier,
  DragModifierContext,
  DragModifiers,
  DragElementReference,
  DragDropEvent,
  DragDropEventDetails,
  DragDropReason,
  MoveEndEvent,
  MoveEndEventDetails,
  DragEndReason,
  DragCanceledReason,
  DragCompletedReason,
  DragEventDetails,
  DraggableEventDetailsMap,
  DragHandle,
  DragInput,
  DragLocalPoint,
  DragLocation,
  DragLocationHistory,
  DraggableEventMap,
  MoveEvent,
  DragMoveReason,
  MoveEventDetails,
  MoveStartEventDetails,
  DropTargetChangeEventDetails,
  DragPosition,
  DragPreviewContainer,
  DragPreviewOffset,
  DragPreviewParameters,
  DragPreviewRenderEvent,
  DragPreviewSettings,
  DragSnappedLocalPointOptions,
  DragSnapSteps,
  DragSource,
  MoveStartContext,
  MoveStartEvent,
  DropTargetChangeEvent,
  DropTargetRecord,
  DragPointerType,
  DragPreviewOffsetParameters,
} from '../types/drag';
export type { DragActivation, DragActivationConfig } from '../utils/drag-and-drop/activation';

export type {
  DropTargetEvent,
  DropTargetEventMap,
  DropTargetEventDetailsMap,
  DropEvent,
  DropTargetEventTarget,
} from '../types/drag';

export type * from '../drop-target/root/DropTargetRoot';
export type * from '../drag-auto-scroll/root/DragAutoScrollRoot';
export type { UseDragMonitorParameters } from '../use-drag-monitor/useDragMonitor';
export type { UseDragDropManagerReturnValue } from '../use-drag-drop-manager/useDragDropManager';
