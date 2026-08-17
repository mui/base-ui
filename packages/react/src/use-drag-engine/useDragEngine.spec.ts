import {
  anyKind,
  createGlobalKind,
  createKind,
  useDragEngine,
} from '@base-ui/react/use-drag-engine';
import type {
  RegisterDraggableParameters,
  RegisterDropTargetParameters,
} from '@base-ui/react/use-drag-engine';
import { Draggable } from '@base-ui/react/draggable';
import type { DragKind, DropTargetRecord } from '@base-ui/react/types';
import { expectType } from '#test-utils';

// Type-only file: nothing here runs, so the hook is never actually called —
// `declare` gives us its return type without tripping the rules-of-hooks lint.
declare const engine: ReturnType<typeof useDragEngine>;
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
// cancelDrag / startKeyboardDrag
// ---------------------------------------------------------------------------

// The two methods that register nothing. `cancelDrag` takes nothing and returns
// nothing; `startKeyboardDrag` names the source and reports whether it started.
expectType<() => void, typeof engine.cancelDrag>(engine.cancelDrag);
expectType<(element: HTMLElement | null) => boolean, typeof engine.startKeyboardDrag>(
  engine.startKeyboardDrag,
);

// A ref that has emptied is accepted, so a deferred pickup needs no guard.
const maybeElement: HTMLElement | null = null;
engine.startKeyboardDrag(maybeElement);

// @ts-expect-error the element is required — there is no "whichever is focused" default.
engine.startKeyboardDrag();
