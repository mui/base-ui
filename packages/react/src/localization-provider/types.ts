export interface LocalizationProviderTranslations {
  /** Value for `aria-roledescription` on a drag handle. */
  dragRoleDescription: string;
  /** Keyboard-drag instructions read when a drag handle is focused. */
  dragKeyboardInstructions: string;
  /** Accessible name for a drag handle that has none of its own. */
  dragHandleLabel: (params: { label?: string | undefined }) => string;
  /** Label for a dragged element in keyboard-drag announcements. */
  dragDefaultItemLabel: (params: { label?: string | undefined }) => string;
  /** Label for a multi-item keyboard drag. */
  dragMultipleItemsLabel: (params: { count: number }) => string;
  /** Phrase describing where the dragged item lands relative to a target. */
  dragDropPositionPhrase: (params: {
    position: 'before' | 'after' | 'on';
    target: string;
  }) => string;
  /** Announced when a keyboard drag picks up one or more items. */
  dragAnnouncementPickedUp: (params: { label: string; count: number }) => string | null;
  /** Announced as a keyboard drag moves. */
  dragAnnouncementMoved: (params: {
    label: string;
    count: number;
    positionPhrase: string | null;
  }) => string | null;
  /** Announced when a keyboard drag drops one or more items. */
  dragAnnouncementDropped: (params: {
    label: string;
    count: number;
    positionPhrase: string | null;
    hasDropTarget: boolean;
  }) => string | null;
  /** Announced when a keyboard drag is canceled. */
  dragAnnouncementCanceled: (params: { label: string; count: number }) => string | null;
}
