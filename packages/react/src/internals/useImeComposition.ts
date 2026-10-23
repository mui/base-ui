'use client';
import * as React from 'react';
import { platform } from '@base-ui/utils/platform';

/**
 * Buffers IME composition text and commits it once on `compositionend`, so intermediate
 * `change` events don't filter or fill with half-composed text.
 * Some Android keyboards treat all typing as one composition, so Android never buffers and
 * keeps committing through `change`.
 */
export function useImeComposition(
  onCommit: (value: string, event: React.CompositionEvent<HTMLInputElement>) => void,
) {
  const [composingValue, setComposingValue] = React.useState<string | null>(null);
  const isComposingRef = React.useRef(false);

  return {
    /** The text to render while composing, or `null` when not composing. */
    composingValue,
    isComposingRef,
    /** Buffers `value` when a composition is active, and returns whether it did. */
    bufferChange(value: string) {
      if (!isComposingRef.current) {
        return false;
      }
      setComposingValue(value);
      return true;
    },
    props: {
      onCompositionStart(event: React.CompositionEvent<HTMLInputElement>) {
        if (platform.os.android) {
          return;
        }
        isComposingRef.current = true;
        setComposingValue(event.currentTarget.value);
      },
      onCompositionEnd(event: React.CompositionEvent<HTMLInputElement>) {
        if (!isComposingRef.current) {
          return;
        }
        isComposingRef.current = false;
        setComposingValue(null);
        onCommit(event.currentTarget.value, event);
      },
    },
  };
}
