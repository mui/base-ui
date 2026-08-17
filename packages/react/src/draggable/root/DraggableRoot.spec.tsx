import * as React from 'react';
import { expectType } from '#test-utils';
import type {
  DraggablePayload,
  DraggablePayloadGetter,
  DragEndReason,
  DragKind,
  DragSource,
  DragStartEvent,
  DropTargetRecord,
} from '@base-ui/react/draggable';
import { Draggable } from '@base-ui/react/draggable';

interface CardPayload {
  id: string;
}

const card = Draggable.createKind<CardPayload>('card');
const globalCard = Draggable.createGlobalKind<CardPayload>('myapp/card');
const marker = Draggable.createKind('marker');
const text = Draggable.createKind<string>('text');

// The payload type is declared on the kind, and defaults to `undefined`.
expectType<DragKind<CardPayload>, typeof card>(card);
expectType<DragKind<CardPayload>, typeof globalCard>(globalCard);
expectType<DragKind<undefined>, typeof marker>(marker);

// A kind with no payload type: the bare form compiles, and the engine delivers `undefined`.
<Draggable.Root kind={marker} />;

<Draggable.Root
  kind={marker}
  onDragStart={({ source }) => {
    expectType<undefined, typeof source.payload>(source.payload);
  }}
/>;

// @ts-expect-error every draggable is of some kind.
<Draggable.Root />;

// The kind types every event that carries the payload, with no type argument.
<Draggable.Root
  kind={card}
  payload={{ id: 'a' }}
  onDragStart={({ source }) => {
    expectType<CardPayload, typeof source.payload>(source.payload);
  }}
/>;

// A payload resolver is checked against the kind rather than inferred from.
<Draggable.Root
  kind={card}
  getPayload={() => ({ id: 'a' })}
  onDragStart={({ source }) => {
    expectType<CardPayload, typeof source.payload>(source.payload);
  }}
/>;

// The payload need not be an object.
<Draggable.Root
  kind={text}
  payload="card-1"
  onDragStart={({ source }) => {
    expectType<string, typeof source.payload>(source.payload);
  }}
/>;

// The callback sees the gesture it is deriving the payload from.
const grabOffset = Draggable.createKind<{ x: number }>('grab-offset');
<Draggable.Root
  kind={grabOffset}
  getPayload={({ input, element }) => ({ x: input.clientX - element.getBoundingClientRect().left })}
  onDragStart={({ source }) => {
    expectType<{ x: number }, typeof source.payload>(source.payload);
  }}
/>;

// An explicit type argument still overrides inference, and the kind must agree with it.
<Draggable.Root<CardPayload>
  kind={card}
  payload={{ id: 'a' }}
  onDragStart={({ source }) => {
    expectType<CardPayload, typeof source.payload>(source.payload);
  }}
/>;

// @ts-expect-error the kind must carry the explicit type argument's payload.
<Draggable.Root<CardPayload> kind={text} payload={{ id: 'a' }} />;

// Function-valued payloads stay data rather than being invoked as resolvers.
const command = Draggable.createKind<() => void>('command');
const runCommand = () => {};
<Draggable.Root
  kind={command}
  payload={runCommand}
  onDragStart={({ source }) => {
    expectType<() => void, typeof source.payload>(source.payload);
  }}
/>;

// @ts-expect-error a kind that declares a payload makes `payload` required, so the
// engine can never emit `undefined` where a `CardPayload` was promised.
<Draggable.Root kind={card} />;

// @ts-expect-error the payload must match the kind.
<Draggable.Root kind={card} payload={{ id: 1 }} />;

// @ts-expect-error the callback's return type must match it too.
<Draggable.Root kind={card} getPayload={() => ({ id: 1 })} />;

// @ts-expect-error excess properties are still caught against the kind's payload.
<Draggable.Root kind={card} payload={{ id: 'a', extra: 1 }} />;

// @ts-expect-error a kind with no payload type takes no payload.
<Draggable.Root kind={marker} payload={{ id: 'a' }} />;

// A local kind is unique even when another declaration uses the same name, and
// each declaration independently pins its own payload type.
const foreignCard = Draggable.createKind<{ index: number }>('card');
// @ts-expect-error this `card` carries a different payload than the one used here.
<Draggable.Root kind={foreignCard} payload={{ id: 'a' }} />;

// `kind` is the only thing `TData` is inferred from: an extracted handler declaring a
// different payload type is rejected rather than redefining it.
const mismatchedHandler = (parameters: DragStartEvent<{ index: number }>) => parameters;
// @ts-expect-error the handler must match the kind's payload, not redefine it.
<Draggable.Root kind={card} payload={{ id: 'a' }} onDragStart={mismatchedHandler} />;

// A wider handler still accepts the kind's payload.
const looseCard = Draggable.createKind<{ id: string }>('loose-card');
const wideHandler = (parameters: DragStartEvent<Record<string, unknown>>) => parameters;
<Draggable.Root
  kind={looseCard}
  payload={{ id: 'a' }}
  onDragStart={wideHandler}
  onDrag={({ source }) => {
    expectType<{ id: string }, typeof source.payload>(source.payload);
  }}
/>;

// `matches` narrows a source whose payload isn't known, which is what a target or
// monitor that accepts several kinds hands out.
declare const untypedSource: DragSource<unknown>;
if (card.matches(untypedSource)) {
  expectType<CardPayload, typeof untypedSource.payload>(untypedSource.payload);
}

<Draggable.Root
  kind={marker}
  className={(state) => {
    expectType<boolean, typeof state.dragging>(state.dragging);
    return '';
  }}
/>;

// `dragPreview` is the imperative escape hatch; a component describes its preview
// with a preview part.
// @ts-expect-error
<Draggable.Root kind={marker} dragPreview={{ offset: 'pointer' }} />;

// Without a kind, the preview stays payload-agnostic and narrows at the use site.
<Draggable.Root kind={card} payload={{ id: 'a' }}>
  <Draggable.Preview>
    {({ source }) => {
      expectType<unknown, typeof source.payload>(source.payload);
      return (source.payload as CardPayload).id;
    }}
  </Draggable.Preview>
</Draggable.Root>;

// A kind is the payload-aware escape hatch. It types the callback and is also
// checked against the active source before the callback runs.
<Draggable.Root kind={card} payload={{ id: 'a' }}>
  <Draggable.Preview kind={card}>
    {({ source }) => {
      expectType<CardPayload, typeof source.payload>(source.payload);
      return source.payload.id;
    }}
  </Draggable.Preview>
</Draggable.Root>;

<Draggable.Root kind={card} payload={{ id: 'a' }}>
  {/* @ts-expect-error the explicit payload type must agree with the preview kind. */}
  <Draggable.Preview<CardPayload> kind={text}>Preview</Draggable.Preview>
</Draggable.Root>;

const boundaryRef: React.RefObject<HTMLDivElement | null> = { current: null };

<Draggable.Root kind={marker}>
  <Draggable.ClonedPreview
    offset="pointer"
    modifiers={Draggable.restrictToElement(boundaryRef)}
    disabled
  />
</Draggable.Root>;

<Draggable.Root kind={marker}>
  <Draggable.Preview
    offset={{ x: 1, y: 2 }}
    modifiers={Draggable.restrictToElement(boundaryRef)}
    disabled
  >
    <span />
  </Draggable.Preview>
</Draggable.Root>;

// `container` moves the preview's element only; the React tree rendering the
// content is the provider's, so a part keeps its context wherever it is injected.
<Draggable.Root kind={marker}>
  <Draggable.ClonedPreview container={boundaryRef} />
</Draggable.Root>;

<Draggable.Root kind={marker}>
  <Draggable.Preview container={boundaryRef}>
    <span />
  </Draggable.Preview>
</Draggable.Root>;

// Every `container` form, including the callback that resolves it from the source.
<Draggable.Root kind={marker}>
  <Draggable.Preview container={(source) => source.closest('div')}>
    <span />
  </Draggable.Preview>
</Draggable.Root>;

<Draggable.PreviewProvider container={(source) => source.closest('div')}>
  <Draggable.Root kind={marker} />
</Draggable.PreviewProvider>;

// The clone is engine-built, so the part that configures it renders no element:
// no rendering props, and no content of its own.
<Draggable.Root kind={marker}>
  {/* @ts-expect-error */}
  <Draggable.ClonedPreview className="Ghost" />
</Draggable.Root>;

<Draggable.Root kind={marker}>
  {/* @ts-expect-error */}
  <Draggable.ClonedPreview render={<span />} />
</Draggable.Root>;

<Draggable.Root kind={marker}>
  {/* @ts-expect-error */}
  <Draggable.ClonedPreview>x</Draggable.ClonedPreview>
</Draggable.Root>;

const ref: React.Ref<HTMLDivElement> = null;
<Draggable.Root kind={marker} ref={ref} />;

// Static and resolved payloads use distinct fields.
type CardProps = Draggable.Root.Props<CardPayload>;
const cardValueProps: CardProps = { kind: card, payload: { id: 'a' } };
const cardCallbackProps: CardProps = { kind: card, getPayload: () => ({ id: 'a' }) };
expectType<DraggablePayload<CardPayload>, NonNullable<typeof cardValueProps.payload>>(
  cardValueProps.payload!,
);
expectType<DraggablePayloadGetter<CardPayload>, NonNullable<typeof cardCallbackProps.getPayload>>(
  cardCallbackProps.getPayload!,
);

// @ts-expect-error `Props` mirrors the component: a declared `TData` requires a payload.
const cardMissingProps: CardProps = { kind: card };

// @ts-expect-error and it requires the kind that carries it.
const cardMissingKind: CardProps = { payload: { id: 'a' } };

// A wrapper forwarding these props satisfies the component's overloads.
function Card(props: CardProps) {
  return <Draggable.Root {...props} />;
}
<Card kind={card} payload={{ id: 'a' }} onDragStart={({ source }) => source.payload.id} />;

// A generic wrapper has to spell out the requirement itself: with `TData` still
// open, the one in `Props` is a deferred conditional the overloads can't see through.
function GenericCard<TData>(
  props: Draggable.Root.Props<TData> & { payload: DraggablePayload<TData> },
) {
  return <Draggable.Root {...props} />;
}
<GenericCard kind={card} payload={{ id: 'a' }} />;

// `keyboardMovement` sees the typed payload and accepts every result kind of
// its union: a position, an element, the suggestion, `null`, and `undefined`.
<Draggable.Root
  kind={card}
  payload={{ id: 'a' }}
  keyboardMovement={({ key, position, source, suggestion }) => {
    expectType<CardPayload, typeof source.payload>(source.payload);
    switch (key) {
      case 'ArrowUp':
        return { x: position.x, y: position.y - 15 };
      case 'ArrowDown':
        return suggestion.type === 'target' ? suggestion.element : null;
      case 'ArrowLeft':
        return suggestion;
      default:
        return undefined;
    }
  }}
/>;

// The preset is assignable regardless of the payload type.
<Draggable.Root
  kind={card}
  payload={{ id: 'a' }}
  keyboardMovement={Draggable.targetsOnlyKeyboardMovement}
/>;
<Draggable.Root kind={marker} keyboardMovement={Draggable.targetsOnlyKeyboardMovement} />;

// The native HTML5 drag props are omitted on purpose: the engine's `onDragStart`
// / `onDrag` / `onDragEnd` take their names, and the rest would compile but never
// fire for an engine drag. Pinned negatively so a future props merge can't
// silently re-expose them alongside the synthetic API.
// @ts-expect-error `draggable` starts a native drag that fights the pointer sensor.
<Draggable.Root kind={marker} draggable />;
// @ts-expect-error native capture-phase drag handlers never fire for engine drags.
<Draggable.Root kind={marker} onDragStartCapture={() => {}} />;
// @ts-expect-error
<Draggable.Root kind={marker} onDragEndCapture={() => {}} />;
// @ts-expect-error
<Draggable.Root kind={marker} onDragEnter={() => {}} />;
// @ts-expect-error
<Draggable.Root kind={marker} onDragLeave={() => {}} />;
// @ts-expect-error
<Draggable.Root kind={marker} onDragOver={() => {}} />;
// @ts-expect-error
<Draggable.Root kind={marker} onDragExit={() => {}} />;
// The engine's own handlers keep their names and carry the drag payload, so the
// omission above must not have taken them with it. `onDrop` is one of them on the
// source too: the native prop of that name is replaced, not just removed.
<Draggable.Root
  kind={card}
  payload={{ id: 'a' }}
  onDragStart={({ source }) => expectType<CardPayload, typeof source.payload>(source.payload)}
  onDrag={({ source }) => expectType<CardPayload, typeof source.payload>(source.payload)}
  onDrop={({ source }) => expectType<CardPayload, typeof source.payload>(source.payload)}
  onDragEnd={({ source }) => expectType<CardPayload, typeof source.payload>(source.payload)}
/>;

// `onDrop` fires only for a committed drop, so its `dropTarget` is never null —
// unlike `onDragEnd`'s.
<Draggable.Root
  kind={card}
  payload={{ id: 'a' }}
  onDrop={({ dropTarget }) => expectType<DropTargetRecord, typeof dropTarget>(dropTarget)}
  onDragEnd={({ dropTarget }) => expectType<DropTargetRecord | null, typeof dropTarget>(dropTarget)}
/>;

// The second argument carries the reason, narrowed to the one outcome `onDrop` fires for.
<Draggable.Root
  kind={marker}
  onDrop={(_, eventDetails) => expectType<'drop', typeof eventDetails.reason>(eventDetails.reason)}
  onDragEnd={(_, eventDetails) =>
    expectType<DragEndReason, typeof eventDetails.reason>(eventDetails.reason)
  }
/>;

// `reason` is the discriminator for the native input behind every event.
<Draggable.Root
  kind={marker}
  onBeforeDragStart={(_, eventDetails) => {
    if (eventDetails.reason === 'pointer') {
      expectType<PointerEvent, typeof eventDetails.event>(eventDetails.event);
    } else {
      expectType<KeyboardEvent, typeof eventDetails.event>(eventDetails.event);
    }
  }}
  onDrag={(_, eventDetails) => {
    if (eventDetails.reason === 'pointer') {
      expectType<PointerEvent, typeof eventDetails.event>(eventDetails.event);
    } else {
      expectType<KeyboardEvent, typeof eventDetails.event>(eventDetails.event);
    }
  }}
  onDragEnd={(_, eventDetails) => {
    if (eventDetails.reason === 'pointer-canceled') {
      expectType<PointerEvent, typeof eventDetails.event>(eventDetails.event);
    } else if (eventDetails.reason === 'tab-key') {
      expectType<KeyboardEvent, typeof eventDetails.event>(eventDetails.event);
    }
  }}
/>;
