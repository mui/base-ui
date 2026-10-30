import { REASONS } from '../../internals/reasons';
import { createEventEmitter } from './createEventEmitter';
import type { FloatingEventMap, FloatingTreeEventMap } from './types';

const popupEvents = createEventEmitter<FloatingEventMap>();
const treeEvents = createEventEmitter<FloatingTreeEventMap>();

popupEvents.emit('droppedclose', undefined);
// @ts-expect-error Every event takes a payload argument, even one without data.
popupEvents.emit('droppedclose');
// @ts-expect-error Only listed events can be emitted.
popupEvents.emit('unknown', undefined);

treeEvents.emit('nodeopenchange', {
  component: 'menu',
  open: true,
  reason: REASONS.triggerPress,
  nodeId: undefined,
  parentNodeId: null,
});
// @ts-expect-error The nodeopenchange payload needs every field.
treeEvents.emit('nodeopenchange', { component: 'menu', open: true });
treeEvents.emit('nodeopenchange', {
  // @ts-expect-error Only listed components announce their open changes.
  component: 'popover',
  open: true,
  reason: REASONS.triggerPress,
  nodeId: undefined,
  parentNodeId: null,
});

treeEvents.emit('treeclose', { domEvent: undefined, reason: REASONS.itemPress });
// @ts-expect-error A close is only requested by an item press or a cancelled open.
treeEvents.emit('treeclose', { domEvent: undefined, reason: REASONS.escapeKey });

// @ts-expect-error Only listed events can be listened to.
treeEvents.on('unknown', () => {});
// @ts-expect-error A listener receives the event's payload.
treeEvents.on('nodeitemhover', (event: MouseEvent) => event);
