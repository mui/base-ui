import { Draggable, type UseDraggableMonitorParameters } from '@base-ui/react/draggable';
import { expectType } from '#test-utils';

interface CardPayload {
  id: string;
}

interface FilePayload {
  mime: string;
}

declare function commit(id: string): void;

const card = Draggable.createKind<CardPayload>('card');
const file = Draggable.createKind<FilePayload>('file');
declare const optionalKind: typeof card | undefined;

// Nothing here runs, but the rules-of-hooks lint reads a bare call as a violation, so
// each case sits in a component.

// `accept` types the drag the callbacks see, with no type argument.
function AcceptsOneKind() {
  Draggable.useMonitor({
    accept: card,
    onMoveStart: ({ source }) => expectType<CardPayload, typeof source.payload>(source.payload),
    onMoveEnd: ({ source, target }, { reason }) => {
      expectType<CardPayload, typeof source.payload>(source.payload);
      expectType<Draggable.Target.Record | null, typeof target>(target);
      expectType<Draggable.Root.MoveEndEventReason, typeof reason>(reason);
    },
  });
}

// An array of kinds observes each of them, and narrows the payload back down.
function AcceptsTwoKinds() {
  Draggable.useMonitor({
    accept: [card, file],
    onMove: ({ source }) => {
      expectType<CardPayload | FilePayload, typeof source.payload>(source.payload);
      if (file.matches(source)) {
        expectType<FilePayload, typeof source.payload>(source.payload);
      }
    },
  });
}

// A monitor with no `accept` observes every drag, so its payload is `unknown`.
function AcceptsEverything() {
  Draggable.useMonitor({
    onMoveStart: ({ source }) => expectType<unknown, typeof source.payload>(source.payload),
  });
  // @ts-expect-error a typed monitor cannot omit its runtime filter.
  Draggable.useMonitor<typeof card>({ onMoveEnd: ({ source }) => commit(source.payload.id) });
  // @ts-expect-error a typed active-drag subscription needs its kind argument.
  Draggable.useActiveDrag<typeof card>();
  const active = Draggable.useActiveDrag(card);
  const activePayload = active?.payload;
  expectType<CardPayload | undefined, typeof activePayload>(activePayload);
  const optionalActive = Draggable.useActiveDrag(optionalKind);
  const optionalPayload = optionalActive?.payload;
  expectType<unknown, typeof optionalPayload>(optionalPayload);
}

// @ts-expect-error extracted typed parameters must also require the runtime filter.
const missingAccept: Draggable.useMonitor.Parameters<CardPayload> = {};

function RejectsMismatchedHandler() {
  Draggable.useMonitor({
    accept: card,
    // @ts-expect-error a handler declaring a payload `accept` doesn't promise is rejected.
    onMove: (event: { source: { payload: FilePayload } }) => event,
  });
}

// `Parameters` is keyed on the observed payload, and still forwards into the hook.
const cardMonitor: Draggable.useMonitor.Parameters<CardPayload> = {
  accept: card,
  onMoveEnd: ({ source, target }) => target && commit(source.payload.id),
};

function ForwardsDeclaredParameters() {
  expectType<UseDraggableMonitorParameters<CardPayload>, typeof cardMonitor>(cardMonitor);
  Draggable.useMonitor(cardMonitor);
}

export {
  AcceptsOneKind,
  AcceptsTwoKinds,
  AcceptsEverything,
  RejectsMismatchedHandler,
  ForwardsDeclaredParameters,
};

const dataCard = Draggable.createKind<CardPayload, { offset: number }>('data-card');
const dataFile = Draggable.createKind<FilePayload, { size: number }>('data-file');
export function ObservesDragData() {
  const active = Draggable.useActiveDrag(dataCard);
  if (active) {
    expectType<{ offset: number } | undefined, typeof active.dragData>(active.dragData);
  }
  Draggable.useMonitor({
    accept: [dataCard, dataFile],
    onMove: ({ source }) => {
      expectType<{ offset: number } | { size: number } | undefined, typeof source.dragData>(
        source.dragData,
      );
      if (dataFile.matches(source)) {
        expectType<{ size: number } | undefined, typeof source.dragData>(source.dragData);
      }
    },
  });
}
