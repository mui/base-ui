import type * as Exports from '@base-ui/react/draggable';
import type * as BaseUITypes from '@base-ui/react/types';
import { expectType } from '#test-utils';

// The public names that replaced the removed ones below.
declare const record: Exports.Draggable.Target.Record<{ id: string }>;
expectType<Exports.DraggableTargetRecord<{ id: string }>, typeof record>(record);
declare const moveEndValue: Exports.Draggable.Root.MoveEndValue<{ id: string }>;
expectType<Exports.DraggableRootMoveEndValue<{ id: string }>, typeof moveEndValue>(moveEndValue);
declare const manager: Exports.UseDraggableManagerReturnValue;
expectType<Exports.Draggable.useManager.ReturnValue, typeof manager>(manager);
declare const acceptedKind: Exports.Draggable.AcceptedKind;
expectType<Exports.DraggableAcceptedKind, typeof acceptedKind>(acceptedKind);
declare const location: Exports.Draggable.LocationHistory;
expectType<Exports.DraggableLocationHistory, typeof location>(location);
expectType<Exports.DraggableLocation, typeof location.current>(location.current);
expectType<Exports.Draggable.Location, typeof location.current>(location.current);
expectType<Exports.Draggable.Input, typeof location.current.input>(location.current.input);
expectType<Exports.Draggable.PointerType, typeof location.current.input.pointerType>(
  location.current.input.pointerType,
);
declare const activation: Exports.Draggable.Root.Activation;
expectType<Exports.DraggableRootActivation, typeof activation>(activation);
declare const modifierContext: Exports.Draggable.Root.ModifierContext;
expectType<Exports.DraggableRootModifierContext, typeof modifierContext>(modifierContext);
declare const localPoint: Exports.Draggable.Target.LocalPoint;
expectType<Exports.DraggableTargetLocalPoint, typeof localPoint>(localPoint);
declare const previewOffset: Exports.Draggable.Preview.Offset;
expectType<Exports.DraggablePreviewOffset, typeof previewOffset>(previewOffset);
declare const previewParameters: Exports.Draggable.Preview.Parameters;
expectType<Exports.DraggablePreviewParameters, typeof previewParameters>(previewParameters);
declare const handleReference: Exports.Draggable.Handle.Reference;
expectType<Exports.DraggableHandleReference, typeof handleReference>(handleReference);
declare const overflowMargin: Exports.Draggable.Viewport.OverflowMargin;
expectType<Exports.DraggableViewportOverflowMargin, typeof overflowMargin>(overflowMargin);
declare const scrollValue: Exports.Draggable.Viewport.DragScrollValue;
expectType<Exports.DraggableViewportDragScrollValue, typeof scrollValue>(scrollValue);

// Unprefixed names are gone from the flat exports.
// @ts-expect-error replaced by the part-prefixed value types, such as `DraggableRootMoveValue`.
type RemovedMoveEvent = Exports.MoveEvent;
// @ts-expect-error replaced by `DraggableTargetDropValue`.
type RemovedDropEvent = Exports.DropEvent;
// @ts-expect-error replaced by `DraggableTargetRecord`.
type RemovedDropTargetRecord = Exports.DropTargetRecord;
// @ts-expect-error replaced by `UseDraggableManagerReturnValue`.
type RemovedDragDropManager = Exports.DragDropManager;
// @ts-expect-error the shared event shape is internal.
type RemovedBaseDragEvent = Exports.BaseDragEvent;
// @ts-expect-error replaced by `UseDraggableManagerReturnValue`.
type RemovedUseManagerReturnValue = Exports.UseManagerReturnValue;

// Removed from the `Draggable` namespace.
// @ts-expect-error replaced by `Draggable.Root.MoveValue`.
type RemovedNamespaceMoveEvent = Exports.Draggable.MoveEvent;
// @ts-expect-error replaced by `Draggable.Target.Record`.
type RemovedNamespaceDropTargetRecord = Exports.Draggable.DropTargetRecord;
// @ts-expect-error `Draggable.Root.Props` requires the payload when the kind declares one.
type RemovedRootPropsWithPayload = Exports.Draggable.Root.PropsWithPayload;
// @ts-expect-error the collision target is reported directly as `value.target`.
type RemovedCollision = Exports.Draggable.CollisionProvider.Collision;
// @ts-expect-error replaced by `Draggable.Preview.RenderParameters`.
type RemovedPreviewRenderEvent = Exports.Draggable.Preview.RenderEvent;

// Removed from the `Draggable` namespace: they moved onto the part they belong to, or
// were renamed after it.
// @ts-expect-error replaced by `Draggable.Root.Record`.
type RemovedNamespaceDragSource = Exports.Draggable.DragSource;
// @ts-expect-error replaced by `Draggable.Kind`.
type RemovedNamespaceDragKind = Exports.Draggable.DragKind;
// @ts-expect-error replaced by `Draggable.AcceptedKind`.
type RemovedNamespaceDragAcceptedKind = Exports.Draggable.DragAcceptedKind;
// @ts-expect-error replaced by `Draggable.Root.Modifier`.
type RemovedNamespaceDragModifier = Exports.Draggable.DragModifier;
// @ts-expect-error replaced by `Draggable.Root.MoveEndEventReason`.
type RemovedNamespaceDragEndReason = Exports.Draggable.DragEndReason;
// @ts-expect-error replaced by `Draggable.Input`.
type RemovedNamespaceDragInput = Exports.Draggable.DragInput;
// @ts-expect-error replaced by `Draggable.LocationHistory`.
type RemovedNamespaceDragLocationHistory = Exports.Draggable.DragLocationHistory;
// @ts-expect-error replaced by `Draggable.Handle.Reference`.
type RemovedNamespaceDragHandle = Exports.Draggable.DragHandle;
// @ts-expect-error replaced by `Draggable.Preview.Offset`.
type RemovedNamespaceDragPreviewOffset = Exports.Draggable.DragPreviewOffset;
// @ts-expect-error replaced by `Draggable.Root.Activation`.
type RemovedNamespaceDragActivation = Exports.Draggable.DragActivation;
// @ts-expect-error replaced by `Draggable.Viewport.OverflowMargin`.
type RemovedNamespaceAutoScrollOverflowMargin = Exports.Draggable.AutoScrollOverflowMargin;

// `@base-ui/react/types` exports no drag types: they live on the Draggable entry point.
// @ts-expect-error use `Draggable.Kind` instead.
type RemovedSharedDragKind = BaseUITypes.DragKind;
// @ts-expect-error use `Draggable.Root.Record` instead.
type RemovedSharedDragSource = BaseUITypes.DragSource;
// @ts-expect-error use `Draggable.Target.Record` instead.
type RemovedSharedDropTargetRecord = BaseUITypes.DropTargetRecord;
// @ts-expect-error use `Draggable.useManager.ReturnValue` instead.
type RemovedSharedDragDropManager = BaseUITypes.DragDropManager;
// @ts-expect-error use `Draggable.Viewport.DragScrollValue` instead.
type RemovedSharedDragAutoScrollEvent = BaseUITypes.DragAutoScrollEvent;
// @ts-expect-error the flat twins stay on the Draggable entry point.
type RemovedSharedDraggableKind = BaseUITypes.DraggableKind;
