'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useBaseUiId } from '../utils/useBaseUiId';

/**
 * @internal
 */
export function useAriaLabelledBy(
  explicitAriaLabelledBy: string | undefined,
  labelId: string | undefined,
  labelSourceRef: React.RefObject<LabelSource | null>,
  enableFallback: boolean = true,
) {
  const [fallbackAriaLabelledBy, setFallbackAriaLabelledBy] = React.useState<string | undefined>();
  const generatedLabelId = useBaseUiId();
  const ariaLabelledBy = explicitAriaLabelledBy ?? labelId ?? fallbackAriaLabelledBy;

  // Fallback for custom controls labelled via a sibling native <label htmlFor=...>.
  // We derive the label id in a layout effect for the non-native control fallback path.
  useIsoLayoutEffect(() => {
    if (explicitAriaLabelledBy || labelId || !enableFallback) {
      if (fallbackAriaLabelledBy !== undefined) {
        setFallbackAriaLabelledBy(undefined);
      }
      return;
    }

    const nextAriaLabelledBy = getAriaLabelledBy(labelSourceRef.current?.labels, generatedLabelId);
    if (fallbackAriaLabelledBy !== nextAriaLabelledBy) {
      setFallbackAriaLabelledBy(nextAriaLabelledBy);
    }
  }, [
    explicitAriaLabelledBy,
    labelId,
    labelSourceRef,
    enableFallback,
    generatedLabelId,
    fallbackAriaLabelledBy,
  ]);

  return ariaLabelledBy;
}

function getAriaLabelledBy(
  labels: NodeListOf<HTMLLabelElement> | null | undefined,
  generatedLabelId: string | undefined,
) {
  if (!labels || labels.length === 0) {
    return undefined;
  }

  const firstLabel = labels[0];
  const firstLabelId = firstLabel.id;

  if (firstLabelId.length > 0) {
    return firstLabelId;
  }

  if (!generatedLabelId) {
    return undefined;
  }

  firstLabel.id = generatedLabelId;
  return generatedLabelId;
}

type LabelSource = HTMLElement & { labels?: NodeListOf<HTMLLabelElement> | null | undefined };
