import * as React from 'react';
import { expectType } from '#test-utils';
import type {
  DragAutoScrollApply,
  DragAutoScrollApplyContext,
  DragAutoScrollAxis,
} from '@base-ui/react/drag-auto-scroll';
import { DragAutoScroll } from '@base-ui/react/drag-auto-scroll';
import { Draggable } from '@base-ui/react/draggable';
import { DropTarget } from '@base-ui/react/drop-target';

interface CardPayload {
  id: string;
}

const card = Draggable.createKind<CardPayload>('card');

// The bare form compiles: every parameter is optional.
<DragAutoScroll.Root />;

<DragAutoScroll.Root allowedAxis="vertical" disabled />;

// `accept` filters which drags engage this scroller and types the drag the
// per-frame callbacks see.
<DragAutoScroll.Root
  accept={card}
  canScroll={({ source, element, input }) => {
    expectType<CardPayload, typeof source.payload>(source.payload);
    expectType<HTMLElement, typeof element>(element);
    expectType<number, typeof input.clientX>(input.clientX);
    return true;
  }}
  allowedAxis={({ source }) => {
    expectType<CardPayload, typeof source.payload>(source.payload);
    return 'horizontal';
  }}
/>;

// Without `accept`, the callbacks see an untyped drag.
<DragAutoScroll.Root
  canScroll={({ source }) => {
    expectType<unknown, typeof source.payload>(source.payload);
    return true;
  }}
/>;

// `maxSpeed` takes a static value or a callback keyed on `accept` like the rest.
<DragAutoScroll.Root maxSpeed={300} />;
<DragAutoScroll.Root
  accept={card}
  maxSpeed={({ source }) => {
    expectType<CardPayload, typeof source.payload>(source.payload);
    return 1800;
  }}
/>;

// @ts-expect-error a speed is a number, not a CSS length.
<DragAutoScroll.Root maxSpeed="300px" />;

// @ts-expect-error `allowedAxis` is a fixed union, not an arbitrary string.
<DragAutoScroll.Root allowedAxis="diagonal" />;

// @ts-expect-error the callback form must return that same union.
<DragAutoScroll.Root allowedAxis={() => 'diagonal'} />;

<DragAutoScroll.Root
  className={(state) => {
    expectType<boolean, typeof state.disabled>(state.disabled);
    return '';
  }}
/>;

const ref: React.Ref<HTMLDivElement> = null;
<DragAutoScroll.Root ref={ref} />;

// One element, both roles: the scroll container composes onto a drop target.
<DropTarget.Root accept={card} render={<DragAutoScroll.Root allowedAxis="vertical" />} />;

// A wrapper forwarding these props satisfies the component. Its type argument is
// the source payload, matching `DragAutoScroll.Root.Props`.
type CardScrollerProps = DragAutoScroll.Root.Props<CardPayload>;
function CardScroller(props: CardScrollerProps) {
  return <DragAutoScroll.Root<CardPayload> {...props} />;
}
<CardScroller allowedAxis="vertical" />;

// The entry point is self-sufficient: the callback return type is importable
// from it, so an extracted resolver can be typed without reaching elsewhere.
const resolveAxis = (): DragAutoScrollAxis => 'all';
<DragAutoScroll.Root allowedAxis={resolveAxis} />;

// `applyScroll` is keyed on `accept` like the other per-frame callbacks, and
// carries the frame's delta alongside the drag context.
<DragAutoScroll.Root
  accept={card}
  applyScroll={({ source, element, x, y }) => {
    expectType<CardPayload, typeof source.payload>(source.payload);
    expectType<HTMLElement, typeof element>(element);
    expectType<number, typeof x>(x);
    expectType<number, typeof y>(y);
  }}
/>;

<DragAutoScroll.Root
  applyScroll={({ source }) => {
    expectType<unknown, typeof source.payload>(source.payload);
  }}
/>;

// Every way of reporting which axes moved compiles, including returning nothing.
<DragAutoScroll.Root applyScroll={() => {}} />;
<DragAutoScroll.Root applyScroll={() => 'all'} />;
<DragAutoScroll.Root applyScroll={() => 'vertical'} />;
<DragAutoScroll.Root applyScroll={() => null} />;

// @ts-expect-error the report names an axis from the same union as `allowedAxis`.
<DragAutoScroll.Root applyScroll={() => 'diagonal'} />;

// An extracted delegate types without reaching past this entry point.
const applyPan: DragAutoScrollApply = ({ x, y }) => {
  expectType<number, typeof x>(x);
  expectType<number, typeof y>(y);
};
<DragAutoScroll.Root applyScroll={applyPan} />;

const applyCardPan: DragAutoScrollApply<CardPayload> = ({ source }) => {
  expectType<CardPayload, typeof source.payload>(source.payload);
};
<DragAutoScroll.Root accept={card} applyScroll={applyCardPan} />;

const readDelta = (context: DragAutoScrollApplyContext) => context.x + context.y;
<DragAutoScroll.Root applyScroll={(context) => void readDelta(context)} />;
