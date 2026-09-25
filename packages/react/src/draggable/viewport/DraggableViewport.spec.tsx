import * as React from 'react';
import { expectType } from '#test-utils';
import type {
  DraggableViewportDragScrollValue,
  DraggableViewportDragScrollEventDetails,
} from '@base-ui/react/draggable';
import { Draggable } from '@base-ui/react/draggable';

interface CardPayload {
  id: string;
}
const card = Draggable.createKind<CardPayload>('card');
type DragScrollHandler<TPayload = unknown> = NonNullable<
  Draggable.Viewport.Props<TPayload>['onDragScroll']
>;
<Draggable.Viewport />;
<Draggable.Viewport disabled />;
<Draggable.Viewport
  accept={card}
  onDrop={(event) => expectType<DataTransfer, typeof event.dataTransfer>(event.dataTransfer)}
  onDragOverCapture={(event) =>
    expectType<DataTransfer, typeof event.dataTransfer>(event.dataTransfer)
  }
  onDragScroll={(value, eventDetails) => {
    expectType<CardPayload, typeof value.source.payload>(value.source.payload);
    expectType<number, typeof value.x>(value.x);
    expectType<number, typeof value.y>(value.y);
    expectType<Draggable.Viewport.DragScrollDirection, typeof value.direction>(value.direction);
    expectType<DraggableViewportDragScrollValue<CardPayload>, typeof value>(value);
    expectType<Draggable.Viewport.DragScrollValue<CardPayload>, typeof value>(value);
    expectType<HTMLElement, typeof eventDetails.element>(eventDetails.element);
    expectType<number, typeof eventDetails.input.clientX>(eventDetails.input.clientX);
    expectType<'none', typeof eventDetails.reason>(eventDetails.reason);
    expectType<Draggable.Viewport.DragScrollEventReason, typeof eventDetails.reason>(
      eventDetails.reason,
    );
    expectType<Event, typeof eventDetails.event>(eventDetails.event);
    expectType<DraggableViewportDragScrollEventDetails, typeof eventDetails>(eventDetails);
    expectType<Draggable.Viewport.DragScrollEventDetails, typeof eventDetails>(eventDetails);
    expectType<boolean, typeof eventDetails.isCanceled>(eventDetails.isCanceled);
    expectType<boolean, typeof eventDetails.isPropagationAllowed>(
      eventDetails.isPropagationAllowed,
    );
    expectType<boolean, typeof eventDetails.isConsumed>(eventDetails.isConsumed);
    eventDetails.cancel();
    eventDetails.allowPropagation();
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
  maxSpeed={({ source, element, input }) => {
    expectType<CardPayload, typeof source.payload>(source.payload);
    expectType<HTMLElement, typeof element>(element);
    expectType<number, typeof input.clientX>(input.clientX);
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
const scroll: DragScrollHandler = ({ direction }, eventDetails) => {
  if (direction === 'horizontal') {
    eventDetails.cancel();
  }
};
<Draggable.Target accept={card} render={<Draggable.Viewport onDragScroll={scroll} />} />;
type CardScrollerProps = Draggable.Viewport.Props<CardPayload>;
function CardScroller(props: CardScrollerProps) {
  return <Draggable.Viewport<CardPayload> {...props} />;
}
const scrollCards: DragScrollHandler<CardPayload> = ({ source }) => {
  expectType<CardPayload, typeof source.payload>(source.payload);
};
// @ts-expect-error a typed observer requires a runtime filter.
<CardScroller onDragScroll={scrollCards} />;
<CardScroller accept={card} onDragScroll={scrollCards} />;
<Draggable.Viewport accept={card} onDragScroll={scrollCards} />;
// @ts-expect-error explicit payload types cannot bypass the runtime filter.
<Draggable.Viewport<CardPayload> onDragScroll={scrollCards} />;
// @ts-expect-error callbacks cannot infer a payload type without a runtime filter.
<Draggable.Viewport onDragScroll={scrollCards} />;
