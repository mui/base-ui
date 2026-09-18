import * as React from 'react';
import { expectType } from '#test-utils';
import { Draggable } from '@base-ui/react/draggable';
import type { DragEndReason, DropTargetChangeReason } from '@base-ui/react/draggable';

interface CardPayload {
  id: string;
  title: string;
}

const card = Draggable.createKind<CardPayload>('card');
const marker = Draggable.createKind('marker');

// The payload type flows from `kind` into every callback.
<Draggable.CollisionProvider
  kind={card}
  getItemId={(payload) => {
    expectType<CardPayload, typeof payload>(payload);
    return payload.id;
  }}
  canCollide={({ source, target }) => {
    expectType<CardPayload, typeof source.payload>(source.payload);
    expectType<CardPayload, typeof target>(target);
    return target.id === 'full' ? 'reject' : true;
  }}
  onMoveStart={({ source }) => expectType<CardPayload, typeof source.payload>(source.payload)}
  onCollisionChange={({ collision }, details) => {
    if (collision) {
      expectType<CardPayload, typeof collision.target.payload>(collision.target.payload);
      expectType<'before' | 'after', typeof collision.placement>(collision.placement);
    }
    expectType<DropTargetChangeReason, typeof details.reason>(details.reason);
  }}
  onMoveEnd={({ collision, canceled, dropTarget }, details) => {
    expectType<boolean, typeof canceled>(canceled);
    expectType<DragEndReason, typeof details.reason>(details.reason);
    if (collision) {
      expectType<CardPayload, typeof collision.target.payload>(collision.target.payload);
    }
    void dropTarget;
  }}
/>;

// A kind without a payload types the callbacks with `undefined`.
<Draggable.CollisionProvider
  kind={marker}
  onCollisionChange={({ collision }) => {
    if (collision) {
      expectType<undefined, typeof collision.target.payload>(collision.target.payload);
    }
  }}
/>;

// @ts-expect-error getItemId must accept the kind's payload.
<Draggable.CollisionProvider kind={card} getItemId={(payload: string) => payload} />;

// @ts-expect-error placement is a fixed union.
<Draggable.CollisionProvider kind={card} placement="edges" />;

// Exported aliases mirror the other parts.
declare const collision: Draggable.CollisionProvider.Collision<CardPayload>;
expectType<CardPayload, typeof collision.target.payload>(collision.target.payload);
declare const collisionEvent: Draggable.CollisionProvider.CollisionEvent<CardPayload>;
expectType<
  Draggable.CollisionProvider.Collision<CardPayload> | null,
  typeof collisionEvent.collision
>(collisionEvent.collision);
declare const endEvent: Draggable.CollisionProvider.MoveEndEvent<CardPayload>;
expectType<boolean, typeof endEvent.canceled>(endEvent.canceled);
declare const props: Draggable.CollisionProvider.Props<CardPayload>;
expectType<'vertical' | 'horizontal' | undefined, typeof props.orientation>(props.orientation);
