import * as React from 'react';
import { expectType } from '#test-utils';
import type {
  DragAutoScrollEvent,
  DragAutoScrollEventDetails,
  DragAutoScrollDirection,
  DragAutoScrollHandler,
} from '@base-ui/react/draggable';
import { Draggable } from '@base-ui/react/draggable';

interface CardPayload {
  id: string;
}
const card = Draggable.createKind<CardPayload>('card');
<Draggable.Viewport />;
<Draggable.Viewport disabled />;
<Draggable.Viewport
  accept={card}
  onDragScroll={(event, eventDetails) => {
    expectType<CardPayload, typeof event.source.payload>(event.source.payload);
    expectType<HTMLElement, typeof event.element>(event.element);
    expectType<number, typeof event.input.clientX>(event.input.clientX);
    expectType<number, typeof event.x>(event.x);
    expectType<number, typeof event.y>(event.y);
    expectType<DragAutoScrollDirection, typeof event.direction>(event.direction);
    expectType<DragAutoScrollEvent<CardPayload>, typeof event>(event);
    expectType<'pointer', typeof eventDetails.reason>(eventDetails.reason);
    expectType<Event, typeof eventDetails.event>(eventDetails.event);
    expectType<DragAutoScrollEventDetails, typeof eventDetails>(eventDetails);
    expectType<boolean, typeof eventDetails.isCanceled>(eventDetails.isCanceled);
    expectType<boolean, typeof eventDetails.isConsumed>(eventDetails.isConsumed);
    eventDetails.cancel();
    eventDetails.consume();
  }}
/>;
<Draggable.Viewport
  onDragScroll={({ source }) => {
    expectType<unknown, typeof source.payload>(source.payload);
  }}
/>;
<Draggable.Viewport maxSpeed={300} />;
<Draggable.Viewport
  accept={card}
  maxSpeed={({ source }) => {
    expectType<CardPayload, typeof source.payload>(source.payload);
    return 1800;
  }}
/>;
// @ts-expect-error a speed is a number, not a CSS length.
<Draggable.Viewport maxSpeed="300px" />;
// @ts-expect-error axis selection now uses onDragScroll.
<Draggable.Viewport allowedAxis="vertical" />;
// @ts-expect-error scroll interception now uses onDragScroll.
<Draggable.Viewport canScroll={() => false} />;
// @ts-expect-error custom movement now uses onDragScroll.
<Draggable.Viewport applyScroll={() => {}} />;
<Draggable.Viewport
  className={(state) => {
    expectType<boolean, typeof state.disabled>(state.disabled);
    return '';
  }}
/>;
const ref: React.Ref<HTMLDivElement> = null;
<Draggable.Viewport ref={ref} />;
const scroll: DragAutoScrollHandler = ({ direction }, eventDetails) => {
  if (direction === 'horizontal') {
    eventDetails.cancel();
  }
};
<Draggable.Target accept={card} render={<Draggable.Viewport onDragScroll={scroll} />} />;
type CardScrollerProps = Draggable.Viewport.Props<CardPayload>;
function CardScroller(props: CardScrollerProps) {
  return <Draggable.Viewport<CardPayload> {...props} />;
}
const scrollCards: DragAutoScrollHandler<CardPayload> = ({ source }) => {
  expectType<CardPayload, typeof source.payload>(source.payload);
};
<CardScroller onDragScroll={scrollCards} />;
<Draggable.Viewport accept={card} onDragScroll={scrollCards} />;
