import { Draggable } from '@base-ui/react/draggable';
import type {
  DraggableAcceptedKind,
  UseDraggableManagerReturnValue,
  DraggableManagerRegisterSourceParameters,
  DraggableManagerRegisterMonitorParameters,
  DraggableManagerRegisterViewportParameters,
  DraggableManagerRegisterTargetParameters,
} from '@base-ui/react/draggable';
import { expectType } from '#test-utils';

// Type-only file. Nothing here runs, so `declare` provides the hook's return type
// without a hook call that the rules-of-hooks lint would flag.
declare const engine: ReturnType<typeof Draggable.useManager>;
expectType<UseDraggableManagerReturnValue, typeof engine>(engine);
expectType<Draggable.useManager.ReturnValue, typeof engine>(engine);
declare const element: HTMLElement;

interface CardPayload {
  id: string;
}

const card = Draggable.createKind<CardPayload>('card');
const marker = Draggable.createKind('marker');
const detailedSlot = Draggable.createKind<{ index: number; label: string }>('detailed-slot');

engine.registerTarget(element, () => ({
  accept: card,
  // @ts-expect-error a target cannot publish incomplete data under a more specific kind.
  kind: detailedSlot,
  payload: { index: 0 },
}));
// @ts-expect-error typed monitor parameters require a runtime filter.
const missingMonitorAccept: DraggableManagerRegisterMonitorParameters<CardPayload> = {};
// @ts-expect-error typed viewport parameters require a runtime filter.
const missingViewportAccept: DraggableManagerRegisterViewportParameters<CardPayload> = {};
// @ts-expect-error explicit accepted-kind generics cannot bypass the runtime filter.
engine.registerMonitor<typeof card>(() => ({}));
// @ts-expect-error explicit accepted-kind generics cannot bypass the runtime filter.
engine.registerViewport<typeof card>(element, () => ({}));
// @ts-expect-error typed drag data requires a runtime filter too.
engine.registerMonitor<Draggable.Kind<unknown, number>>(() => ({}));
// @ts-expect-error typed drag data requires a runtime filter too.
engine.registerViewport<Draggable.Kind<unknown, number>>(element, () => ({}));
// @ts-expect-error typed drag data requires a runtime filter too.
const missingDragDataAccept: DraggableManagerRegisterMonitorParameters<unknown, number> = {};

// The imperative entry point exposes the factories its registration methods
// need, without importing a component namespace.
const engineCard = Draggable.createKind<CardPayload>('engine-card');
const globalItem = Draggable.createGlobalKind('app/item');
expectType<Draggable.Kind<CardPayload, unknown>, typeof engineCard>(engineCard);
expectType<Draggable.Kind<undefined, unknown>, typeof globalItem>(globalItem);
// `anyKind` only fits `accept`, so it is an accepted kind rather than a `Draggable.Kind`.
expectType<Draggable.AcceptedKind<unknown>, typeof Draggable.anyKind>(Draggable.anyKind);
const snapSteps: Draggable.Target.SnapSteps = { x: 4, y: 8 };
const snappedPointOptions: Draggable.Target.SnappedLocalPointOptions = { anchor: 'source' };
expectType<Draggable.Target.SnapSteps, typeof snapSteps>(snapSteps);
expectType<Draggable.Target.SnappedLocalPointOptions, typeof snappedPointOptions>(
  snappedPointOptions,
);

// An observational DraggableAcceptedKind accepts payload-bearing kinds. The factory's
// default remains `undefined`, as asserted by `marker` above.
const observedKind: DraggableAcceptedKind = card;
expectType<DraggableAcceptedKind, typeof observedKind>(observedKind);

// ---------------------------------------------------------------------------
// registerSource
// ---------------------------------------------------------------------------

// The payload type comes from the `kind`, and every event callback on the same
// registration sees it.
engine.registerSource(element, () => ({
  kind: card,
  payload: { id: 'a' },
  onMoveStart: (eventDetails) =>
    expectType<CardPayload, typeof eventDetails.source.payload>(eventDetails.source.payload),
  onMove: (eventDetails) =>
    expectType<CardPayload, typeof eventDetails.source.payload>(eventDetails.source.payload),
  onMoveEnd: (eventDetails) => {
    expectType<CardPayload, typeof eventDetails.source.payload>(eventDetails.source.payload);
    expectType<Draggable.Target.Record | null, typeof eventDetails.target>(eventDetails.target);
    expectType<Draggable.Root.MoveEndEventReason, typeof eventDetails.reason>(eventDetails.reason);
    expectType<Draggable.LocationHistory, typeof eventDetails.location>(eventDetails.location);
  },
}));

// An explicit type argument is used instead of the inferred one.
engine.registerSource<CardPayload>(element, () => ({ kind: card, payload: { id: 'a' } }));

declare const maybeCardPayload: CardPayload | undefined;
// @ts-expect-error a required static payload cannot be explicitly undefined.
engine.registerSource<CardPayload>(element, () => ({ kind: card, payload: undefined }));
// @ts-expect-error a possibly undefined static payload cannot satisfy a required payload.
engine.registerSource<CardPayload>(element, () => ({ kind: card, payload: maybeCardPayload }));

// @ts-expect-error the payload must match an explicit type argument.
engine.registerSource<CardPayload>(element, () => ({ kind: card, payload: { id: 1 } }));

// A handler cannot redeclare the payload type. Checked on the parameters type
// because, in a call, the error would land on the whole argument.
const wrongDrag = (eventDetails: { source: { payload: number } }) => eventDetails;
const wrongParameters: DraggableManagerRegisterSourceParameters<CardPayload> = {
  kind: card,
  payload: { id: 'a' },
  // @ts-expect-error the handler must match the kind's payload.
  onMove: wrongDrag,
};

// A kind declaring no payload leaves it `undefined`, and `payload` may be omitted.
engine.registerSource(element, () => ({
  kind: marker,
  onMoveStart: (eventDetails) =>
    expectType<undefined, typeof eventDetails.source.payload>(eventDetails.source.payload),
}));

// @ts-expect-error every draggable is of some kind.
engine.registerSource(element, () => ({}));

// Every registration method returns a cleanup.
expectType<() => void, ReturnType<typeof engine.registerSource>>(
  engine.registerSource(element, () => ({ kind: marker })),
);

// An explicit `TPayload` threads through `payload` and every source event.
interface MyPayload {
  foo: string;
  count: number;
}
const myPayloadKind = Draggable.createKind<MyPayload>('my-data');
engine.registerSource<MyPayload>(element, () => ({
  kind: myPayloadKind,
  payload: { foo: 'bar', count: 1 },
  onMoveStart: (eventDetails) => {
    expectType<string, typeof eventDetails.source.payload.foo>(eventDetails.source.payload.foo);
    expectType<number, typeof eventDetails.source.payload.count>(eventDetails.source.payload.count);
  },
  onMoveEnd: (eventDetails) => {
    expectType<string, typeof eventDetails.source.payload.foo>(eventDetails.source.payload.foo);
  },
}));

engine.registerSource<MyPayload>(element, () => ({
  kind: myPayloadKind,
  // @ts-expect-error the returned object is missing the required `count`.
  payload: { foo: 'bar' },
}));

// ---------------------------------------------------------------------------
// registerTarget
// ---------------------------------------------------------------------------

const validDropTargetParameters: DraggableManagerRegisterTargetParameters = { accept: card };
expectType<DraggableManagerRegisterTargetParameters, typeof validDropTargetParameters>(
  validDropTargetParameters,
);

// @ts-expect-error every public drop target must declare what it accepts.
const missingAccept: DraggableManagerRegisterTargetParameters = {};

// @ts-expect-error declaring a target payload does not make `accept` optional.
const missingAcceptWithPayload: DraggableManagerRegisterTargetParameters<
  CardPayload,
  { slot: number }
> = { payload: { slot: 1 } };

// @ts-expect-error a declared target payload type makes `payload` required.
const missingTargetPayload: DraggableManagerRegisterTargetParameters<
  CardPayload,
  { slot: number }
> = { accept: card };

// @ts-expect-error a declared source payload type makes `payload` required.
const missingSourcePayload: Draggable.useManager.RegisterSourceParameters<CardPayload> = {
  kind: card,
};

// Options declared ahead of time with the public types are accepted as they are.
const sourceOptions: Draggable.useManager.RegisterSourceParameters<CardPayload> = {
  kind: card,
  payload: { id: 'a' },
};
engine.registerSource(element, () => sourceOptions);

const targetOptions: Draggable.useManager.RegisterTargetParameters<CardPayload, { slot: number }> =
  { accept: card, payload: { slot: 1 } };
expectType<{ slot: number }, typeof targetOptions.payload>(targetOptions.payload);
engine.registerTarget(element, () => targetOptions);

// `accept` types the source it hands the callbacks, with no type argument.
engine.registerTarget(element, () => ({
  accept: card,
  canDrop: ({ source }) => {
    expectType<CardPayload, typeof source.payload>(source.payload);
    return true;
  },
  onDraggableDrop: (eventDetails) => {
    expectType<CardPayload, typeof eventDetails.source.payload>(eventDetails.source.payload);
  },
}));

// Source and local payload types are inferred independently from `accept` and
// `payload`, even though the parameters reach the engine through a getter.
engine.registerTarget(element, () => ({
  accept: card,
  payload: { slot: 1 },
  onDraggableDrop: (eventDetails) => {
    expectType<CardPayload, typeof eventDetails.source.payload>(eventDetails.source.payload);
    expectType<{ slot: number }, typeof eventDetails.currentTarget.payload>(
      eventDetails.currentTarget.payload,
    );
  },
}));

engine.registerTarget(element, () => ({
  accept: card,
  payload: { slot: 0 },
  onDraggableDrop: (eventDetails) => {
    expectType<{ slot: number }, typeof eventDetails.currentTarget.payload>(
      eventDetails.currentTarget.payload,
    );
  },
}));

engine.registerTarget<typeof card, { slot: number }>(element, () => ({
  accept: card,
  payload: { slot: 1 },
  onDraggableDrop: (eventDetails) => {
    expectType<CardPayload, typeof eventDetails.source.payload>(eventDetails.source.payload);
    expectType<{ slot: number }, typeof eventDetails.currentTarget.payload>(
      eventDetails.currentTarget.payload,
    );
  },
}));

// @ts-expect-error a declared target payload type makes `payload` required.
engine.registerTarget<typeof card, { slot: number }>(element, () => ({ accept: card }));

declare const maybeSlotPayload: { slot: number } | undefined;
engine.registerTarget<typeof card, { slot: number }>(element, () => ({
  accept: card,
  // @ts-expect-error a required target payload cannot be explicitly undefined.
  payload: undefined,
}));
engine.registerTarget<typeof card, { slot: number }>(element, () => ({
  accept: card,
  // @ts-expect-error a possibly undefined target payload cannot satisfy a required payload.
  payload: maybeSlotPayload,
}));

engine.registerTarget<typeof card, { slot: number }>(element, () => ({
  accept: card,
  // @ts-expect-error the payload must match the declared target payload type.
  payload: { slot: 'one' },
}));

// An explicit `<typeof kind, TTargetPayload>` pair threads both payloads through every
// target callback, and the local payload must have the declared shape.
interface MySourcePayload {
  kind: 'card';
  id: string;
}
interface MyTargetPayload {
  columnId: string;
}
const mySourceKind = Draggable.createKind<MySourcePayload>('my-source');
engine.registerTarget<typeof mySourceKind, MyTargetPayload>(element, () => ({
  accept: mySourceKind,
  payload: { columnId: 'col-1' },
  canDrop: ({ source }) => {
    expectType<string, typeof source.payload.id>(source.payload.id);
    return true;
  },
  onDraggableDrop: (eventDetails) => {
    expectType<MySourcePayload, typeof eventDetails.source.payload>(eventDetails.source.payload);
    expectType<MyTargetPayload, typeof eventDetails.currentTarget.payload>(
      eventDetails.currentTarget.payload,
    );
  },
  onDraggableEnter: (eventDetails) => {
    expectType<'card', typeof eventDetails.source.payload.kind>(eventDetails.source.payload.kind);
    expectType<string, typeof eventDetails.currentTarget.payload.columnId>(
      eventDetails.currentTarget.payload.columnId,
    );
  },
}));

engine.registerTarget<typeof mySourceKind, MyTargetPayload>(element, () => ({
  accept: mySourceKind,
  // @ts-expect-error the returned object is missing the required `columnId`.
  payload: {},
}));

// ---------------------------------------------------------------------------
// registerMonitor / registerViewport
// ---------------------------------------------------------------------------

// A monitor observes every drag, so it takes only a getter and no element.
engine.registerMonitor(() => ({
  accept: card,
  onMoveStart: (eventDetails) =>
    expectType<CardPayload, typeof eventDetails.source.payload>(eventDetails.source.payload),
}));

// @ts-expect-error `registerMonitor` takes no element.
engine.registerMonitor(element, () => ({}));

// The source payload narrows through a discriminated union of accepted kinds.
interface CardDrag {
  kind: 'card';
  cardId: string;
}
interface ColumnDrag {
  kind: 'column';
  columnId: string;
}
const cardDrag = Draggable.createKind<CardDrag>('card-drag');
const columnDrag = Draggable.createKind<ColumnDrag>('column-drag');
engine.registerMonitor(() => ({
  accept: [cardDrag, columnDrag],
  onMoveEnd: (eventDetails) => {
    const payload = eventDetails.source.payload;
    expectType<CardDrag | ColumnDrag, typeof payload>(payload);
    if (payload.kind === 'card') {
      expectType<string, typeof payload.cardId>(payload.cardId);
    } else {
      expectType<string, typeof payload.columnId>(payload.columnId);
    }
  },
}));

// The accepted kind determines the scroll callback payload.
engine.registerViewport(element, () => ({
  accept: card,
  onDragScroll(eventDetails) {
    expectType<CardPayload, typeof eventDetails.source.payload>(eventDetails.source.payload);
    if (eventDetails.direction === 'horizontal') {
      eventDetails.cancel();
    }
  },
}));

// ---------------------------------------------------------------------------
// cancelDrag
// ---------------------------------------------------------------------------

// The method registers nothing, takes nothing, and returns nothing.
expectType<() => void, typeof engine.cancelDrag>(engine.cancelDrag);

// ---------------------------------------------------------------------------
// Explicit type arguments, kinds and drag data
// ---------------------------------------------------------------------------

engine.registerSource<unknown>(element, () => ({
  // @ts-expect-error an explicit generic must not widen the producer kind.
  kind: card,
  payload: null,
}));

engine.registerTarget<typeof card, unknown>(element, () => ({
  accept: card,
  // @ts-expect-error an explicit generic must not widen the target kind.
  kind: card,
  payload: null,
}));

// @ts-expect-error an observational kind cannot declare a target's payload.
engine.registerTarget<typeof card, unknown, DraggableAcceptedKind>(element, () => ({
  accept: card,
  kind: observedKind,
  payload: null,
}));

declare const extractedDrop: Draggable.Target.DropEventDetails<CardPayload, { index: number }>;
expectType<CardPayload, typeof extractedDrop.source.payload>(extractedDrop.source.payload);
expectType<{ index: number }, typeof extractedDrop.currentTarget.payload>(
  extractedDrop.currentTarget.payload,
);

const dataCard = Draggable.createKind<CardPayload, { offset: number }>('data-card');
const dataSlot = Draggable.createKind<{ slot: number }, { entered: boolean }>('data-slot');
engine.registerTarget(element, () => ({
  accept: dataCard,
  kind: dataSlot,
  payload: { slot: 0 },
  onDraggableEnter: (eventDetails) => {
    expectType<{ offset: number } | undefined, typeof eventDetails.source.dragData>(
      eventDetails.source.dragData,
    );
    expectType<{ entered: boolean } | undefined, typeof eventDetails.currentTarget.dragData>(
      eventDetails.currentTarget.dragData,
    );
    eventDetails.source.updateDragData({ offset: 1 });
    eventDetails.currentTarget.updateDragData({ entered: true });
  },
}));
engine.registerMonitor(() => ({
  accept: dataCard,
  onMove: (eventDetails) => {
    expectType<{ offset: number } | undefined, typeof eventDetails.source.dragData>(
      eventDetails.source.dragData,
    );
  },
}));

const dataOnlyKind = Draggable.createKind<undefined, number>('data-only');
engine.registerSource(element, () => ({
  kind: dataOnlyKind,
  onMove: (eventDetails) => {
    expectType<number | undefined, typeof eventDetails.source.dragData>(
      eventDetails.source.dragData,
    );
  },
}));
engine.registerTarget(element, () => ({
  accept: dataCard,
  kind: dataOnlyKind,
  onDraggableEnter: (eventDetails) => {
    const currentTarget = eventDetails.currentTarget;
    expectType<{ offset: number } | undefined, typeof eventDetails.source.dragData>(
      eventDetails.source.dragData,
    );
    expectType<number | undefined, typeof currentTarget.dragData>(currentTarget.dragData);
    expectType<undefined, typeof currentTarget.payload>(currentTarget.payload);
    currentTarget.updateDragData(1);
    // @ts-expect-error the data-only target still checks its drag data.
    currentTarget.updateDragData('invalid');
    // @ts-expect-error a data-only target cannot acquire a different payload type.
    currentTarget.updatePayload({ slot: 1 });
  },
}));

// @ts-expect-error a target kind with a payload cannot register without one.
engine.registerTarget(element, () => ({ accept: card, kind: detailedSlot }));

// ---------------------------------------------------------------------------
// anyKind
// ---------------------------------------------------------------------------

// `anyKind` accepts every drag as a target's, viewport's, or monitor's `accept`, with
// `source.payload` typed as `unknown`.
engine.registerTarget(element, () => ({
  accept: Draggable.anyKind,
  onDraggableDrop: (eventDetails) =>
    expectType<unknown, typeof eventDetails.source.payload>(eventDetails.source.payload),
}));
engine.registerViewport(element, () => ({
  accept: Draggable.anyKind,
  onDragScroll: (eventDetails) =>
    expectType<unknown, typeof eventDetails.source.payload>(eventDetails.source.payload),
}));
engine.registerMonitor(() => ({
  accept: Draggable.anyKind,
  onMoveStart: (eventDetails) =>
    expectType<unknown, typeof eventDetails.source.payload>(eventDetails.source.payload),
}));

// It only fits `accept`. A source or a target declares the one kind it is.
// @ts-expect-error `anyKind` can't be a source's `kind`.
engine.registerSource(element, () => ({ kind: Draggable.anyKind }));
// @ts-expect-error `anyKind` can't be a target's own `kind`.
engine.registerTarget(element, () => ({ accept: card, kind: Draggable.anyKind }));
