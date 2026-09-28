import type * as Exports from '@base-ui/react/draggable';
import { expectType } from '#test-utils';

// Each namespace alias resolves to the same type as its flat export.
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
