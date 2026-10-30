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

treeEvents.emit('nodeHoverClose', new MouseEvent('mouseleave'));
// @ts-expect-error Only listed events can be emitted.
treeEvents.emit('nodeOpenChange', { open: true });

// @ts-expect-error Only listed events can be listened to.
treeEvents.on('unknown', () => {});
// @ts-expect-error A listener receives the event's payload.
treeEvents.on('nodeHoverClose', (event: KeyboardEvent) => event);
