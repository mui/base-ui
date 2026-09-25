import * as React from 'react';
import { expectType } from '#test-utils';
import type { DraggableTargetDropValue, DraggableTargetRecord } from '@base-ui/react/draggable';
import { Draggable } from '@base-ui/react/draggable';

interface CardPayload {
  id: string;
}

interface TaskPayload {
  index: number;
}

interface AttachmentPayload {
  mime: string;
}

interface SlotPayload {
  index: number;
}

const card = Draggable.createKind<CardPayload>('card');
const task = Draggable.createKind<TaskPayload>('task');
const file = Draggable.createKind<AttachmentPayload>('file');
const divider = Draggable.createKind('divider');
const slot = Draggable.createKind<SlotPayload>('slot');
const detailedSlot = Draggable.createKind<{ index: number; label: string }>('detailed-slot');

// @ts-expect-error the target kind requires every payload field, even when a subset is inferred.
<Draggable.Target accept={card} kind={detailedSlot} payload={{ index: 0 }} />;
// @ts-expect-error a resolver must also provide the kind's complete payload.
<Draggable.Target accept={card} kind={detailedSlot} getPayload={() => ({ index: 0 })} />;
// @ts-expect-error heterogeneous accepted kinds do not weaken the target's own payload contract.
<Draggable.Target accept={[card, file]} kind={detailedSlot} payload={{ index: 0 }} />;
<Draggable.Target
  accept={[card, file]}
  kind={detailedSlot}
  payload={{ index: 0, label: 'Inbox' }}
  onDraggableDrop={({ target }) => {
    expectType<string, typeof target.payload.label>(target.payload.label);
  }}
/>;

// An omitted accept matches only the nearest provider default kind.
<Draggable.Target
  onDraggableDrop={({ source }) => {
    expectType<undefined, typeof source.payload>(source.payload);
  }}
/>;

function DefaultKindTarget(props: Draggable.Target.Props) {
  return <Draggable.Target {...props} />;
}
<DefaultKindTarget />;

// The catch-all is the explicit opt-in, and leaves `source.payload` as `unknown` —
// nothing has been declared about what this target receives.
<Draggable.Target
  accept={Draggable.anyKind}
  onDraggableDrop={({ source }) => {
    expectType<unknown, typeof source.payload>(source.payload);
  }}
/>;

// A value payload types `target.payload`, with no type argument.
<Draggable.Target
  accept={Draggable.anyKind}
  payload={{ index: 0 }}
  onDraggableDrop={({ target }) => {
    expectType<{ index: number }, typeof target.payload>(target.payload);
  }}
/>;

// A payload resolver infers from its return type, and sees the drag it is
// deriving the payload from.
<Draggable.Target
  accept={Draggable.anyKind}
  payload={{ over: Symbol() }}
  onDraggableDrop={({ target }) => {
    expectType<{ over: symbol }, typeof target.payload>(target.payload);
  }}
/>;

// The payload need not be an object.
<Draggable.Target
  accept={Draggable.anyKind}
  payload="inbox"
  onDraggableDrop={({ target }) => {
    expectType<string, typeof target.payload>(target.payload);
  }}
/>;

const targetCommand = () => 'run';
<Draggable.Target
  accept={Draggable.anyKind}
  payload={targetCommand}
  onDraggableDrop={({ target }) => {
    expectType<typeof targetCommand, typeof target.payload>(target.payload);
  }}
/>;

// `accept` types every event that carries the source, with no type argument.
<Draggable.Target
  accept={card}
  onDraggableDrop={({ source }) => {
    expectType<CardPayload, typeof source.payload>(source.payload);
  }}
/>;

// `accept` and `payload` are separate inference sites, so one target types both the
// dragged item's payload and its own.
<Draggable.Target
  accept={card}
  payload={{ index: 0 }}
  onDraggableDrop={({ source, target }) => {
    expectType<CardPayload, typeof source.payload>(source.payload);
    expectType<{ index: number }, typeof target.payload>(target.payload);
  }}
/>;

// An array of kinds types the source as the union of their payloads, and each kind
// narrows it back down. The negative branch keeps the union: `matches` can confirm a
// kind, not rule the others out, so a second `matches` narrows the rest.
<Draggable.Target
  accept={[task, file]}
  onDraggableDrop={({ source }) => {
    expectType<TaskPayload | AttachmentPayload, typeof source.payload>(source.payload);
    if (file.matches(source)) {
      expectType<AttachmentPayload, typeof source.payload>(source.payload);
    } else if (task.matches(source)) {
      expectType<TaskPayload, typeof source.payload>(source.payload);
    }
  }}
/>;

// A catch-all target takes anything, so the payload is `unknown` until a kind
// narrows it.
<Draggable.Target
  accept={Draggable.anyKind}
  onDraggableDrop={({ source }) => {
    expectType<unknown, typeof source.payload>(source.payload);
    if (card.matches(source)) {
      expectType<CardPayload, typeof source.payload>(source.payload);
    }
  }}
/>;

<Draggable.Target
  accept={file}
  canDrop={({ source }) => {
    expectType<AttachmentPayload, typeof source.payload>(source.payload);
    return true;
  }}
/>;

<Draggable.Target
  accept={card}
  // @ts-expect-error a handler declaring a payload `accept` doesn't promise is rejected.
  onDraggableDrop={(value: Draggable.Target.DropValue<TaskPayload>) => value}
/>;

// A target's own `kind` identifies it on its records. It is checked against `payload`
// rather than inferred from, so `payload` stays the one source of `target.payload`.
<Draggable.Target accept={Draggable.anyKind} kind={slot} payload={{ index: 0 }} />;
<Draggable.Target accept={Draggable.anyKind} kind={divider} />;

// @ts-expect-error the kind's payload type must match this target's `payload`.
<Draggable.Target accept={Draggable.anyKind} kind={slot} payload={{ nope: true }} />;

// @ts-expect-error a payload-carrying kind can't register without a `payload`:
// `slot.matches(target)` would narrow to a payload the engine delivers as `undefined`.
<Draggable.Target accept={Draggable.anyKind} kind={slot} />;

// A kind narrows the records a handler walks, so a target can tell which of several
// kinds of target the drag landed on.
declare const untypedRecord: DraggableTargetRecord<unknown>;
if (slot.matches(untypedRecord)) {
  expectType<SlotPayload, typeof untypedRecord.payload>(untypedRecord.payload);
}

// The explicit type arguments are the source payload and the local payload, matching
// `Draggable.Target.Props` and rarely needed now that both are inferred.
<Draggable.Target<CardPayload, SlotPayload>
  accept={card}
  payload={{ index: 0 }}
  onDraggableDrop={({ source, target }) => {
    expectType<CardPayload, typeof source.payload>(source.payload);
    expectType<SlotPayload, typeof target.payload>(target.payload);
  }}
/>;

// @ts-expect-error an explicit target payload type makes `payload` required, so the
// engine can never emit `undefined` where a `SlotPayload` was promised.
<Draggable.Target<CardPayload, SlotPayload> accept={card} />;

declare const maybeSlotPayload: SlotPayload | undefined;
// @ts-expect-error a required target payload cannot be explicitly undefined.
<Draggable.Target<CardPayload, SlotPayload> accept={card} payload={undefined} />;
// @ts-expect-error a possibly undefined target payload cannot satisfy a required payload.
<Draggable.Target<CardPayload, SlotPayload> accept={card} payload={maybeSlotPayload} />;
// @ts-expect-error a required target payload getter cannot be explicitly undefined.
<Draggable.Target<CardPayload, SlotPayload> accept={card} getPayload={undefined} />;

// @ts-expect-error the payload must match the explicit type argument.
<Draggable.Target<CardPayload, SlotPayload> accept={card} payload={{ index: 'first' }} />;

<Draggable.Target<CardPayload, SlotPayload>
  // @ts-expect-error getPayload has been removed.
  accept={card}
  getPayload={() => ({ index: 'first' })}
/>;

<Draggable.Target
  accept={Draggable.anyKind}
  className={(state) => {
    expectType<boolean, typeof state.dragOver>(state.dragOver);
    expectType<boolean, typeof state.dragOverInnermost>(state.dragOverInnermost);
    return '';
  }}
/>;

const ref: React.Ref<HTMLDivElement> = null;
<Draggable.Target accept={Draggable.anyKind} ref={ref} />;

// Native drag events coexist with the engine callbacks.
<Draggable.Target
  accept={card}
  onDrop={(event) => expectType<DataTransfer, typeof event.dataTransfer>(event.dataTransfer)}
  onDragOver={(event) => expectType<DataTransfer, typeof event.dataTransfer>(event.dataTransfer)}
  onDraggableDrop={({ source }, { location }) => {
    expectType<CardPayload, typeof source.payload>(source.payload);
    expectType<number, typeof location.current.input.clientX>(location.current.input.clientX);
  }}
/>;

// One element, both roles: the drop target composes onto the drag source.
<Draggable.Root
  kind={card}
  payload={{ id: 'a' }}
  render={<Draggable.Target accept={card} payload={{ index: 0 }} />}
/>;

// `payload` is the only thing `TTargetPayload` is inferred from. An inline handler is
// context-sensitive and contributes no candidates, but an extracted one does — so
// without `NoInfer` on the handlers, `TTargetPayload` here would come out as
// `{ other: boolean }` and the mismatch would be reported against `payload`
// instead of against the handler that caused it.
const mismatchedDrop = (value: DraggableTargetDropValue<unknown, { other: boolean }>) => value;
<Draggable.Target
  accept={Draggable.anyKind}
  // @ts-expect-error the handler must match the payload, not redefine it.
  payload={{ index: 0 }}
  // @ts-expect-error the handler must match the payload, not redefine it.
  onDraggableDrop={mismatchedDrop}
/>;

// A wider handler still accepts the inferred payload.
const wideDrop = (value: Draggable.Target.DropValue<unknown, unknown>) => value;
<Draggable.Target
  accept={Draggable.anyKind}
  payload="inbox"
  onDraggableDrop={(value) => {
    wideDrop(value);
    expectType<string, typeof value.target.payload>(value.target.payload);
  }}
  onDraggableMove={({ target }) => {
    expectType<string, typeof target.payload>(target.payload);
  }}
/>;

// `Props` stays keyed on the payloads rather than on an `accept` value, so declaring a
// wrapper's props reads the same as before.
type SlotProps = Draggable.Target.Props<CardPayload, SlotPayload>;
const slotValueProps: SlotProps = { accept: card, payload: { index: 0 } };
expectType<SlotPayload, NonNullable<typeof slotValueProps.payload>>(slotValueProps.payload!);

// @ts-expect-error `Props` mirrors the component: a declared `TTargetPayload` requires a payload.
const slotMissingProps: SlotProps = { accept: card };

// @ts-expect-error `Props` mirrors the component's required `accept` too.
const slotNoAcceptProps: SlotProps = { payload: { index: 0 } };

// A wrapper forwarding these props satisfies the component's overloads, and the kinds
// it declared reach the caller's handlers.
function Slot(props: SlotProps) {
  return <Draggable.Target<CardPayload, SlotPayload> {...props} />;
}
<Slot
  accept={card}
  payload={{ index: 0 }}
  onDraggableDrop={({ source, target }) => `${source.payload.id}:${target.payload.index}`}
/>;

// @ts-expect-error target stack changes are observed on a source or monitor.
<Draggable.Target onTargetChange={() => {}} />;

const dragCard = Draggable.createKind<CardPayload, { offset: number }>('drag-card');
const dragSlot = Draggable.createKind<SlotPayload, { entered: boolean }>('drag-slot');
<Draggable.Target
  accept={dragCard}
  kind={dragSlot}
  payload={{ index: 0 }}
  onDraggableEnter={({ source, target }) => {
    expectType<{ offset: number } | undefined, typeof source.dragData>(source.dragData);
    expectType<{ entered: boolean } | undefined, typeof target.dragData>(target.dragData);
    target.updatePayload({ index: 1 });
    target.updateDragData({ entered: true });
    // @ts-expect-error the target has its own drag data type.
    target.updateDragData({ offset: 1 });
    // @ts-expect-error the target keeps its payload type.
    target.updatePayload({ id: 'a' });
  }}
/>;

const dataOnlyTarget = Draggable.createKind<undefined, number>('data-only-target');
<Draggable.Target
  kind={dataOnlyTarget}
  onDraggableEnter={({ target }) => {
    expectType<number | undefined, typeof target.dragData>(target.dragData);
  }}
/>;

const dragFile = Draggable.createKind<AttachmentPayload, { size: number }>('drag-file');
<Draggable.Target
  accept={[dragCard, dragFile]}
  kind={dragSlot}
  payload={{ index: 0 }}
  onDraggableEnter={({ source, target }) => {
    const data: { offset: number } | { size: number } | undefined = source.dragData;
    source.updateDragData({ offset: 1 });
    source.updateDragData({ size: 1 });
    // @ts-expect-error accepted source drag data excludes unrelated values.
    source.updateDragData({ entered: true });
    void data;
    expectType<{ entered: boolean } | undefined, typeof target.dragData>(target.dragData);
    if (dragFile.matches(source)) {
      expectType<{ size: number } | undefined, typeof source.dragData>(source.dragData);
    }
  }}
/>;

// Generic wrappers. With the target and source payloads still open, a wrapper
// restates `accept` (and `payload` when the target has one) to reach an overload,
// whether it spreads or destructures its props.
interface WrapperTask {
  id: string;
}
interface WrapperZone {
  name: string;
}
const wrapperTask = Draggable.createKind<WrapperTask>('wrapper-task');

function ConcreteSlot(props: Draggable.Target.Props<WrapperTask, WrapperZone>) {
  return <Draggable.Target {...props} />;
}
<ConcreteSlot accept={wrapperTask} payload={{ name: 'a' }} />;

function OpenSlot<Source, Payload>(props: Draggable.Target.Props<Source, Payload>) {
  // @ts-expect-error an open `Props` can't tell which overload applies.
  return <Draggable.Target {...props} />;
}
void OpenSlot;

function GenericSlot<Source, Payload>({
  children,
  ...props
}: Draggable.Target.Props<Source, Payload> & {
  accept: Draggable.Accept<Source>;
  payload: Payload;
}) {
  return <Draggable.Target {...props}>{children}</Draggable.Target>;
}
<GenericSlot
  accept={wrapperTask}
  payload={{ name: 'a' }}
  onDraggableDrop={({ source, target }) => source.payload.id + target.payload.name}
/>;

function SourceOnlySlot<Source>(
  props: Draggable.Target.Props<Source> & { accept: Draggable.Accept<Source> },
) {
  return <Draggable.Target {...props} />;
}
<SourceOnlySlot accept={wrapperTask} onDraggableDrop={({ source }) => source.payload.id} />;
