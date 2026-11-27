'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { NOOP } from '@base-ui/utils/empty';
import { useBaseUiId } from '../useBaseUiId';

// Reading `element.labels` scans the whole tree, so looking up every control's label that way is
// quadratic. Controls share one label index per tree instead, rebuilt whenever the observer saw a
// change that can affect label association, and dropped at the end of the task.
let labelIndex: Map<Node, Map<HTMLElement | null, HTMLLabelElement>> | undefined;
let labelObserver: MutationObserver;

function clearLabelIndex() {
  labelObserver.disconnect();
  labelIndex = undefined;
}

export function useAriaLabelledBy(
  explicitAriaLabelledBy: string | undefined,
  labelId: string | undefined,
  labelSourceRef: React.RefObject<HTMLElement | null>,
  enableFallback = true,
  labelSourceId?: string,
  ariaLabel?: string,
) {
  const [fallbackAriaLabelledBy, setFallbackAriaLabelledBy] = React.useState<string | undefined>();

  const generatedLabelId = useBaseUiId(labelSourceId ? `${labelSourceId}-label` : undefined);
  // A non-blank `aria-label` wins over any associated label, as it does on native inputs.
  const hasAriaLabel = Boolean(ariaLabel?.trim());
  const implicitLabelId = hasAriaLabel ? undefined : labelId;
  const ariaLabelledBy = explicitAriaLabelledBy ?? implicitLabelId ?? fallbackAriaLabelledBy;

  // Fallback for <span> controls labelled by wrapping/sibling native <label>.
  // Run after every commit so DOM association changes (e.g. label mount/unmount)
  // are reflected even when props/state deps are unchanged.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useIsoLayoutEffect(() => {
    const nextAriaLabelledBy =
      explicitAriaLabelledBy || labelId || hasAriaLabel || !enableFallback
        ? undefined
        : getAriaLabelledBy(labelSourceRef.current, generatedLabelId);

    if (fallbackAriaLabelledBy !== nextAriaLabelledBy) {
      setFallbackAriaLabelledBy(nextAriaLabelledBy);
    }
  });

  return ariaLabelledBy;
}

function getAriaLabelledBy(labelSource: HTMLElement | null, generatedLabelId?: string) {
  const label = labelSource && findAssociatedLabel(labelSource);
  if (!label) {
    return undefined;
  }

  if (!label.id && generatedLabelId) {
    label.id = generatedLabelId;
    // A label's own id doesn't affect association, so don't invalidate the index for it.
    labelObserver.takeRecords();
  }

  return label.id || undefined;
}

// Same result as `labelSource.labels[0]`.
function findAssociatedLabel(labelSource: HTMLElement) {
  const root = labelSource.getRootNode() as ParentNode;

  // Read `labels` once for the first lookup of a task (a single control committing) and for the first
  // lookup after a DOM change (React 19 rewrites `input.type` on every update), and leave building the
  // index to the next lookup. Chromium and WebKit leave `labels` empty when disconnected.
  if (!labelIndex || labelObserver.takeRecords().length) {
    if (!labelIndex) {
      labelObserver = new MutationObserver(NOOP);
      queueMicrotask(clearLabelIndex);
    }
    labelIndex = new Map();
    if (labelSource.isConnected) {
      return (labelSource as HTMLInputElement).labels?.[0];
    }
  }

  // A detached tree's root can be the label itself, which `querySelectorAll` skips.
  if ((root as HTMLLabelElement).control === labelSource) {
    return root as HTMLLabelElement;
  }

  let labels = labelIndex.get(root);
  if (!labels) {
    labelObserver.observe(root, {
      subtree: true,
      childList: true,
      attributeFilter: ['for', 'id', 'type'],
    });

    const nextLabels = new Map<HTMLElement | null, HTMLLabelElement>();
    root.querySelectorAll('label').forEach((label) => {
      if (!nextLabels.has(label.control)) {
        nextLabels.set(label.control, label);
      }
    });

    labels = nextLabels;
    labelIndex.set(root, labels);
  }

  return labels.get(labelSource);
}
