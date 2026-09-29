import * as React from 'react';
import { expectType } from '#test-utils';
import type {
  DraggableTargetDropEventDetails,
  DraggableTargetRecord,
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
// @ts-expect-error heterogeneous accepted kinds do not weaken the target's own payload contract.
<Draggable.Target accept={[card, file]} kind={detailedSlot} payload={{ index: 0 }} />;
<Draggable.Target
  accept={[card, file]}
  kind={detailedSlot}
  payload={{ index: 0, label: 'Inbox' }}
  onDraggableDrop={(eventDetails) => {
    expectType<string, typeof eventDetails.currentTarget.payload.label>(
      eventDetails.currentTarget.payload.label,
    );
  }}
/>;

// An omitted accept matches only the nearest provider default kind.
<Draggable.Target
  onDraggableDrop={(eventDetails) => {
    expectType<undefined, typeof eventDetails.source.payload>(eventDetails.source.payload);
  }}
/>;

function DefaultKindTarget(props: Draggable.Target.Props) {
  return <Draggable.Target {...props} />;
}
<DefaultKindTarget />;

// The catch-all is the explicit opt-in. It leaves `source.payload` as `unknown`,
// since nothing declares what this target receives.
<Draggable.Target
  accept={Draggable.anyKind}
  onDraggableDrop={(eventDetails) => {
    expectType<unknown, typeof eventDetails.source.payload>(eventDetails.source.payload);
  }}
/>;

// A value payload types `target.payload`, with no type argument.
<Draggable.Target
  accept={Draggable.anyKind}
  payload={{ index: 0 }}
  onDraggableDrop={(eventDetails) => {
    expectType<{ index: number }, typeof eventDetails.currentTarget.payload>(
      eventDetails.currentTarget.payload,
    );
  }}
/>;

// The payload need not be an object.
<Draggable.Target
  accept={Draggable.anyKind}
  payload="inbox"
  onDraggableDrop={(eventDetails) => {
    expectType<string, typeof eventDetails.currentTarget.payload>(
      eventDetails.currentTarget.payload,
    );
  }}
/>;

const targetCommand = () => 'run';
<Draggable.Target
  accept={Draggable.anyKind}
  payload={targetCommand}
  onDraggableDrop={(eventDetails) => {
    expectType<typeof targetCommand, typeof eventDetails.currentTarget.payload>(
      eventDetails.currentTarget.payload,
    );
  }}
/>;

// `accept` types every event that carries the source, with no type argument.
<Draggable.Target
  accept={card}
  onDraggableDrop={(eventDetails) => {
    expectType<CardPayload, typeof eventDetails.source.payload>(eventDetails.source.payload);
  }}
/>;

// `accept` and `payload` are separate inference sites, so one target types both the
// dragged item's payload and its own.
<Draggable.Target
  accept={card}
  payload={{ index: 0 }}
  onDraggableDrop={(eventDetails) => {
    expectType<CardPayload, typeof eventDetails.source.payload>(eventDetails.source.payload);
    expectType<{ index: number }, typeof eventDetails.currentTarget.payload>(
      eventDetails.currentTarget.payload,
    );
  }}
/>;

// An array of kinds types the source as the union of their payloads, and each kind
// narrows it back down. The negative branch keeps the union, because `matches` can
// confirm a kind but not rule the others out. A second `matches` narrows the rest.
<Draggable.Target
  accept={[task, file]}
  onDraggableDrop={(eventDetails) => {
    const source = eventDetails.source;
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
  onDraggableDrop={(eventDetails) => {
    const source = eventDetails.source;
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
  onDraggableDrop={(eventDetails: Draggable.Target.DropEventDetails<TaskPayload>) => eventDetails}
/>;

// A target's own `kind` identifies it on its records. It is checked against `payload`
// rather than inferred from, so `payload` stays the one source of `target.payload`.
<Draggable.Target accept={Draggable.anyKind} kind={slot} payload={{ index: 0 }} />;
<Draggable.Target accept={Draggable.anyKind} kind={divider} />;

// @ts-expect-error the kind's payload type must match this target's `payload`.
<Draggable.Target accept={Draggable.anyKind} kind={slot} payload={{ nope: true }} />;

// @ts-expect-error a payload-carrying kind can't register without a `payload`.
// `slot.matches(target)` would narrow to a payload the engine delivers as `undefined`.
<Draggable.Target accept={Draggable.anyKind} kind={slot} />;

// `anyKind` only fits `accept`. A target declares the one kind it is.
// @ts-expect-error `anyKind` can't be a target's own `kind`.
<Draggable.Target accept={card} kind={Draggable.anyKind} />;

// `currentTarget` is the target running the handler. `target` is the innermost target
// under the pointer, this one or one nested inside it, so its payload is `unknown`
// until a kind narrows it.
<Draggable.Target
  accept={card}
  kind={slot}
  payload={{ index: 0 }}
  onDraggableMove={(eventDetails) => {
    expectType<DraggableTargetRecord<SlotPayload>, typeof eventDetails.currentTarget>(
      eventDetails.currentTarget,
    );
    expectType<DraggableTargetRecord, typeof eventDetails.target>(eventDetails.target);
    if (detailedSlot.matches(eventDetails.target)) {
      expectType<{ index: number; label: string }, typeof eventDetails.target.payload>(
        eventDetails.target.payload,
      );
    }
  }}
  onDraggableDrop={(eventDetails) => {
    expectType<DraggableTargetRecord, typeof eventDetails.target>(eventDetails.target);
  }}
  onDraggableLeave={(eventDetails) => {
    expectType<DraggableTargetRecord<SlotPayload>, typeof eventDetails.currentTarget>(
      eventDetails.currentTarget,
    );
    // No target may remain under the pointer once the drag has left this one.
    expectType<DraggableTargetRecord | null, typeof eventDetails.target>(eventDetails.target);
  }}
/>;

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
  onDraggableDrop={(eventDetails) => {
    expectType<CardPayload, typeof eventDetails.source.payload>(eventDetails.source.payload);
    expectType<SlotPayload, typeof eventDetails.currentTarget.payload>(
      eventDetails.currentTarget.payload,
    );
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

// @ts-expect-error the payload must match the explicit type argument.
<Draggable.Target<CardPayload, SlotPayload> accept={card} payload={{ index: 'first' }} />;

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
  onDraggableDrop={(eventDetails) => {
    expectType<CardPayload, typeof eventDetails.source.payload>(eventDetails.source.payload);
    expectType<number, typeof eventDetails.location.current.input.clientX>(
      eventDetails.location.current.input.clientX,
    );
  }}
/>;

// One element, both roles: the drop target composes onto the drag source.
<Draggable.Root
  kind={card}
  payload={{ id: 'a' }}
  render={<Draggable.Target accept={card} payload={{ index: 0 }} />}
/>;

// `payload` is the only thing `TTargetPayload` is inferred from. An inline handler is
// context-sensitive and contributes no candidates, but an extracted one does.
// Without `NoInfer` on the handlers, `TTargetPayload` here would come out as
// `{ other: boolean }`, and the mismatch would be reported against `payload`
// instead of against the handler that caused it.
const mismatchedDrop = (
  eventDetails: DraggableTargetDropEventDetails<unknown, { other: boolean }>,
) => eventDetails;
<Draggable.Target
  accept={Draggable.anyKind}
  // @ts-expect-error the handler must match the payload, not redefine it.
  payload={{ index: 0 }}
  // @ts-expect-error the handler must match the payload, not redefine it.
  onDraggableDrop={mismatchedDrop}
/>;

// A wider handler still accepts the inferred payload.
const wideDrop = (eventDetails: Draggable.Target.DropEventDetails<unknown, unknown>) =>
  eventDetails;
<Draggable.Target
  accept={Draggable.anyKind}
  payload="inbox"
  onDraggableDrop={(eventDetails) => {
    wideDrop(eventDetails);
    expectType<string, typeof eventDetails.currentTarget.payload>(
      eventDetails.currentTarget.payload,
    );
  }}
  onDraggableMove={(eventDetails) => {
    expectType<string, typeof eventDetails.currentTarget.payload>(
      eventDetails.currentTarget.payload,
    );
  }}
/>;

// `Props` is keyed on the payload types rather than on an `accept` value, so a wrapper
// declares its props with two type arguments.
type SlotProps = Draggable.Target.Props<CardPayload, SlotPayload>;
const slotValueProps: SlotProps = { accept: card, payload: { index: 0 } };
expectType<SlotPayload, NonNullable<typeof slotValueProps.payload>>(slotValueProps.payload!);

// @ts-expect-error `Props` mirrors the component, so a declared `TTargetPayload` requires a payload.
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
  onDraggableDrop={(eventDetails) =>
    `${eventDetails.source.payload.id}:${eventDetails.currentTarget.payload.index}`
  }
/>;

// @ts-expect-error target stack changes are observed on a source or monitor.
<Draggable.Target onTargetChange={() => {}} />;

const dragCard = Draggable.createKind<CardPayload, { offset: number }>('drag-card');
const dragSlot = Draggable.createKind<SlotPayload, { entered: boolean }>('drag-slot');
<Draggable.Target
  accept={dragCard}
  kind={dragSlot}
  payload={{ index: 0 }}
  onDraggableEnter={(eventDetails) => {
    expectType<{ offset: number } | undefined, typeof eventDetails.source.dragData>(
      eventDetails.source.dragData,
    );
    expectType<{ entered: boolean } | undefined, typeof eventDetails.currentTarget.dragData>(
      eventDetails.currentTarget.dragData,
    );
    eventDetails.currentTarget.updatePayload({ index: 1 });
    eventDetails.currentTarget.updateDragData({ entered: true });
    // @ts-expect-error the target has its own drag data type.
    eventDetails.currentTarget.updateDragData({ offset: 1 });
    // @ts-expect-error the target keeps its payload type.
    eventDetails.currentTarget.updatePayload({ id: 'a' });
  }}
/>;

const dataOnlyTarget = Draggable.createKind<undefined, number>('data-only-target');
<Draggable.Target
  kind={dataOnlyTarget}
  onDraggableEnter={(eventDetails) => {
    expectType<number | undefined, typeof eventDetails.currentTarget.dragData>(
      eventDetails.currentTarget.dragData,
    );
  }}
/>;

const dragFile = Draggable.createKind<AttachmentPayload, { size: number }>('drag-file');
<Draggable.Target
  accept={[dragCard, dragFile]}
  kind={dragSlot}
  payload={{ index: 0 }}
  onDraggableEnter={(eventDetails) => {
    const source = eventDetails.source;
    const data: { offset: number } | { size: number } | undefined = source.dragData;
    source.updateDragData({ offset: 1 });
    source.updateDragData({ size: 1 });
    // @ts-expect-error accepted source drag data excludes unrelated values.
    source.updateDragData({ entered: true });
    void data;
    expectType<{ entered: boolean } | undefined, typeof eventDetails.currentTarget.dragData>(
      eventDetails.currentTarget.dragData,
    );
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
  onDraggableDrop={(eventDetails) =>
    eventDetails.source.payload.id + eventDetails.currentTarget.payload.name
  }
/>;

function SourceOnlySlot<Source>(
  props: Draggable.Target.Props<Source> & { accept: Draggable.Accept<Source> },
) {
  return <Draggable.Target {...props} />;
}
<SourceOnlySlot
  accept={wrapperTask}
  onDraggableDrop={(eventDetails) => eventDetails.source.payload.id}
/>;
