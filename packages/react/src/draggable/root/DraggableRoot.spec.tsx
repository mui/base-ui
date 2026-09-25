import * as React from 'react';
import { expectType } from '#test-utils';
import {
  Draggable,
  type DraggableKind,
  type DraggableRootMoveStartValue as MoveStartValue,
  type DraggableRootRecord,
} from '@base-ui/react/draggable';

interface CardPayload {
  id: string;
}

const card = Draggable.createKind<CardPayload>('card');
const globalCard = Draggable.createGlobalKind<CardPayload>('myapp/card');
const marker = Draggable.createKind('marker');
const text = Draggable.createKind<string>('text');

// The payload type is declared on the kind, and defaults to `undefined`.
expectType<DraggableKind<CardPayload>, typeof card>(card);
expectType<DraggableKind<CardPayload>, typeof globalCard>(globalCard);
expectType<DraggableKind<undefined>, typeof marker>(marker);

// A kind with no payload type: the bare form compiles, and the engine delivers `undefined`.
<Draggable.Root kind={marker} />;

<Draggable.Root
  kind={marker}
  onDrop={(event) => expectType<DataTransfer, typeof event.dataTransfer>(event.dataTransfer)}
  onMoveStart={({ source }) => {
    expectType<undefined, typeof source.payload>(source.payload);
  }}
/>;

// A payload-less source uses the nearest provider default kind.
<Draggable.Root
  onMoveEnd={({ source }) => {
    expectType<undefined, typeof source.payload>(source.payload);
  }}
/>;

// @ts-expect-error a payload requires an explicit typed kind.
<Draggable.Root payload={{ id: 'a' }} />;
// @ts-expect-error a payload accessor requires an explicit typed kind.
<Draggable.Root getPayload={() => ({ id: 'a' })} />;

// The kind types every event that carries the payload, with no type argument.
<Draggable.Root
  kind={card}
  payload={{ id: 'a' }}
  onMoveStart={({ source }) => {
    expectType<CardPayload, typeof source.payload>(source.payload);
  }}
/>;

// A payload resolver is checked against the kind rather than inferred from.
<Draggable.Root
  kind={card}
  payload={{ id: 'a' }}
  onMoveStart={({ source }) => {
    expectType<CardPayload, typeof source.payload>(source.payload);
  }}
/>;

// The payload need not be an object.
<Draggable.Root
  kind={text}
  payload="card-1"
  onMoveStart={({ source }) => {
    expectType<string, typeof source.payload>(source.payload);
  }}
/>;

// The callback sees the gesture it is deriving the payload from.
const grabOffset = Draggable.createKind<{ x: number }>('grab-offset');
<Draggable.Root
  kind={grabOffset}
  payload={{ x: 0 }}
  onMoveStart={({ source }) => {
    expectType<{ x: number }, typeof source.payload>(source.payload);
  }}
/>;

// An explicit type argument still overrides inference, and the kind must agree with it.
<Draggable.Root<CardPayload>
  kind={card}
  payload={{ id: 'a' }}
  onMoveStart={({ source }) => {
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
  onMoveStart={({ source }) => {
    expectType<() => void, typeof source.payload>(source.payload);
  }}
/>;

// @ts-expect-error a kind that declares a payload makes `payload` required, so the
// engine can never emit `undefined` where a `CardPayload` was promised.
<Draggable.Root kind={card} />;

declare const maybeCardPayload: CardPayload | undefined;
// @ts-expect-error a required static payload cannot be explicitly undefined.
<Draggable.Root kind={card} payload={undefined} />;
// @ts-expect-error a possibly undefined static payload cannot satisfy a required payload.
<Draggable.Root kind={card} payload={maybeCardPayload} />;
// @ts-expect-error a required payload getter cannot be explicitly undefined.
<Draggable.Root kind={card} getPayload={undefined} />;

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

// `kind` is the only thing `TPayload` is inferred from: an extracted handler declaring a
// different payload type is rejected rather than redefining it.
const mismatchedHandler = (value: MoveStartValue<{ index: number }>) => value;
// @ts-expect-error the handler must match the kind's payload, not redefine it.
<Draggable.Root kind={card} payload={{ id: 'a' }} onMoveStart={mismatchedHandler} />;

// A wider handler still accepts the kind's payload.
const looseCard = Draggable.createKind<{ id: string }>('loose-card');
const wideHandler = (value: MoveStartValue<Record<string, unknown>>) => value;
<Draggable.Root
  kind={looseCard}
  payload={{ id: 'a' }}
  onMoveStart={wideHandler}
  onMove={({ source }) => {
    expectType<{ id: string }, typeof source.payload>(source.payload);
  }}
/>;

// `matches` narrows a source whose payload isn't known, which is what a target or
// monitor that accepts several kinds hands out.
declare const untypedSource: DraggableRootRecord<unknown>;
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

// `registerSource({ preview })` is the imperative escape hatch; a component describes its
// preview with a preview part, and its handle with a handle part.
// @ts-expect-error `preview` is only a `registerSource()` option: use `Draggable.Preview`.
<Draggable.Root kind={marker} preview={{ offset: 'pointer' }} />;
// @ts-expect-error `handle` is only a `registerSource()` option: use `Draggable.Handle`.
<Draggable.Root kind={marker} handle={document.body} />;

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
  <Draggable.Preview
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
  <Draggable.Preview container={boundaryRef} />
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

// @ts-expect-error configure the container on each preview, not the provider.
<Draggable.Provider container={document.body}>
  <Draggable.Root kind={marker} />
</Draggable.Provider>;

// Omitting children configures the clone; children select a custom preview.
<Draggable.Root kind={marker}>
  <Draggable.Preview offset={{ x: 0, y: 0 }} />
</Draggable.Root>;
<Draggable.Root kind={marker}>
  <Draggable.Preview className="Ghost" render={<span />}>
    x
  </Draggable.Preview>
</Draggable.Root>;

const ref: React.Ref<HTMLDivElement> = null;
<Draggable.Root kind={marker} ref={ref} />;

// A stable preview key identifies a logical source across a remount.
<Draggable.Root kind={marker} previewKey="card-1" />;

// Static and resolved payloads use distinct fields.
type CardProps = Draggable.Root.Props<CardPayload>;
const cardValueProps: CardProps = { kind: card, payload: { id: 'a' } };
expectType<CardPayload, NonNullable<typeof cardValueProps.payload>>(cardValueProps.payload!);

// @ts-expect-error `Props` mirrors the component: a declared `TPayload` requires a payload.
const cardMissingProps: CardProps = { kind: card };

// @ts-expect-error and it requires the kind that carries it.
const cardMissingKind: CardProps = { payload: { id: 'a' } };

// A wrapper forwarding these props satisfies the component's signature.
function Card(props: CardProps) {
  return <Draggable.Root {...props} />;
}
<Card kind={card} payload={{ id: 'a' }} onMoveStart={({ source }) => source.payload.id} />;

// A generic wrapper can forward its props as they are, like `Select.Root`'s wrappers.
function GenericCard<TPayload>(props: Draggable.Root.Props<TPayload>) {
  return <Draggable.Root {...props} />;
}
<GenericCard kind={card} payload={{ id: 'a' }} />;
// @ts-expect-error the wrapper still requires the payload the kind declares.
<GenericCard kind={card} />;

// Destructuring leaves TypeScript unable to tell whether `payload` is required while
// `TPayload` is open, so a wrapper that does it restates `kind` and `payload`.
function GenericCardWithHandle<TPayload>({
  children,
  ...props
}: Draggable.Root.Props<TPayload> & { kind: Draggable.Kind<TPayload>; payload: TPayload }) {
  return (
    <Draggable.Root {...props}>
      <Draggable.Handle />
      {children}
    </Draggable.Root>
  );
}
<GenericCardWithHandle kind={card} payload={{ id: 'a' }} />;
function GenericCardWithoutRestatement<TPayload>({
  children,
  ...props
}: Draggable.Root.Props<TPayload>) {
  // @ts-expect-error the rest of an open `Props` hides whether `payload` is required.
  return <Draggable.Root {...props}>{children}</Draggable.Root>;
}
void GenericCardWithoutRestatement;
// @ts-expect-error the wrapper still checks the payload against the kind.
<GenericCard kind={card} payload={{ id: 1 }} />;

// @ts-expect-error `draggable` starts a native drag that fights the pointer sensor.
<Draggable.Root kind={marker} draggable />;
<Draggable.Root kind={marker} onDragStartCapture={() => {}} />;
<Draggable.Root kind={marker} onDragEndCapture={() => {}} />;
// @ts-expect-error
<Draggable.Root kind={marker} onDraggableEnter={() => {}} />;
// @ts-expect-error
<Draggable.Root kind={marker} onDraggableLeave={() => {}} />;
<Draggable.Root kind={marker} onDragOver={() => {}} />;
<Draggable.Root kind={marker} onDragExit={() => {}} />;
// Engine callbacks preserve the source payload type.
<Draggable.Root
  kind={card}
  payload={{ id: 'a' }}
  onMoveStart={({ source }) => expectType<CardPayload, typeof source.payload>(source.payload)}
  onMove={({ source }) => expectType<CardPayload, typeof source.payload>(source.payload)}
  onMoveEnd={({ source }) => expectType<CardPayload, typeof source.payload>(source.payload)}
/>;

// A successful drop is a non-null `target`; `canceled` tells a cancel from an outside release.
<Draggable.Root
  kind={card}
  payload={{ id: 'a' }}
  onMoveEnd={({ target }, eventDetails) => {
    expectType<Draggable.Target.Record | null, typeof target>(target);
    expectType<Draggable.Root.MoveEndEventReason, typeof eventDetails.reason>(eventDetails.reason);
    expectType<boolean, typeof eventDetails.canceled>(eventDetails.canceled);
    expectType<Draggable.LocationHistory, typeof eventDetails.location>(eventDetails.location);
    if (target !== null) {
      expectType<Draggable.Target.Record, typeof target>(target);
    }
    if (eventDetails.reason === 'drop') {
      expectType<'drop', typeof eventDetails.reason>(eventDetails.reason);
    }
  }}
/>;

// Native drops are separate from engine drops handled through onMoveEnd.
<Draggable.Root kind={marker} onDrop={() => {}} />;

// Drag events carry the native pointer or double-click input.
<Draggable.Root
  kind={marker}
  onBeforeMoveStart={({ source }, eventDetails) => {
    expectType<Draggable.Root.Record<undefined>, typeof source>(source);
    expectType<Draggable.Input, typeof eventDetails.input>(eventDetails.input);
    if (eventDetails.reason === 'double-click') {
      expectType<MouseEvent | PointerEvent, typeof eventDetails.event>(eventDetails.event);
    } else {
      expectType<'pointer', typeof eventDetails.reason>(eventDetails.reason);
      expectType<PointerEvent, typeof eventDetails.event>(eventDetails.event);
    }
  }}
  onMoveStart={(_, eventDetails) => {
    expectType<'pointer' | 'double-click', typeof eventDetails.reason>(eventDetails.reason);
  }}
  onMove={(_, eventDetails) => {
    if (eventDetails.reason === 'modifier-key') {
      expectType<KeyboardEvent, typeof eventDetails.event>(eventDetails.event);
    } else {
      expectType<PointerEvent, typeof eventDetails.event>(eventDetails.event);
    }
  }}
  onMoveEnd={(_, eventDetails) => {
    if (eventDetails.reason === 'pointer-canceled') {
      expectType<PointerEvent, typeof eventDetails.event>(eventDetails.event);
    } else if (eventDetails.reason === 'tab-key') {
      expectType<KeyboardEvent, typeof eventDetails.event>(eventDetails.event);
    }
  }}
/>;

<Draggable.Root activation={[{ type: 'distance', distance: 8 }, { type: 'double-click' }]} />;
<Draggable.Root activation={{ mouse: { type: 'double-click' } }} />;
<Draggable.Root activation={{ mouse: false, touch: false, pen: false }} />;
<Draggable.Root activation={[{ type: 'immediate' }, { touch: false, pen: false }]} />;
// Double-tap pickup for touch and pen shares the `double-click` type.
<Draggable.Root activation={{ touch: { type: 'double-click' } }} />;
<Draggable.Root activation={{ pen: { type: 'double-click' } }} />;

// @ts-expect-error explicit unknown must not weaken the kind's payload requirement.
<Draggable.Root<unknown> kind={card} payload={null} />;
// @ts-expect-error explicit optional properties must not weaken the kind's payload requirement.
<Draggable.Root<{ id?: string }> kind={card} payload={{}} />;
// @ts-expect-error widening a producer kind would allow publishing invalid payloads.
const widenedCard: DraggableKind<unknown> = card;

// A kind as accepted by a target or monitor, which only observes payloads.
type ObservedKind = Exclude<Draggable.Accept<unknown>, ReadonlyArray<unknown>>;
const observer: ObservedKind = card;
// @ts-expect-error an observational kind cannot be used to publish arbitrary payloads.
<Draggable.Root<unknown> kind={observer} payload={null} />;

const cardWithDragData = Draggable.createKind<CardPayload, { offset: number }>('card-with-data');
<Draggable.Root
  kind={cardWithDragData}
  payload={{ id: 'a' }}
  onMoveStart={({ source }) => {
    expectType<{ offset: number } | undefined, typeof source.dragData>(source.dragData);
    source.updatePayload({ id: 'b' });
    source.updateDragData({ offset: 1 });
    // @ts-expect-error payload updates preserve the kind's type.
    source.updatePayload({ id: 1 });
    // @ts-expect-error drag data is a separate type.
    source.updateDragData({ id: 'b' });
  }}
/>;
if (cardWithDragData.matches(untypedSource)) {
  expectType<{ offset: number } | undefined, typeof untypedSource.dragData>(untypedSource.dragData);
}
<Draggable.Preview kind={cardWithDragData}>
  {({ source }) => {
    expectType<{ offset: number } | undefined, typeof source.dragData>(source.dragData);
    return null;
  }}
</Draggable.Preview>;
