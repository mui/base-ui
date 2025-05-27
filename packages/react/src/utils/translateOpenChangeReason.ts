import type { OpenChangeReason as FloatingUIOpenChangeReason } from '@floating-ui/react';

export type BaseOpenChangeReason =
  | 'trigger-press'
  | 'trigger-hover'
  | 'trigger-focus'
  | 'focus-out'
  | 'escape-key'
  | 'outside-press'
  | 'list-navigation'
  | 'item-press'
  | 'cancel-open';

export function translateOpenChangeReason(
  nativeReason?: FloatingUIOpenChangeReason,
): BaseOpenChangeReason | undefined {
  if (!nativeReason) {
    return undefined;
  }

  return (
    {
      // Identical mappings
      'focus-out': 'focus-out',
      'escape-key': 'escape-key',
      'outside-press': 'outside-press',
      'list-navigation': 'list-navigation',

      // New mappings
      click: 'trigger-press',
      hover: 'trigger-hover',
      focus: 'trigger-focus',
      'reference-press': 'trigger-press',
      'safe-polygon': 'trigger-hover',
      'ancestor-scroll': undefined, // Not supported
    } as const
  )[nativeReason];
}
