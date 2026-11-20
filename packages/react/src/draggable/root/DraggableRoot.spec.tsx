import * as React from 'react';
import { expectType } from '#test-utils';
import { Draggable } from '@base-ui/react/draggable';
import type {
  DraggableKind,
  DraggableRootMoveStartEventDetails as MoveStartEventDetails,
  DraggableRootRecord,
} from '@base-ui/react/draggable';

interface CardPayload {
  id: string;
}

const card = Draggable.createKind<CardPayload>('card');
const globalCard = Draggable.createGlobalKind<CardPayload>('myapp/card');
const marker = Draggable.createKind('marker');
const text = Draggable.createKind<string>('text');

// The kind declares the payload type (default `undefined`) and drag data (default `unknown`).
expectType<DraggableKind<CardPayload, unknown>, typeof card>(card);
expectType<DraggableKind<CardPayload, unknown>, typeof globalCard>(globalCard);
expectType<DraggableKind<undefined, unknown>, typeof marker>(marker);

// Without type arguments, `Draggable.Kind` fits any kind, whatever its payload and drag data.
const column = Draggable.createKind<{ title: string }, { offset: number }>('column');
const kinds: Draggable.Kind[] = [card, column, marker];
void kinds;

function KindList(props: { kind: Draggable.Kind }) {
  return (
    <Draggable.Root kind={props.kind}>
      <Draggable.Trigger />
    </Draggable.Root>
  );
}
<KindList kind={card} />;
<KindList kind={column} />;
<KindList kind={marker} />;

// With a type argument, it only fits kinds of that payload.
// @ts-expect-error a `column` kind is not a `card` kind.
const cardOnly: Draggable.Kind<CardPayload> = column;

// `anyKind` only fits `accept`. A draggable declares the one kind it is.
// @ts-expect-error `anyKind` can't be a draggable's `kind`.
<Draggable.Root kind={Draggable.anyKind}>
  <Draggable.Trigger />
</Draggable.Root>;
// @ts-expect-error `anyKind` isn't a `Draggable.Kind`.
const anyKinds: Draggable.Kind[] = [Draggable.anyKind];

// A kind with no payload type compiles without a payload, and the engine delivers `undefined`.
<Draggable.Root kind={marker}>
  <Draggable.Trigger />
</Draggable.Root>;

<Draggable.Root
  kind={marker}
  onMoveStart={(eventDetails) => {
    expectType<undefined, typeof eventDetails.source.payload>(eventDetails.source.payload);
  }}
>
  <Draggable.Trigger
    onDrop={(event) => expectType<DataTransfer, typeof event.dataTransfer>(event.dataTransfer)}
  />
</Draggable.Root>;

// A payload-less source uses the nearest provider default kind.
<Draggable.Root
  onMoveEnd={(eventDetails) => {
    expectType<undefined, typeof eventDetails.source.payload>(eventDetails.source.payload);
  }}
>
  <Draggable.Trigger />
</Draggable.Root>;

// @ts-expect-error a payload requires an explicit typed kind.
<Draggable.Root payload={{ id: 'a' }}>
  <Draggable.Trigger />
</Draggable.Root>;

// The kind types every event that carries the payload, with no type argument.
<Draggable.Root
  kind={card}
  payload={{ id: 'a' }}
  onMoveStart={(eventDetails) => {
    expectType<CardPayload, typeof eventDetails.source.payload>(eventDetails.source.payload);
  }}
>
  <Draggable.Trigger />
</Draggable.Root>;

// The payload need not be an object.
<Draggable.Root
  kind={text}
  payload="card-1"
  onMoveStart={(eventDetails) => {
    expectType<string, typeof eventDetails.source.payload>(eventDetails.source.payload);
  }}
>
  <Draggable.Trigger />
</Draggable.Root>;

// An explicit type argument still overrides inference, and the kind must agree with it.
<Draggable.Root<CardPayload>
  kind={card}
  payload={{ id: 'a' }}
  onMoveStart={(eventDetails) => {
    expectType<CardPayload, typeof eventDetails.source.payload>(eventDetails.source.payload);
  }}
>
  <Draggable.Trigger />
</Draggable.Root>;

// @ts-expect-error the kind must carry the explicit type argument's payload.
<Draggable.Root<CardPayload> kind={text} payload={{ id: 'a' }}>
  <Draggable.Trigger />
</Draggable.Root>;

// A function-valued payload is data like any other.
const command = Draggable.createKind<() => void>('command');
const runCommand = () => {};
<Draggable.Root
  kind={command}
  payload={runCommand}
  onMoveStart={(eventDetails) => {
    expectType<() => void, typeof eventDetails.source.payload>(eventDetails.source.payload);
  }}
>
  <Draggable.Trigger />
</Draggable.Root>;

// @ts-expect-error a kind that declares a payload makes `payload` required.
<Draggable.Root kind={card}>
  <Draggable.Trigger />
</Draggable.Root>;

declare const maybeCardPayload: CardPayload | undefined;
// @ts-expect-error a required static payload cannot be explicitly undefined.
<Draggable.Root kind={card} payload={undefined}>
  <Draggable.Trigger />
</Draggable.Root>;
// @ts-expect-error a possibly undefined static payload cannot satisfy a required payload.
<Draggable.Root kind={card} payload={maybeCardPayload}>
  <Draggable.Trigger />
</Draggable.Root>;

// @ts-expect-error the payload must match the kind.
<Draggable.Root kind={card} payload={{ id: 1 }}>
  <Draggable.Trigger />
</Draggable.Root>;

// @ts-expect-error excess properties are still caught against the kind's payload.
<Draggable.Root kind={card} payload={{ id: 'a', extra: 1 }}>
  <Draggable.Trigger />
</Draggable.Root>;

// @ts-expect-error a kind with no payload type takes no payload.
<Draggable.Root kind={marker} payload={{ id: 'a' }}>
  <Draggable.Trigger />
</Draggable.Root>;

// A local kind is unique even when another declaration uses the same name, and
// each declaration independently pins its own payload type.
const foreignCard = Draggable.createKind<{ index: number }>('card');
// @ts-expect-error this `card` carries a different payload than the one used here.
<Draggable.Root kind={foreignCard} payload={{ id: 'a' }}>
  <Draggable.Trigger />
</Draggable.Root>;

// `TPayload` is inferred from `kind` only. An extracted handler with a different payload
// type is rejected instead of redefining it.
const mismatchedHandler = (eventDetails: MoveStartEventDetails<{ index: number }>) => eventDetails;
// @ts-expect-error the handler must match the kind's payload, not redefine it.
<Draggable.Root kind={card} payload={{ id: 'a' }} onMoveStart={mismatchedHandler}>
  <Draggable.Trigger />
</Draggable.Root>;

// A wider handler still accepts the kind's payload.
const looseCard = Draggable.createKind<{ id: string }>('loose-card');
const wideHandler = (eventDetails: MoveStartEventDetails<Record<string, unknown>>) => eventDetails;
<Draggable.Root
  kind={looseCard}
  payload={{ id: 'a' }}
  onMoveStart={wideHandler}
  onMove={(eventDetails) => {
    expectType<{ id: string }, typeof eventDetails.source.payload>(eventDetails.source.payload);
  }}
>
  <Draggable.Trigger />
</Draggable.Root>;

// `matches` narrows a source whose payload isn't known, as passed by a target or
// monitor that accepts several kinds.
declare const untypedSource: DraggableRootRecord<unknown>;
if (card.matches(untypedSource)) {
  expectType<CardPayload, typeof untypedSource.payload>(untypedSource.payload);
}

<Draggable.Root kind={marker}>
  <Draggable.Trigger
    className={(state) => {
      expectType<boolean, typeof state.dragging>(state.dragging);
      return '';
    }}
  />
</Draggable.Root>;

// @ts-expect-error The preview is rendered with `Draggable.Positioner` and `Draggable.Preview`.
<Draggable.Root kind={marker} preview={{ offset: 'pointer' }} />;
// @ts-expect-error `handle` is only a `registerSource()` option. Use `Draggable.Handle`.
<Draggable.Root kind={marker} handle={document.body} />;
// The trigger is a DOM element, so drag settings don't go there either.
<Draggable.Root kind={marker}>
  {/* @ts-expect-error `kind` belongs on `Draggable.Root`. */}
  <Draggable.Trigger kind={marker} />
</Draggable.Root>;

const boundaryRef: React.RefObject<HTMLDivElement | null> = { current: null };

// The preview parts sit beside the trigger. Settings that place the preview go on the
// positioner, and the portal's container on the portal.
<Draggable.Root kind={marker}>
  <Draggable.Trigger />
  <Draggable.Portal container={boundaryRef}>
    <Draggable.Positioner offset="pointer" modifiers={Draggable.restrictToElement(boundaryRef)}>
      <Draggable.Preview />
    </Draggable.Positioner>
  </Draggable.Portal>
</Draggable.Root>;

<Draggable.Root kind={marker}>
  <Draggable.Trigger />
  <Draggable.Positioner
    offset={(parameters) => {
      expectType<HTMLElement, typeof parameters.element>(parameters.element);
      expectType<DOMRect, typeof parameters.sourceRect>(parameters.sourceRect);
      return { x: 1, y: 2 };
    }}
  >
    <Draggable.Preview className="Ghost" render={<span />}>
      x
    </Draggable.Preview>
  </Draggable.Positioner>
</Draggable.Root>;

<Draggable.Root kind={marker}>
  <Draggable.Trigger />
  <Draggable.Positioner>
    {/* @ts-expect-error The preview doesn't place itself. Pass `offset` to the positioner. */}
    <Draggable.Preview offset="pointer" />
  </Draggable.Positioner>
</Draggable.Root>;

// @ts-expect-error configure the container on each preview, not the provider.
<Draggable.Provider container={document.body}>
  <Draggable.Root kind={marker}>
    <Draggable.Trigger />
  </Draggable.Root>
</Draggable.Provider>;

const ref: React.Ref<HTMLDivElement> = null;
<Draggable.Root kind={marker}>
  <Draggable.Trigger ref={ref} />
</Draggable.Root>;

// A stable preview key identifies a logical source across a remount.
<Draggable.Root kind={marker} previewKey="card-1">
  <Draggable.Trigger />
</Draggable.Root>;

// `Props` takes the kind and the payload it declares.
type CardProps = Draggable.Root.Props<CardPayload>;
const cardValueProps: CardProps = { kind: card, payload: { id: 'a' } };
expectType<CardPayload, NonNullable<typeof cardValueProps.payload>>(cardValueProps.payload!);

// @ts-expect-error like the component, `Props` requires a payload when `TPayload` is declared.
const cardMissingProps: CardProps = { kind: card };

// @ts-expect-error and it requires the kind that carries it.
const cardMissingKind: CardProps = { payload: { id: 'a' } };

// A wrapper forwarding these props satisfies the component's signature.
function Card(props: CardProps) {
  return (
    <Draggable.Root {...props}>
      <Draggable.Trigger />
    </Draggable.Root>
  );
}
<Card
  kind={card}
  payload={{ id: 'a' }}
  onMoveStart={(eventDetails) => eventDetails.source.payload.id}
/>;

// A generic wrapper can forward its props as they are, like `Select.Root`'s wrappers.
function GenericCard<TPayload>(props: Draggable.Root.Props<TPayload>) {
  return (
    <Draggable.Root {...props}>
      <Draggable.Trigger />
    </Draggable.Root>
  );
}
<GenericCard kind={card} payload={{ id: 'a' }} />;
// @ts-expect-error the wrapper still requires the payload the kind declares.
<GenericCard kind={card} />;

// After destructuring, TypeScript can't tell whether `payload` is required while
// `TPayload` is open. A wrapper that destructures restates `kind` and `payload`.
function GenericCardWithHandle<TPayload>({
  children,
  ...props
}: Draggable.Root.Props<TPayload> & { kind: Draggable.Kind<TPayload>; payload: TPayload }) {
  return (
    <Draggable.Root {...props}>
      <Draggable.Trigger>
        <Draggable.Handle />
        {children}
      </Draggable.Trigger>
    </Draggable.Root>
  );
}
<GenericCardWithHandle kind={card} payload={{ id: 'a' }} />;
function GenericCardWithoutRestatement<TPayload>({
  children,
  ...props
}: Draggable.Root.Props<TPayload>) {
  return (
    // @ts-expect-error the rest of an open `Props` hides whether `payload` is required.
    <Draggable.Root {...props}>
      <Draggable.Trigger>{children}</Draggable.Trigger>
    </Draggable.Root>
  );
}
void GenericCardWithoutRestatement;
// @ts-expect-error the wrapper still checks the payload against the kind.
<GenericCard kind={card} payload={{ id: 1 }} />;

<Draggable.Root kind={marker}>
  {/* @ts-expect-error `draggable` starts a native drag that fights the pointer sensor. */}
  <Draggable.Trigger draggable />
</Draggable.Root>;
<Draggable.Root kind={marker}>
  <Draggable.Trigger onDragStartCapture={() => {}} />
</Draggable.Root>;
<Draggable.Root kind={marker}>
  <Draggable.Trigger onDragEndCapture={() => {}} />
</Draggable.Root>;
<Draggable.Root kind={marker}>
  {/* @ts-expect-error Drop target handlers belong on `Draggable.Target`. */}
  <Draggable.Trigger onDraggableEnter={() => {}} />
</Draggable.Root>;
<Draggable.Root kind={marker}>
  {/* @ts-expect-error Drop target handlers belong on `Draggable.Target`. */}
  <Draggable.Trigger onDraggableLeave={() => {}} />
</Draggable.Root>;
<Draggable.Root kind={marker}>
  <Draggable.Trigger onDragOver={() => {}} />
</Draggable.Root>;
<Draggable.Root kind={marker}>
  <Draggable.Trigger onDragExit={() => {}} />
</Draggable.Root>;
// Engine callbacks preserve the source payload type.
<Draggable.Root
  kind={card}
  payload={{ id: 'a' }}
  onMoveStart={(eventDetails) =>
    expectType<CardPayload, typeof eventDetails.source.payload>(eventDetails.source.payload)
  }
  onMove={(eventDetails) =>
    expectType<CardPayload, typeof eventDetails.source.payload>(eventDetails.source.payload)
  }
  onMoveEnd={(eventDetails) =>
    expectType<CardPayload, typeof eventDetails.source.payload>(eventDetails.source.payload)
  }
>
  <Draggable.Trigger />
</Draggable.Root>;

// A successful drop has a non-null `target`. `canceled` tells a cancel from an outside release.
<Draggable.Root
  kind={card}
  payload={{ id: 'a' }}
  onMoveEnd={(eventDetails) => {
    expectType<Draggable.Target.Record | null, typeof eventDetails.target>(eventDetails.target);
    expectType<Draggable.Root.MoveEndEventReason, typeof eventDetails.reason>(eventDetails.reason);
    expectType<boolean, typeof eventDetails.canceled>(eventDetails.canceled);
    expectType<Draggable.LocationHistory, typeof eventDetails.location>(eventDetails.location);
    if (eventDetails.target !== null) {
      expectType<Draggable.Target.Record, typeof eventDetails.target>(eventDetails.target);
    }
    if (eventDetails.reason === 'drop') {
      expectType<'drop', typeof eventDetails.reason>(eventDetails.reason);
    }
  }}
>
  <Draggable.Trigger />
</Draggable.Root>;

// Native drops are separate from engine drops handled through onMoveEnd.
<Draggable.Root kind={marker}>
  <Draggable.Trigger onDrop={() => {}} />
</Draggable.Root>;

// Drag events carry the native pointer or double-click input.
<Draggable.Root
  kind={marker}
  onBeforeMoveStart={(eventDetails) => {
    expectType<Draggable.Root.Record<undefined>, typeof eventDetails.source>(eventDetails.source);
    expectType<Draggable.Input, typeof eventDetails.input>(eventDetails.input);
    if (eventDetails.reason === 'double-click') {
      expectType<MouseEvent | PointerEvent, typeof eventDetails.event>(eventDetails.event);
    } else {
      expectType<'pointer', typeof eventDetails.reason>(eventDetails.reason);
      expectType<PointerEvent, typeof eventDetails.event>(eventDetails.event);
    }
  }}
  onMoveStart={(eventDetails) => {
    expectType<'pointer' | 'double-click', typeof eventDetails.reason>(eventDetails.reason);
  }}
  onMove={(eventDetails) => {
    if (eventDetails.reason === 'modifier-key') {
      expectType<KeyboardEvent, typeof eventDetails.event>(eventDetails.event);
    } else {
      expectType<PointerEvent, typeof eventDetails.event>(eventDetails.event);
    }
  }}
  onMoveEnd={(eventDetails) => {
    if (eventDetails.reason === 'pointer-canceled') {
      expectType<PointerEvent, typeof eventDetails.event>(eventDetails.event);
    } else if (eventDetails.reason === 'tab-key') {
      expectType<KeyboardEvent, typeof eventDetails.event>(eventDetails.event);
    }
  }}
>
  <Draggable.Trigger />
</Draggable.Root>;

<Draggable.Root activation={[{ type: 'distance', distance: 8 }, { type: 'double-click' }]}>
  <Draggable.Trigger />
</Draggable.Root>;
<Draggable.Root activation={{ mouse: { type: 'double-click' } }}>
  <Draggable.Trigger />
</Draggable.Root>;
<Draggable.Root activation={{ mouse: false, touch: false, pen: false }}>
  <Draggable.Trigger />
</Draggable.Root>;
<Draggable.Root activation={[{ type: 'immediate' }, { touch: false, pen: false }]}>
  <Draggable.Trigger />
</Draggable.Root>;
// Double-tap pickup for touch and pen shares the `double-click` type.
<Draggable.Root activation={{ touch: { type: 'double-click' } }}>
  <Draggable.Trigger />
</Draggable.Root>;
<Draggable.Root activation={{ pen: { type: 'double-click' } }}>
  <Draggable.Trigger />
</Draggable.Root>;

// @ts-expect-error explicit unknown must not weaken the kind's payload requirement.
<Draggable.Root<unknown> kind={card} payload={null}>
  <Draggable.Trigger />
</Draggable.Root>;
// @ts-expect-error explicit optional properties must not weaken the kind's payload requirement.
<Draggable.Root<{ id?: string }> kind={card} payload={{}}>
  <Draggable.Trigger />
</Draggable.Root>;
// @ts-expect-error widening a producer kind would allow publishing invalid payloads.
const widenedCard: DraggableKind<unknown> = card;

// A kind as accepted by a target or monitor, which only observes payloads.
type ObservedKind = Exclude<Draggable.Accept<unknown>, ReadonlyArray<unknown>>;
const observer: ObservedKind = card;
// @ts-expect-error an observational kind cannot be used to publish arbitrary payloads.
<Draggable.Root<unknown> kind={observer} payload={null}>
  <Draggable.Trigger />
</Draggable.Root>;

const cardWithDragData = Draggable.createKind<CardPayload, { offset: number }>('card-with-data');
<Draggable.Root
  kind={cardWithDragData}
  payload={{ id: 'a' }}
  onMoveStart={(eventDetails) => {
    expectType<{ offset: number } | undefined, typeof eventDetails.source.dragData>(
      eventDetails.source.dragData,
    );
    eventDetails.source.updateDragData({ offset: 1 });
    // @ts-expect-error drag data is a separate type.
    eventDetails.source.updateDragData({ id: 'b' });
  }}
>
  <Draggable.Trigger />
</Draggable.Root>;
if (cardWithDragData.matches(untypedSource)) {
  expectType<{ offset: number } | undefined, typeof untypedSource.dragData>(untypedSource.dragData);
}
