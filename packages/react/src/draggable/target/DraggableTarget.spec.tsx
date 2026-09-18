import * as React from 'react';
import { expectType } from '#test-utils';
import type {
  DropEvent,
  DropTargetPayload,
  DropTargetPayloadGetter,
  DropTargetRecord,
} from '@base-ui/react/draggable';
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

interface SlotData {
  index: number;
}

const card = Draggable.createKind<CardPayload>('card');
const task = Draggable.createKind<TaskPayload>('task');
const file = Draggable.createKind<AttachmentPayload>('file');
const divider = Draggable.createKind('divider');
const slot = Draggable.createKind<SlotData>('slot');

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
  getPayload={({ source }) => ({ over: source.kind })}
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
// dragged item's data and its own.
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

// @ts-expect-error a handler declaring a payload `accept` doesn't promise is rejected.
<Draggable.Target accept={card} onDraggableDrop={(event: DropEvent<TaskPayload>) => event} />;

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
declare const untypedRecord: DropTargetRecord<unknown>;
if (slot.matches(untypedRecord)) {
  expectType<SlotData, typeof untypedRecord.payload>(untypedRecord.payload);
}

// The explicit type arguments are the source payload and the local payload, matching
// `Draggable.Target.Props` and rarely needed now that both are inferred.
<Draggable.Target<CardPayload, SlotData>
  accept={card}
  payload={{ index: 0 }}
  onDraggableDrop={({ source, target }) => {
    expectType<CardPayload, typeof source.payload>(source.payload);
    expectType<SlotData, typeof target.payload>(target.payload);
  }}
/>;

// @ts-expect-error an explicit local data type makes `payload` required, so the
// engine can never emit `undefined` where a `SlotData` was promised.
<Draggable.Target<CardPayload, SlotData> accept={card} />;

declare const maybeSlotData: SlotData | undefined;
// @ts-expect-error a required target payload cannot be explicitly undefined.
<Draggable.Target<CardPayload, SlotData> accept={card} payload={undefined} />;
// @ts-expect-error a possibly undefined target payload cannot satisfy a required payload.
<Draggable.Target<CardPayload, SlotData> accept={card} payload={maybeSlotData} />;
// @ts-expect-error a required target payload getter cannot be explicitly undefined.
<Draggable.Target<CardPayload, SlotData> accept={card} getPayload={undefined} />;

// @ts-expect-error the payload must match the explicit type argument.
<Draggable.Target<CardPayload, SlotData> accept={card} payload={{ index: 'first' }} />;

// @ts-expect-error the callback's return type must match it too.
<Draggable.Target<CardPayload, SlotData> accept={card} getPayload={() => ({ index: 'first' })} />;

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
  onDraggableDrop={({ source, location }) => {
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

// `payload` is the only thing `TLocalData` is inferred from. An inline handler is
// context-sensitive and contributes no candidates, but an extracted one does — so
// without `NoInfer` on the handlers, `TLocalData` here would come out as
// `{ other: boolean }` and the mismatch would be reported against `payload`
// instead of against the handler that caused it.
const mismatchedDrop = (parameters: DropEvent<unknown, { other: boolean }>) => parameters;
<Draggable.Target
  accept={Draggable.anyKind}
  // @ts-expect-error the handler must match the payload, not redefine it.
  payload={{ index: 0 }}
  // @ts-expect-error the handler must match the payload, not redefine it.
  onDraggableDrop={mismatchedDrop}
/>;

// A wider handler still accepts the inferred payload.
const wideDrop = (parameters: DropEvent<unknown, unknown>) => parameters;
<Draggable.Target
  accept={Draggable.anyKind}
  payload="inbox"
  onDraggableDrop={(event) => {
    wideDrop(event);
    expectType<string, typeof event.target.payload>(event.target.payload);
    expectType<string, typeof event.dropTarget.payload>(event.dropTarget.payload);
  }}
  onDraggableMove={({ target }) => {
    expectType<string, typeof target.payload>(target.payload);
  }}
/>;

// `Props` stays keyed on the payloads rather than on an `accept` value, so declaring a
// wrapper's props reads the same as before.
type SlotProps = Draggable.Target.Props<CardPayload, SlotData>;
const slotValueProps: SlotProps = { accept: card, payload: { index: 0 } };
const slotCallbackProps: SlotProps = { accept: card, getPayload: () => ({ index: 0 }) };
expectType<DropTargetPayload<SlotData>, NonNullable<typeof slotValueProps.payload>>(
  slotValueProps.payload!,
);
expectType<
  DropTargetPayloadGetter<CardPayload, SlotData>,
  NonNullable<typeof slotCallbackProps.getPayload>
>(slotCallbackProps.getPayload!);

// @ts-expect-error `Props` mirrors the component: a declared `TLocalData` requires a payload.
const slotMissingProps: SlotProps = { accept: card };

// @ts-expect-error `Props` mirrors the component's required `accept` too.
const slotNoAcceptProps: SlotProps = { payload: { index: 0 } };

// A wrapper forwarding these props satisfies the component's overloads, and the kinds
// it declared reach the caller's handlers.
function Slot(props: SlotProps) {
  return <Draggable.Target<CardPayload, SlotData> {...props} />;
}
<Slot
  accept={card}
  payload={{ index: 0 }}
  onDraggableDrop={({ source, target }) => `${source.payload.id}:${target.payload.index}`}
/>;

// @ts-expect-error target stack changes are observed on a source or monitor.
<Draggable.Target onTargetChange={() => {}} />;
