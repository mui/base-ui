import type { OpenChangeReason as NativeReason } from '@floating-ui/react';

export type OpenChangeReason =
  | 'click'
  | 'hover'
  | 'focus'
  | 'focus-out'
  | 'escape-key'
  | 'outside-press'
  | 'trigger-press';

export function translateOpenChangeReason(
  nativeReason?: NativeReason,
): OpenChangeReason | undefined {
  if (!nativeReason) {
    return undefined;
  }

  return (
    {
      // Identical mappings
      click: 'click',
      hover: 'hover',
      focus: 'focus',
      'focus-out': 'focus-out',
      'escape-key': 'escape-key',
      'outside-press': 'outside-press',
      // New mappings
      'reference-press': 'trigger-press',
      'safe-polygon': 'hover',
      'ancestor-scroll': undefined, // Not supported
      'list-navigation': undefined, // Unnecessary to expose currently
    } as const
  )[nativeReason];
}
