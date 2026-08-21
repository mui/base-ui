import { useDragMonitor } from '@base-ui/react/use-drag-monitor';
import { Draggable } from '@base-ui/react/draggable';
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

// Nothing here runs, but the rules-of-hooks lint reads a bare call as a violation, so
// each case sits in a component.

// `accept` types the drag the callbacks see, with no type argument.
function AcceptsOneKind() {
  useDragMonitor({
    accept: card,
    onDragStart: ({ source }) => expectType<CardPayload, typeof source.payload>(source.payload),
    onDragEnd: ({ source, canceled }) => {
      expectType<CardPayload, typeof source.payload>(source.payload);
      expectType<boolean, typeof canceled>(canceled);
    },
  });
}

// An array of kinds observes each of them, and narrows the payload back down.
function AcceptsTwoKinds() {
  useDragMonitor({
    accept: [card, file],
    onDrag: ({ source }) => {
      expectType<CardPayload | FilePayload, typeof source.payload>(source.payload);
      if (file.matches(source)) {
        expectType<FilePayload, typeof source.payload>(source.payload);
      }
    },
  });
}

// A monitor with no `accept` observes every drag, so its payload is `unknown`.
function AcceptsEverything() {
  useDragMonitor({
    onDragStart: ({ source }) => expectType<unknown, typeof source.payload>(source.payload),
  });
}

function RejectsMismatchedHandler() {
  // @ts-expect-error a handler declaring a payload `accept` doesn't promise is rejected.
  useDragMonitor({ accept: card, onDrag: (event: { source: { payload: FilePayload } }) => event });
}

// `Parameters` is keyed on the observed payload, and still forwards into the hook.
const cardMonitor: useDragMonitor.Parameters<CardPayload> = {
  accept: card,
  onDragEnd: ({ source, dropTarget }) => dropTarget && commit(source.payload.id),
};

function ForwardsDeclaredParameters() {
  useDragMonitor(cardMonitor);
}

export {
  AcceptsOneKind,
  AcceptsTwoKinds,
  AcceptsEverything,
  RejectsMismatchedHandler,
  ForwardsDeclaredParameters,
};
