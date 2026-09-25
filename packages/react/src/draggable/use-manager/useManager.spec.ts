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

// Type-only file: nothing here runs, so the hook is never actually called —
// `declare` gives us its return type without tripping the rules-of-hooks lint.
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
engine.registerTarget(element, () => ({
  accept: card,
  // @ts-expect-error the kind requires the complete payload.
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

// The imperative entry point is self-contained: it exposes the factories its
// registration methods require, without importing a component namespace.
const engineCard = Draggable.createKind<CardPayload>('engine-card');
const globalItem = Draggable.createGlobalKind('app/item');
expectType<Draggable.Kind<CardPayload>, typeof engineCard>(engineCard);
expectType<Draggable.Kind<undefined>, typeof globalItem>(globalItem);
expectType<Draggable.Kind<unknown>, typeof Draggable.anyKind>(Draggable.anyKind);
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
  onMoveStart: ({ source }) => expectType<CardPayload, typeof source.payload>(source.payload),
  onMove: ({ source }) => expectType<CardPayload, typeof source.payload>(source.payload),
  onMoveEnd: ({ source, target }, { reason, location }) => {
    expectType<CardPayload, typeof source.payload>(source.payload);
    expectType<Draggable.Target.Record | null, typeof target>(target);
    expectType<Draggable.Root.MoveEndEventReason, typeof reason>(reason);
    expectType<Draggable.LocationHistory, typeof location>(location);
  },
}));

// An explicit type argument is honoured instead of inferred.
engine.registerSource<CardPayload>(element, () => ({ kind: card, payload: { id: 'a' } }));

declare const maybeCardPayload: CardPayload | undefined;
// @ts-expect-error a required static payload cannot be explicitly undefined.
engine.registerSource<CardPayload>(element, () => ({ kind: card, payload: undefined }));
// @ts-expect-error a possibly undefined static payload cannot satisfy a required payload.
engine.registerSource<CardPayload>(element, () => ({ kind: card, payload: maybeCardPayload }));
// @ts-expect-error a required payload getter cannot be explicitly undefined.
engine.registerSource<CardPayload>(element, () => ({ kind: card, getPayload: undefined }));

// @ts-expect-error the payload must match an explicit type argument.
engine.registerSource<CardPayload>(element, () => ({ kind: card, payload: { id: 1 } }));

// A handler cannot redeclare the payload type. Asserted against the parameters type
// rather than through a call: rejecting the handler fails overload resolution, which
// reports against the whole argument instead of the property at fault.
const wrongDrag = (parameters: { source: { payload: number } }) => parameters;
const wrongParameters: DraggableManagerRegisterSourceParameters<CardPayload> = {
  kind: card,
  payload: { id: 'a' },
  // @ts-expect-error the handler must match the kind's payload.
  onMove: wrongDrag,
};

// A kind declaring no payload leaves it `undefined`, and `payload` may be omitted.
engine.registerSource(element, () => ({
  kind: marker,
  onMoveStart: ({ source }) => expectType<undefined, typeof source.payload>(source.payload),
}));

// @ts-expect-error every draggable is of some kind.
engine.registerSource(element, () => ({}));

// Every registration method returns a cleanup.
expectType<() => void, ReturnType<typeof engine.registerSource>>(
  engine.registerSource(element, () => ({ kind: marker })),
);

// An explicit `TPayload` threads through `getPayload` and every source event.
interface MyPayload {
  foo: string;
  count: number;
}
const myPayloadKind = Draggable.createKind<MyPayload>('my-data');
engine.registerSource<MyPayload>(element, () => ({
  kind: myPayloadKind,
  payload: { foo: 'bar', count: 1 },
  onMoveStart: ({ source }) => {
    expectType<string, typeof source.payload.foo>(source.payload.foo);
    expectType<number, typeof source.payload.count>(source.payload.count);
  },
  onMoveEnd: ({ source }) => {
    expectType<string, typeof source.payload.foo>(source.payload.foo);
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
  onDraggableDrop: ({ source }) => {
    expectType<CardPayload, typeof source.payload>(source.payload);
  },
}));

// Source and local payload types are inferred independently from `accept` and
// `payload`, even though the parameters reach the engine through a getter.
engine.registerTarget(element, () => ({
  accept: card,
  payload: { slot: 1 },
  onDraggableDrop: ({ source, target }) => {
    expectType<CardPayload, typeof source.payload>(source.payload);
    expectType<{ slot: number }, typeof target.payload>(target.payload);
  },
}));

engine.registerTarget(element, () => ({
  accept: card,
  payload: { slot: 0 },
  onDraggableDrop: ({ target }) => {
    expectType<{ slot: number }, typeof target.payload>(target.payload);
  },
}));

engine.registerTarget<typeof card, { slot: number }>(element, () => ({
  accept: card,
  payload: { slot: 1 },
  onDraggableDrop: ({ source, target }) => {
    expectType<CardPayload, typeof source.payload>(source.payload);
    expectType<{ slot: number }, typeof target.payload>(target.payload);
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
// @ts-expect-error a required target payload getter cannot be explicitly undefined.
engine.registerTarget<typeof card, { slot: number }>(element, () => ({
  accept: card,
  getPayload: undefined,
}));

engine.registerTarget<typeof card, { slot: number }>(element, () => ({
  accept: card,
  // @ts-expect-error the payload must match the declared target payload type.
  payload: { slot: 'one' },
}));

// An explicit `<typeof kind, TTargetPayload>` pair threads both payloads through every
// target callback, and the local getter must return the declared shape.
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
  onDraggableDrop: ({ source, target }) => {
    expectType<MySourcePayload, typeof source.payload>(source.payload);
    expectType<MyTargetPayload, typeof target.payload>(target.payload);
  },
  onDraggableEnter: ({ source, target }) => {
    expectType<'card', typeof source.payload.kind>(source.payload.kind);
    expectType<string, typeof target.payload.columnId>(target.payload.columnId);
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

// A monitor observes every drag, so it takes a getter only — no element.
engine.registerMonitor(() => ({
  accept: card,
  onMoveStart: ({ source }) => expectType<CardPayload, typeof source.payload>(source.payload),
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
  onMoveEnd: ({ source }) => {
    expectType<CardDrag | ColumnDrag, typeof source.payload>(source.payload);
    if (source.payload.kind === 'card') {
      expectType<string, typeof source.payload.cardId>(source.payload.cardId);
    } else {
      expectType<string, typeof source.payload.columnId>(source.payload.columnId);
    }
  },
}));

// The accepted kind determines the scroll callback payload.
engine.registerViewport(element, () => ({
  accept: card,
  onDragScroll({ source, direction }, eventDetails) {
    expectType<CardPayload, typeof source.payload>(source.payload);
    if (direction === 'horizontal') {
      eventDetails.cancel();
    }
  },
}));

// ---------------------------------------------------------------------------
// cancelDrag
// ---------------------------------------------------------------------------

// The method registers nothing, takes nothing, and returns nothing.
expectType<() => void, typeof engine.cancelDrag>(engine.cancelDrag);

const removedMonitorCallback: DraggableManagerRegisterMonitorParameters = {
  accept: Draggable.anyKind,
  // @ts-expect-error successful drops are handled through onMoveEnd.
  onDrop: () => {},
};
engine.registerMonitor(() => removedMonitorCallback);

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

declare const extractedDrop: Draggable.Target.DropValue<CardPayload, { index: number }>;
expectType<CardPayload, typeof extractedDrop.source.payload>(extractedDrop.source.payload);
expectType<{ index: number }, typeof extractedDrop.target.payload>(extractedDrop.target.payload);

const dataCard = Draggable.createKind<CardPayload, { offset: number }>('data-card');
const dataSlot = Draggable.createKind<{ slot: number }, { entered: boolean }>('data-slot');
engine.registerTarget(element, () => ({
  accept: dataCard,
  kind: dataSlot,
  payload: { slot: 0 },
  onDraggableEnter: ({ source, target }) => {
    expectType<{ offset: number } | undefined, typeof source.dragData>(source.dragData);
    expectType<{ entered: boolean } | undefined, typeof target.dragData>(target.dragData);
    source.updateDragData({ offset: 1 });
    target.updateDragData({ entered: true });
  },
}));
engine.registerMonitor(() => ({
  accept: dataCard,
  onMove: ({ source }) => {
    expectType<{ offset: number } | undefined, typeof source.dragData>(source.dragData);
  },
}));

const dataOnlyKind = Draggable.createKind<undefined, number>('data-only');
engine.registerSource(element, () => ({
  kind: dataOnlyKind,
  onMove: ({ source }) => {
    expectType<number | undefined, typeof source.dragData>(source.dragData);
  },
}));
engine.registerTarget(element, () => ({
  accept: dataCard,
  kind: dataOnlyKind,
  onDraggableEnter: ({ source, target }) => {
    expectType<{ offset: number } | undefined, typeof source.dragData>(source.dragData);
    expectType<number | undefined, typeof target.dragData>(target.dragData);
    expectType<undefined, typeof target.payload>(target.payload);
    target.updateDragData(1);
    // @ts-expect-error the data-only target still checks its drag data.
    target.updateDragData('invalid');
    // @ts-expect-error a data-only target cannot acquire a different payload type.
    target.updatePayload({ slot: 1 });
  },
}));

const removedSourceGetter: Draggable.useManager.RegisterSourceParameters<CardPayload> = {
  kind: card,
  payload: { id: 'a' },
  // @ts-expect-error payload getters are replaced by the source methods.
  getPayload: () => ({ id: 'b' }),
};
engine.registerSource(element, () => ({ ...removedSourceGetter, payload: { id: 'a' } }));
const removedTargetGetter: Draggable.useManager.RegisterTargetParameters<
  CardPayload,
  { slot: number }
> = {
  accept: card,
  payload: { slot: 0 },
  // @ts-expect-error payload getters are replaced by the target methods.
  getPayload: () => ({ slot: 1 }),
};
engine.registerTarget(element, () => ({ ...removedTargetGetter, payload: { slot: 0 } }));

// @ts-expect-error a target kind with a payload cannot register without one.
engine.registerTarget(element, () => ({ accept: card, kind: detailedSlot }));
