import type * as React from 'react';

/** Whether a key types a character, which belongs in the filter input. */
export function isTypingKey(event: React.KeyboardEvent) {
  return (
    event.key.length === 1 && event.key !== ' ' && !event.ctrlKey && !event.metaKey && !event.altKey
  );
}
