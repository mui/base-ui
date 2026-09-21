import type * as React from 'react';

export type {
  BaseUIChangeEventDetails,
  BaseUIGenericEventDetails,
} from '../internals/createBaseUIEventDetails';

export type HTMLProps<T = any> = React.HTMLAttributes<T> & {
  ref?: React.Ref<T> | undefined;
};

/**
 * Shape of the render prop: a function that takes props to be spread on the element and component's state and returns a React element.
 *
 * @template Props Props to be spread on the rendered element.
 * @template State Component's internal state.
 */
export type ComponentRenderFn<Props, State> = (
  props: Props,
  state: State,
) => React.ReactElement<unknown>;

export type BaseUIEvent<E extends React.SyntheticEvent<Element, Event>> = E & {
  preventBaseUIHandler: () => void;
  readonly baseUIHandlerPrevented?: boolean | undefined;
};

export type {
  RegisterDraggableParameters,
  RegisterDropTargetParameters,
  RegisterDraggableParametersWithPayload,
  RegisterDropTargetParametersWithPayload,
  RegisterAutoScrollerParameters,
  RegisterMonitorParameters,
  DragDropManager,
} from './dragRegistration';

export type {
  DragAutoScrollEvent,
  DragAutoScrollEventDetails,
  DragAutoScrollDirection,
  DragAutoScrollHandler,
  DragAutoScrollFrameContext,
} from '../utils/drag-and-drop/autoScroller';

export type { DragActivation, DragActivationConfig } from '../utils/drag-and-drop/activation';

export type {
  AcceptedDragPayload,
  AcceptedDragData,
  AnyDragAccept,
  DragAccept,
  DragAcceptedKind,
  DragCleanupFn,
  DragHandle,
  DragKind,
  DragLocation,
  DragLocationHistory,
  DragPreviewContainer,
  DragPreviewOffset,
  DragModifier,
  DragModifierContext,
  DragModifiers,
  DragElementReference,
  DragPreviewParameters,
  DragPreviewSettings,
  DropTargetRecord,
  DragSource,
  BaseDragEvent,
  DraggableEventMap,
  DraggableEventDetailsMap,
  MoveStartEvent,
  BeforeMoveStartEventDetails,
  DragStartReason,
  MoveStartEventDetails,
  MoveEvent,
  DragMoveReason,
  MoveEventDetails,
  DropTargetChangeEvent,
  DropTargetChangeReason,
  DropTargetChangeEventDetails,
  DragDropEvent,
  DragDropReason,
  DragDropEventDetails,
  MoveEndEvent,
  DragEndReason,
  MoveEndEventDetails,
  DragCompletedReason,
  DragCanceledReason,
  DragEventDetails,
  DropEvent,
  DropTargetEvent,
  DropTargetEventMap,
  DropTargetEventDetailsMap,
  DragPreviewRenderEvent,
  DragInput,
  DragLocalPoint,
  DragPointerType,
  DragPosition,
  DragSnappedLocalPointOptions,
  DragSnapSteps,
  DragPreviewOffsetParameters,
  MoveStartContext,
  DraggablePayload,
  DropTargetResolutionContext,
  DropTargetPayload,
  DropTargetEventTarget,
} from './drag';
