export * as Draggable from './index.parts';

export type * from './root/DraggableRoot';
export type * from './handle/DraggableHandle';
export type * from './preview/DraggablePreview';
export type * from './preview/DraggableClonedPreview';
export type * from './preview-provider/DraggablePreviewProvider';
export type { UseDraggableActiveDragReturnValue } from './use-active-drag';

// The event and option types a `Draggable.*` consumer needs to type extracted
// handlers and props, re-exported so this entry point is self-sufficient (they
// also remain available from `@base-ui/react/types`; both resolve to the
// same declarations, so the star exports stay unambiguous).
export type {
  BaseDragEvent,
  BeforeDragStartEventDetails,
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
  DragEndEvent,
  DragEndEventDetails,
  DragEndReason,
  DragCanceledReason,
  DragCompletedReason,
  DragEventDetails,
  DragEventDetailsMap,
  DragHandle,
  DragInput,
  DragLocalPoint,
  DragLocation,
  DragLocationHistory,
  DragEventMap,
  DragMoveEvent,
  DragMoveEventDetails,
  DragStartEventDetails,
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
  DragStartContext,
  DragStartEvent,
  DropTargetChangeEvent,
  DropTargetRecord,
  DragPointerType,
  DragPreviewOffsetParameters,
} from '../types/drag';
export type { DragActivation, DragActivationConfig } from '../utils/drag-and-drop/activation';
