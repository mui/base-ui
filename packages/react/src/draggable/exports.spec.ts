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
void acceptedKind;

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

// `@base-ui/react/types` exports no drag types: they live on the Draggable entry point.
// @ts-expect-error use `Draggable.Kind` instead.
type RemovedSharedDragKind = BaseUITypes.DraggableKind;
// @ts-expect-error use `Draggable.Root.Record` instead.
type RemovedSharedDragSource = BaseUITypes.DraggableRootRecord;
// @ts-expect-error use `Draggable.Target.Record` instead.
type RemovedSharedDropTargetRecord = BaseUITypes.DropTargetRecord;
