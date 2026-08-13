import type { LocalizationProviderTranslations } from '../localization-provider/types';

export const enUS: LocalizationProviderTranslations = {
  dragRoleDescription: 'draggable',
  dragKeyboardInstructions:
    'Press Space or Enter to pick up. Use the arrow keys to move. ' +
    'Press Space or Enter again to drop, or Escape to cancel.',
  dragHandleLabel: ({ label }) => (label ? `Drag ${label}` : 'Drag'),
  dragDefaultItemLabel: ({ label }) => label || 'item',
  dragMultipleItemsLabel: ({ count }) => `${count} items`,
  dragDropPositionPhrase: ({ position, target }) =>
    position === 'on' ? `on ${target}` : `${position} ${target}`,
  dragAnnouncementPickedUp: ({ label }) =>
    `Grabbed ${label}. Use the arrow keys to move, Space or Enter to drop, Escape to cancel.`,
  dragAnnouncementMoved: ({ label, positionPhrase }) =>
    positionPhrase ? `${label} ${positionPhrase}` : null,
  dragAnnouncementDropped: ({ label, positionPhrase, hasDropTarget }) => {
    if (positionPhrase) {
      return `Dropped ${label} ${positionPhrase}.`;
    }
    return hasDropTarget ? `Dropped ${label}.` : `Dropped ${label}. No drop target.`;
  },
  dragAnnouncementCanceled: ({ label }) => `Canceled dragging ${label}.`,
};
