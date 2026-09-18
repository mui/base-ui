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
  DropTargetChangeReason,
  DropTargetPayload,
  DropTargetPayloadGetter,
  DropTargetResolutionContext,
} from '../types/drag';

export type * from './target/DraggableTarget';
export type * from './viewport/DraggableViewport';
export type {
  DragAutoScrollEvent,
  DragAutoScrollEventDetails,
  DragAutoScrollDirection,
  DragAutoScrollHandler,
  DragAutoScrollFrameContext,
} from '../utils/drag-and-drop/autoScroller';
export type { UseDragMonitorParameters } from './use-drag-monitor/useDragMonitor';
export type { UseDragDropManagerReturnValue } from './use-drag-drop-manager/useDragDropManager';
// The parameter types of every `useDragDropManager` registration method, so a
// consumer can type a held registration without a second import from
// `@base-ui/react/types`.
export type {
  DragDropManager,
  RegisterDraggableParameters,
  RegisterDraggableParametersWithPayload,
  RegisterDropTargetParameters,
  RegisterDropTargetParametersWithPayload,
  RegisterAutoScrollerParameters,
  RegisterMonitorParameters,
} from '../types/dragRegistration';

export type * from './collision-provider/DraggableCollisionProvider';
