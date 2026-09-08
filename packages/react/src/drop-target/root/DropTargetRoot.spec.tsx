import * as React from 'react';
import { expectType } from '#test-utils';
import type {
  DropEvent,
  DropTargetPayload,
  DropTargetPayloadGetter,
  DropTargetRecord,
} from '@base-ui/react/drop-target';
import { Draggable } from '@base-ui/react/draggable';
import { DropTarget } from '@base-ui/react/drop-target';

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

const card = DropTarget.createKind<CardPayload>('card');
const task = DropTarget.createKind<TaskPayload>('task');
const file = DropTarget.createKind<AttachmentPayload>('file');
const divider = DropTarget.createKind('divider');
const slot = DropTarget.createKind<SlotData>('slot');

// `accept` is required: the engine is page-global with no subtree scoping, so a
// target written without one would silently take every drag in the application.
// @ts-expect-error `accept` is required on a drop target.
<DropTarget.Root />;

// The catch-all is the explicit opt-in, and leaves `source.payload` as `unknown` —
// nothing has been declared about what this target receives.
<DropTarget.Root
  accept={DropTarget.anyKind}
  onDrop={({ source }) => {
    expectType<unknown, typeof source.payload>(source.payload);
  }}
/>;

// A value payload types `self.payload`, with no type argument.
<DropTarget.Root
  accept={DropTarget.anyKind}
  payload={{ index: 0 }}
  onDrop={({ self }) => {
    expectType<{ index: number }, typeof self.payload>(self.payload);
  }}
/>;

// A payload resolver infers from its return type, and sees the drag it is
// deriving the payload from.
<DropTarget.Root
  accept={DropTarget.anyKind}
  getPayload={({ source }) => ({ over: source.kind })}
  onDrop={({ self }) => {
    expectType<{ over: symbol }, typeof self.payload>(self.payload);
  }}
/>;

// The payload need not be an object.
<DropTarget.Root
  accept={DropTarget.anyKind}
  payload="inbox"
  onDrop={({ self }) => {
    expectType<string, typeof self.payload>(self.payload);
  }}
/>;

const targetCommand = () => 'run';
<DropTarget.Root
  accept={DropTarget.anyKind}
  payload={targetCommand}
  onDrop={({ self }) => {
    expectType<typeof targetCommand, typeof self.payload>(self.payload);
  }}
/>;

// `accept` types every event that carries the source, with no type argument.
<DropTarget.Root
  accept={card}
  onDrop={({ source }) => {
    expectType<CardPayload, typeof source.payload>(source.payload);
  }}
/>;

// `accept` and `payload` are separate inference sites, so one target types both the
// dragged item's data and its own.
<DropTarget.Root
  accept={card}
  payload={{ index: 0 }}
  onDrop={({ source, self }) => {
    expectType<CardPayload, typeof source.payload>(source.payload);
    expectType<{ index: number }, typeof self.payload>(self.payload);
  }}
/>;

// An array of kinds types the source as the union of their payloads, and each kind
// narrows it back down. The negative branch keeps the union: `matches` can confirm a
// kind, not rule the others out, so a second `matches` narrows the rest.
<DropTarget.Root
  accept={[task, file]}
  onDrop={({ source }) => {
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
<DropTarget.Root
  accept={DropTarget.anyKind}
  onDrop={({ source }) => {
    expectType<unknown, typeof source.payload>(source.payload);
    if (card.matches(source)) {
      expectType<CardPayload, typeof source.payload>(source.payload);
    }
  }}
/>;

<DropTarget.Root
  accept={file}
  canDrop={({ source }) => {
    expectType<AttachmentPayload, typeof source.payload>(source.payload);
    return true;
  }}
/>;

// @ts-expect-error a handler declaring a payload `accept` doesn't promise is rejected.
<DropTarget.Root accept={card} onDrop={(event: DropEvent<TaskPayload>) => event} />;

// A target's own `kind` identifies it on its records. It is checked against `payload`
// rather than inferred from, so `payload` stays the one source of `self.payload`.
<DropTarget.Root accept={DropTarget.anyKind} kind={slot} payload={{ index: 0 }} />;
<DropTarget.Root accept={DropTarget.anyKind} kind={divider} />;

// @ts-expect-error the kind's payload type must match this target's `payload`.
<DropTarget.Root accept={DropTarget.anyKind} kind={slot} payload={{ nope: true }} />;

// @ts-expect-error a payload-carrying kind can't register without a `payload`:
// `slot.matches(target)` would narrow to a payload the engine delivers as `undefined`.
<DropTarget.Root accept={DropTarget.anyKind} kind={slot} />;

// A kind narrows the records a handler walks, so a target can tell which of several
// kinds of target the drag landed on.
declare const untypedRecord: DropTargetRecord<unknown>;
if (slot.matches(untypedRecord)) {
  expectType<SlotData, typeof untypedRecord.payload>(untypedRecord.payload);
}

// The explicit type arguments are the source payload and the local payload, matching
// `DropTarget.Root.Props` and rarely needed now that both are inferred.
<DropTarget.Root<CardPayload, SlotData>
  accept={card}
  payload={{ index: 0 }}
  onDrop={({ source, self }) => {
    expectType<CardPayload, typeof source.payload>(source.payload);
    expectType<SlotData, typeof self.payload>(self.payload);
  }}
/>;

// @ts-expect-error an explicit local data type makes `payload` required, so the
// engine can never emit `undefined` where a `SlotData` was promised.
<DropTarget.Root<CardPayload, SlotData> accept={card} />;

declare const maybeSlotData: SlotData | undefined;
// @ts-expect-error a required target payload cannot be explicitly undefined.
<DropTarget.Root<CardPayload, SlotData> accept={card} payload={undefined} />;
// @ts-expect-error a possibly undefined target payload cannot satisfy a required payload.
<DropTarget.Root<CardPayload, SlotData> accept={card} payload={maybeSlotData} />;
// @ts-expect-error a required target payload getter cannot be explicitly undefined.
<DropTarget.Root<CardPayload, SlotData> accept={card} getPayload={undefined} />;

// @ts-expect-error the payload must match the explicit type argument.
<DropTarget.Root<CardPayload, SlotData> accept={card} payload={{ index: 'first' }} />;

// @ts-expect-error the callback's return type must match it too.
<DropTarget.Root<CardPayload, SlotData> accept={card} getPayload={() => ({ index: 'first' })} />;

<DropTarget.Root
  accept={DropTarget.anyKind}
  className={(state) => {
    expectType<boolean, typeof state.dragOver>(state.dragOver);
    expectType<boolean, typeof state.dragOverInnermost>(state.dragOverInnermost);
    return '';
  }}
/>;

const ref: React.Ref<HTMLDivElement> = null;
<DropTarget.Root accept={DropTarget.anyKind} ref={ref} />;

// The engine's `onDrop` replaces the native one, so it carries the drag payload
// rather than a React DragEvent.
<DropTarget.Root
  accept={card}
  onDrop={({ source, location }) => {
    expectType<CardPayload, typeof source.payload>(source.payload);
    expectType<number, typeof location.current.input.clientX>(location.current.input.clientX);
  }}
/>;

// One element, both roles: the drop target composes onto the drag source.
<Draggable.Root
  label="Card"
  kind={card}
  payload={{ id: 'a' }}
  render={<DropTarget.Root accept={card} payload={{ index: 0 }} />}
/>;

// `payload` is the only thing `TLocalData` is inferred from. An inline handler is
// context-sensitive and contributes no candidates, but an extracted one does — so
// without `NoInfer` on the handlers, `TLocalData` here would come out as
// `{ other: boolean }` and the mismatch would be reported against `payload`
// instead of against the handler that caused it.
const mismatchedDrop = (parameters: DropEvent<unknown, { other: boolean }>) => parameters;
// @ts-expect-error the handler must match the payload, not redefine it.
<DropTarget.Root accept={DropTarget.anyKind} payload={{ index: 0 }} onDrop={mismatchedDrop} />;

// A wider handler still accepts the inferred payload.
const wideDrop = (parameters: DropEvent<unknown, unknown>) => parameters;
<DropTarget.Root
  accept={DropTarget.anyKind}
  payload="inbox"
  onDrop={(event) => {
    wideDrop(event);
    expectType<string, typeof event.self.payload>(event.self.payload);
    expectType<string, typeof event.dropTarget.payload>(event.dropTarget.payload);
  }}
  onDrag={({ self }) => {
    expectType<string, typeof self.payload>(self.payload);
  }}
/>;

// `Props` stays keyed on the payloads rather than on an `accept` value, so declaring a
// wrapper's props reads the same as before.
type SlotProps = DropTarget.Root.Props<CardPayload, SlotData>;
const slotValueProps: SlotProps = { accept: card, payload: { index: 0 } };
const slotCallbackProps: SlotProps = { accept: card, getPayload: () => ({ index: 0 }) };
expectType<DropTargetPayload<CardPayload, SlotData>, NonNullable<typeof slotValueProps.payload>>(
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
  return <DropTarget.Root<CardPayload, SlotData> {...props} />;
}
<Slot
  accept={card}
  payload={{ index: 0 }}
  onDrop={({ source, self }) => `${source.payload.id}:${self.payload.index}`}
/>;
