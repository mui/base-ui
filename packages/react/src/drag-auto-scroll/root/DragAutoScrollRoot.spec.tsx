import * as React from 'react';
import { expectType } from '#test-utils';
import type {
  DragAutoScrollEvent,
  DragAutoScrollEventDetails,
  DragAutoScrollDirection,
  DragAutoScrollHandler,
} from '@base-ui/react/drag-auto-scroll';
import { DragAutoScroll } from '@base-ui/react/drag-auto-scroll';
import { Draggable } from '@base-ui/react/draggable';
import { DropTarget } from '@base-ui/react/drop-target';

interface CardPayload {
  id: string;
}
const card = Draggable.createKind<CardPayload>('card');
<DragAutoScroll.Root />;
<DragAutoScroll.Root disabled />;
<DragAutoScroll.Root
  accept={card}
  onDragScroll={(event, details) => {
    expectType<CardPayload, typeof details.source.payload>(details.source.payload);
    expectType<HTMLElement, typeof details.element>(details.element);
    expectType<number, typeof details.input.clientX>(details.input.clientX);
    expectType<number, typeof details.x>(details.x);
    expectType<number, typeof details.y>(details.y);
    expectType<DragAutoScrollDirection, typeof details.direction>(details.direction);
    expectType<'pointer', typeof details.reason>(details.reason);
    expectType<CustomEvent<DragAutoScrollEvent<CardPayload>>, typeof event>(event);
    expectType<DragAutoScrollEventDetails<CardPayload>, typeof details>(details);
    event.preventDefault();
    event.stopPropagation();
  }}
/>;
<DragAutoScroll.Root
  onDragScroll={(_event, { source }) => {
    expectType<unknown, typeof source.payload>(source.payload);
  }}
/>;
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
// @ts-expect-error axis selection now uses onDragScroll.
<DragAutoScroll.Root allowedAxis="vertical" />;
// @ts-expect-error scroll interception now uses onDragScroll.
<DragAutoScroll.Root canScroll={() => false} />;
// @ts-expect-error custom movement now uses onDragScroll.
<DragAutoScroll.Root applyScroll={() => {}} />;
<DragAutoScroll.Root
  className={(state) => {
    expectType<boolean, typeof state.disabled>(state.disabled);
    return '';
  }}
/>;
const ref: React.Ref<HTMLDivElement> = null;
<DragAutoScroll.Root ref={ref} />;
const scroll: DragAutoScrollHandler = (event, { direction }) => {
  if (direction === 'horizontal') {
    event.preventDefault();
  }
};
<DropTarget.Root accept={card} render={<DragAutoScroll.Root onDragScroll={scroll} />} />;
type CardScrollerProps = DragAutoScroll.Root.Props<CardPayload>;
function CardScroller(props: CardScrollerProps) {
  return <DragAutoScroll.Root<CardPayload> {...props} />;
}
const scrollCards: DragAutoScrollHandler<CardPayload> = (_event, { source }) => {
  expectType<CardPayload, typeof source.payload>(source.payload);
};
<CardScroller onDragScroll={scrollCards} />;
<Draggable.Viewport accept={card} onDragScroll={scrollCards} />;
