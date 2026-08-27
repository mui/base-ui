import type { LocalizationProviderTranslations } from '../localization-provider/types';

export const frFR: LocalizationProviderTranslations = {
  dragRoleDescription: 'déplaçable',
  dragKeyboardInstructions:
    'Appuyez sur Espace ou Entrée pour saisir. Utilisez les flèches pour déplacer. ' +
    'Appuyez de nouveau sur Espace ou Entrée pour déposer, ou Échap pour annuler.',
  dragHandleLabel: ({ label }) => (label ? `Déplacer ${label}` : 'Déplacer'),
  dragDefaultItemLabel: ({ label }) => label || 'élément',
  dragMultipleItemsLabel: ({ count }) => `${count} éléments`,
  dragDropPositionPhrase: ({ position, target }) => {
    if (position === 'before') {
      return `avant ${target}`;
    }
    if (position === 'after') {
      return `après ${target}`;
    }
    return `sur ${target}`;
  },
  dragAnnouncementPickedUp: ({ label, count }) =>
    `${label} ${count > 1 ? 'saisis' : 'saisi'}. Utilisez les flèches pour déplacer, Espace ou Entrée pour déposer, Échap pour annuler.`,
  dragAnnouncementMoved: ({ label, positionPhrase }) =>
    positionPhrase ? `${label} ${positionPhrase}` : null,
  dragAnnouncementDropped: ({ label, count, positionPhrase, hasDropTarget }) => {
    const dropped = count > 1 ? 'déposés' : 'déposé';
    if (positionPhrase) {
      return `${label} ${dropped} ${positionPhrase}.`;
    }
    return hasDropTarget ? `${label} ${dropped}.` : `${label} ${dropped}. Aucune cible de dépôt.`;
  },
  dragAnnouncementCanceled: ({ label }) => `Déplacement de ${label} annulé.`,
};
