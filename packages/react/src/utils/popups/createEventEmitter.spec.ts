import { REASONS } from '../../internals/reasons';
import { createEventEmitter } from './createEventEmitter';
import type { PopupEventMap } from './types';
import type { PopupTreeEventMap } from './tree/PopupTreeRegistry';

const popupEvents = createEventEmitter<PopupEventMap>();
const treeEvents = createEventEmitter<PopupTreeEventMap>();

popupEvents.emit('droppedClose', undefined);
// @ts-expect-error Every event takes a payload argument, even one without data.
popupEvents.emit('droppedClose');
// @ts-expect-error Only listed events can be emitted.
popupEvents.emit('unknown', undefined);

treeEvents.emit('nodeOpenChange', {
  component: 'menu',
  open: true,
  reason: REASONS.triggerPress,
  nodeId: undefined,
  parentNodeId: null,
});
// @ts-expect-error The nodeOpenChange payload needs every field.
treeEvents.emit('nodeOpenChange', { component: 'menu', open: true });

treeEvents.emit('treeClose', { domEvent: undefined, reason: REASONS.itemPress });
// @ts-expect-error A close is only requested by an item press or a cancelled open.
treeEvents.emit('treeClose', { domEvent: undefined, reason: REASONS.escapeKey });

// @ts-expect-error Only listed events can be listened to.
treeEvents.on('unknown', () => {});
// @ts-expect-error A listener receives the event's payload.
treeEvents.on('nodeItemHover', (event: MouseEvent) => event);
