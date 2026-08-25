import {
  anyKind,
  createGlobalKind,
  createKind,
  useDragDropManager,
} from '@base-ui/react/use-drag-drop-manager';
import type {
  RegisterDraggableParameters,
  RegisterDropTargetParameters,
  RegisterDropTargetParametersWithPayload,
} from '@base-ui/react/use-drag-drop-manager';
import { Draggable } from '@base-ui/react/draggable';
import type { DragKind, DropTargetRecord } from '@base-ui/react/types';
import { expectType } from '#test-utils';

// Type-only file: nothing here runs, so the hook is never actually called —
// `declare` gives us its return type without tripping the rules-of-hooks lint.
declare const engine: ReturnType<typeof useDragDropManager>;
declare const element: HTMLElement;

interface CardPayload {
  id: string;
}

const card = Draggable.createKind<CardPayload>('card');
const marker = Draggable.createKind('marker');

// The imperative entry point is self-contained: it exposes the factories its
// registration methods require, without importing a component namespace.
const engineCard = createKind<CardPayload>('engine-card');
const globalItem = createGlobalKind('app/item');
expectType<DragKind<CardPayload>, typeof engineCard>(engineCard);
expectType<DragKind<undefined>, typeof globalItem>(globalItem);
expectType<DragKind<unknown>, typeof anyKind>(anyKind);

// A bare observational DragKind accepts payload-bearing kinds. The factory's
// default remains `undefined`, as asserted by `marker` above.
const observedKind: DragKind = card;
expectType<DragKind, typeof observedKind>(observedKind);

// ---------------------------------------------------------------------------
// registerDraggable
// ---------------------------------------------------------------------------

// The payload type comes from the `kind`, and every event callback on the same
// registration sees it.
engine.registerDraggable(element, () => ({
  kind: card,
  payload: { id: 'a' },
  onDragStart: ({ source }) => expectType<CardPayload, typeof source.payload>(source.payload),
  onDrag: ({ source }) => expectType<CardPayload, typeof source.payload>(source.payload),
  onDragEnd: ({ source, canceled, dropTarget }) => {
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
  onDrag: wrongDrag,
};

// A kind declaring no payload leaves it `undefined`, and `payload` may be omitted.
engine.registerDraggable(element, () => ({
  kind: marker,
  onDragStart: ({ source }) => expectType<undefined, typeof source.payload>(source.payload),
}));

// @ts-expect-error every draggable is of some kind.
engine.registerDraggable(element, () => ({}));

// Every registration method returns a cleanup.
expectType<() => void, ReturnType<typeof engine.registerDraggable>>(
  engine.registerDraggable(element, () => ({ kind: marker })),
);

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
  onDrop: ({ source }) => {
    expectType<CardPayload, typeof source.payload>(source.payload);
  },
}));

// Source and local payload types are inferred independently from `accept` and
// `payload`, even though the parameters reach the engine through a getter.
engine.registerDropTarget(element, () => ({
  accept: card,
  payload: { slot: 1 },
  onDrop: ({ source, self }) => {
    expectType<CardPayload, typeof source.payload>(source.payload);
    expectType<{ slot: number }, typeof self.payload>(self.payload);
  },
}));

engine.registerDropTarget(element, () => ({
  accept: card,
  getPayload: ({ source }) => ({ slot: source.payload.id.length }),
  onDrop: ({ self }) => {
    expectType<{ slot: number }, typeof self.payload>(self.payload);
  },
}));

engine.registerDropTarget<typeof card, { slot: number }>(element, () => ({
  accept: card,
  payload: { slot: 1 },
  onDrop: ({ source, self }) => {
    expectType<CardPayload, typeof source.payload>(source.payload);
    expectType<{ slot: number }, typeof self.payload>(self.payload);
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

// ---------------------------------------------------------------------------
// registerMonitor / registerAutoScroller
// ---------------------------------------------------------------------------

// A monitor observes every drag, so it takes a getter only — no element.
engine.registerMonitor(() => ({
  accept: card,
  onDragStart: ({ source }) => expectType<CardPayload, typeof source.payload>(source.payload),
}));

// @ts-expect-error `registerMonitor` takes no element.
engine.registerMonitor(element, () => ({}));

// Like every other `accept`-taking API, the scroller's payload is typed from
// `accept` rather than asserted with a bare type argument.
engine.registerAutoScroller(element, () => ({
  accept: card,
  allowedAxis: 'vertical',
  canScroll: ({ source }) => {
    expectType<CardPayload, typeof source.payload>(source.payload);
    return true;
  },
}));

// @ts-expect-error `allowedAxis` is a fixed union, not an arbitrary string.
engine.registerAutoScroller(element, () => ({ allowedAxis: 'diagonal' }));

// ---------------------------------------------------------------------------
// cancelDrag
// ---------------------------------------------------------------------------

// The method registers nothing, takes nothing, and returns nothing.
expectType<() => void, typeof engine.cancelDrag>(engine.cancelDrag);
