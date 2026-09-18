import { Draggable } from '@base-ui/react/draggable';
import type {
  RegisterDraggableParameters,
  RegisterMonitorParameters,
  RegisterAutoScrollerParameters,
  RegisterDropTargetParameters,
  RegisterDropTargetParametersWithPayload,
} from '@base-ui/react/draggable';
import type {
  DragKind,
  DragAcceptedKind,
  DragSnappedLocalPointOptions,
  DragSnapSteps,
  DropTargetRecord,
} from '@base-ui/react/types';
import { expectType } from '#test-utils';

// Type-only file: nothing here runs, so the hook is never actually called —
// `declare` gives us its return type without tripping the rules-of-hooks lint.
declare const engine: ReturnType<typeof Draggable.useDragDropManager>;
declare const element: HTMLElement;

interface CardPayload {
  id: string;
}

const card = Draggable.createKind<CardPayload>('card');
const marker = Draggable.createKind('marker');
const detailedSlot = Draggable.createKind<{ index: number; label: string }>('detailed-slot');

engine.registerDropTarget(element, () => ({
  accept: card,
  // @ts-expect-error the producer kind cannot be widened to the incomplete payload.
  kind: detailedSlot,
  // @ts-expect-error a target cannot publish incomplete data under a more specific kind.
  payload: { index: 0 },
}));
engine.registerDropTarget(element, () => ({
  accept: card,
  // @ts-expect-error the producer kind cannot be widened to the incomplete payload.
  kind: detailedSlot,
  // @ts-expect-error resolved target payloads must also contain every field promised by the kind.
  getPayload: () => ({ index: 0 }),
}));
// @ts-expect-error typed monitor parameters require a runtime filter.
const missingMonitorAccept: RegisterMonitorParameters<CardPayload> = {};
// @ts-expect-error typed auto-scroller parameters require a runtime filter.
const missingScrollerAccept: RegisterAutoScrollerParameters<CardPayload> = {};
// @ts-expect-error explicit accepted-kind generics cannot bypass the runtime filter.
engine.registerMonitor<typeof card>(() => ({}));
// @ts-expect-error explicit accepted-kind generics cannot bypass the runtime filter.
engine.registerAutoScroller<typeof card>(element, () => ({}));

// The imperative entry point is self-contained: it exposes the factories its
// registration methods require, without importing a component namespace.
const engineCard = Draggable.createKind<CardPayload>('engine-card');
const globalItem = Draggable.createGlobalKind('app/item');
expectType<DragKind<CardPayload>, typeof engineCard>(engineCard);
expectType<DragKind<undefined>, typeof globalItem>(globalItem);
expectType<DragKind<unknown>, typeof Draggable.anyKind>(Draggable.anyKind);
const snapSteps: DragSnapSteps = { x: 4, y: 8 };
const snappedPointOptions: DragSnappedLocalPointOptions = { anchor: 'source' };
expectType<DragSnapSteps, typeof snapSteps>(snapSteps);
expectType<DragSnappedLocalPointOptions, typeof snappedPointOptions>(snappedPointOptions);

// An observational DragAcceptedKind accepts payload-bearing kinds. The factory's
// default remains `undefined`, as asserted by `marker` above.
const observedKind: DragAcceptedKind = card;
expectType<DragAcceptedKind, typeof observedKind>(observedKind);

// ---------------------------------------------------------------------------
// registerDraggable
// ---------------------------------------------------------------------------

// The payload type comes from the `kind`, and every event callback on the same
// registration sees it.
engine.registerDraggable(element, () => ({
  kind: card,
  payload: { id: 'a' },
  onMoveStart: ({ source }) => expectType<CardPayload, typeof source.payload>(source.payload),
  onMove: ({ source }) => expectType<CardPayload, typeof source.payload>(source.payload),
  onMoveEnd: ({ source, canceled, dropTarget }) => {
    expectType<CardPayload, typeof source.payload>(source.payload);
    expectType<boolean, typeof canceled>(canceled);
    expectType<DropTargetRecord | null, typeof dropTarget>(dropTarget);
  },
}));

// An explicit type argument is honoured instead of inferred.
engine.registerDraggable<CardPayload>(element, () => ({ kind: card, payload: { id: 'a' } }));

declare const maybeCardPayload: CardPayload | undefined;
// @ts-expect-error a required static payload cannot be explicitly undefined.
engine.registerDraggable<CardPayload>(element, () => ({ kind: card, payload: undefined }));
// @ts-expect-error a possibly undefined static payload cannot satisfy a required payload.
engine.registerDraggable<CardPayload>(element, () => ({ kind: card, payload: maybeCardPayload }));
// @ts-expect-error a required payload getter cannot be explicitly undefined.
engine.registerDraggable<CardPayload>(element, () => ({ kind: card, getPayload: undefined }));

// @ts-expect-error the payload must match an explicit type argument.
engine.registerDraggable<CardPayload>(element, () => ({ kind: card, payload: { id: 1 } }));

// A handler cannot redeclare the payload type. Asserted against the parameters type
// rather than through a call: rejecting the handler fails overload resolution, which
// reports against the whole argument instead of the property at fault.
const wrongDrag = (parameters: { source: { payload: number } }) => parameters;
const wrongParameters: RegisterDraggableParameters<CardPayload> = {
  kind: card,
  payload: { id: 'a' },
  // @ts-expect-error the handler must match the kind's payload.
  onMove: wrongDrag,
};

// A kind declaring no payload leaves it `undefined`, and `payload` may be omitted.
engine.registerDraggable(element, () => ({
  kind: marker,
  onMoveStart: ({ source }) => expectType<undefined, typeof source.payload>(source.payload),
}));

// @ts-expect-error every draggable is of some kind.
engine.registerDraggable(element, () => ({}));

// Every registration method returns a cleanup.
expectType<() => void, ReturnType<typeof engine.registerDraggable>>(
  engine.registerDraggable(element, () => ({ kind: marker })),
);

// An explicit `TData` threads through `getPayload` and every source event.
interface MyData {
  foo: string;
  count: number;
}
const myDataKind = Draggable.createKind<MyData>('my-data');
engine.registerDraggable<MyData>(element, () => ({
  kind: myDataKind,
  getPayload: () => ({ foo: 'bar', count: 1 }),
  onMoveStart: ({ source }) => {
    expectType<string, typeof source.payload.foo>(source.payload.foo);
    expectType<number, typeof source.payload.count>(source.payload.count);
  },
  onMoveEnd: ({ source }) => {
    expectType<string, typeof source.payload.foo>(source.payload.foo);
  },
}));

engine.registerDraggable<MyData>(element, () => ({
  kind: myDataKind,
  // @ts-expect-error the returned object is missing the required `count`.
  getPayload: () => ({ foo: 'bar' }),
}));

// ---------------------------------------------------------------------------
// registerDropTarget
// ---------------------------------------------------------------------------

const validDropTargetParameters: RegisterDropTargetParameters = { accept: card };
expectType<RegisterDropTargetParameters, typeof validDropTargetParameters>(
  validDropTargetParameters,
);

// @ts-expect-error every public drop target must declare what it accepts.
const missingAccept: RegisterDropTargetParameters = {};

const validDropTargetWithPayload: RegisterDropTargetParametersWithPayload<
  CardPayload,
  { slot: number }
> = { accept: card, payload: { slot: 1 } };
expectType<{ slot: number }, typeof validDropTargetWithPayload.payload>(
  validDropTargetWithPayload.payload,
);

// @ts-expect-error adding a local payload does not make `accept` optional.
const missingAcceptWithPayload: RegisterDropTargetParametersWithPayload<
  CardPayload,
  { slot: number }
> = { payload: { slot: 1 } };

// `accept` types the source it hands the callbacks, with no type argument.
engine.registerDropTarget(element, () => ({
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
engine.registerDropTarget(element, () => ({
  accept: card,
  payload: { slot: 1 },
  onDraggableDrop: ({ source, target }) => {
    expectType<CardPayload, typeof source.payload>(source.payload);
    expectType<{ slot: number }, typeof target.payload>(target.payload);
  },
}));

engine.registerDropTarget(element, () => ({
  accept: card,
  getPayload: ({ source }) => ({ slot: source.payload.id.length }),
  onDraggableDrop: ({ target }) => {
    expectType<{ slot: number }, typeof target.payload>(target.payload);
  },
}));

engine.registerDropTarget<typeof card, { slot: number }>(element, () => ({
  accept: card,
  payload: { slot: 1 },
  onDraggableDrop: ({ source, target }) => {
    expectType<CardPayload, typeof source.payload>(source.payload);
    expectType<{ slot: number }, typeof target.payload>(target.payload);
  },
}));

// @ts-expect-error a declared local-data type makes `payload` required.
engine.registerDropTarget<typeof card, { slot: number }>(element, () => ({ accept: card }));

declare const maybeSlotPayload: { slot: number } | undefined;
// @ts-expect-error a required target payload cannot be explicitly undefined.
engine.registerDropTarget<typeof card, { slot: number }>(element, () => ({
  accept: card,
  payload: undefined,
}));
// @ts-expect-error a possibly undefined target payload cannot satisfy a required payload.
engine.registerDropTarget<typeof card, { slot: number }>(element, () => ({
  accept: card,
  payload: maybeSlotPayload,
}));
// @ts-expect-error a required target payload getter cannot be explicitly undefined.
engine.registerDropTarget<typeof card, { slot: number }>(element, () => ({
  accept: card,
  getPayload: undefined,
}));

engine.registerDropTarget<typeof card, { slot: number }>(element, () => ({
  accept: card,
  // @ts-expect-error the payload must match the declared local-data type.
  payload: { slot: 'one' },
}));

// An explicit `<typeof kind, TLocalData>` pair threads both payloads through every
// target callback, and the local getter must return the declared shape.
interface MySourceData {
  kind: 'card';
  id: string;
}
interface MyLocalData {
  columnId: string;
}
const mySourceKind = Draggable.createKind<MySourceData>('my-source');
engine.registerDropTarget<typeof mySourceKind, MyLocalData>(element, () => ({
  accept: mySourceKind,
  getPayload: () => ({ columnId: 'col-1' }),
  canDrop: ({ source }) => {
    expectType<string, typeof source.payload.id>(source.payload.id);
    return true;
  },
  onDraggableDrop: ({ source, target }) => {
    expectType<MySourceData, typeof source.payload>(source.payload);
    expectType<MyLocalData, typeof target.payload>(target.payload);
  },
  onDraggableEnter: ({ source, target }) => {
    expectType<'card', typeof source.payload.kind>(source.payload.kind);
    expectType<string, typeof target.payload.columnId>(target.payload.columnId);
  },
}));

engine.registerDropTarget<typeof mySourceKind, MyLocalData>(element, () => ({
  accept: mySourceKind,
  // @ts-expect-error the returned object is missing the required `columnId`.
  getPayload: () => ({}),
}));

// ---------------------------------------------------------------------------
// registerMonitor / registerAutoScroller
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
engine.registerAutoScroller(element, () => ({
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

const removedMonitorCallback: RegisterMonitorParameters = {
  accept: Draggable.anyKind,
  // @ts-expect-error successful drops are handled through onMoveEnd.
  onDrop: () => {},
};
engine.registerMonitor(() => removedMonitorCallback);

engine.registerDraggable<unknown>(element, () => ({
  // @ts-expect-error an explicit generic must not widen the producer kind.
  kind: card,
  payload: null,
}));

engine.registerDropTarget<typeof card, unknown>(element, () => ({
  accept: card,
  // @ts-expect-error an explicit generic must not widen the target kind.
  kind: card,
  payload: null,
}));

// @ts-expect-error an observational kind cannot declare a target's payload.
engine.registerDropTarget<typeof card, unknown, Draggable.DragAcceptedKind>(element, () => ({
  accept: card,
  kind: observedKind,
  payload: null,
}));
