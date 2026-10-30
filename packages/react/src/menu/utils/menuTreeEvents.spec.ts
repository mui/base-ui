import { REASONS } from '../../internals/reasons';
import { PopupTreeRegistry } from '../../utils/popups/tree/PopupTreeRegistry';
import { getMenuTreeEvents } from './menuTreeEvents';

const menuEvents = getMenuTreeEvents(new PopupTreeRegistry());

menuEvents.emit('nodeOpenChange', {
  open: true,
  reason: REASONS.triggerPress,
  nodeId: undefined,
  parentNodeId: null,
});
// @ts-expect-error The nodeOpenChange payload needs every field.
menuEvents.emit('nodeOpenChange', { open: true });
menuEvents.emit('nodeOpenChange', {
  open: true,
  // @ts-expect-error The reason must be a Menu.Root open change reason.
  reason: REASONS.incrementPress,
  nodeId: undefined,
  parentNodeId: null,
});

menuEvents.emit('treeClose', { domEvent: undefined, reason: REASONS.itemPress });
// @ts-expect-error A close is only requested by an item press or a cancelled open.
menuEvents.emit('treeClose', { domEvent: undefined, reason: REASONS.escapeKey });

// @ts-expect-error A listener receives the event's payload.
menuEvents.on('nodeItemHover', (event: MouseEvent) => event);
