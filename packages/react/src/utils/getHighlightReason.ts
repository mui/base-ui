import type * as React from 'react';
import { REASONS } from '../internals/reasons';

/**
 * The `onItemHighlighted` reason for a list navigation event, matching the event type that the
 * reason promises in its details.
 */
export function getHighlightReason(
  event: Event | React.SyntheticEvent | undefined,
): typeof REASONS.keyboard | typeof REASONS.pointer | typeof REASONS.none {
  if (event == null) {
    return REASONS.none;
  }
  if (event.type.startsWith('key')) {
    return REASONS.keyboard;
  }
  if (event.type.startsWith('mouse') || event.type.startsWith('pointer')) {
    return REASONS.pointer;
  }
  return REASONS.none;
}
