'use client';
import * as React from 'react';
import { isHTMLElement } from '@floating-ui/utils/dom';
import { ownerDocument } from '@base-ui/utils/owner';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { INTERACTIVE_SELECTOR } from '../../floating-ui-react/utils/constants';
import { contains, getTarget } from '../shadowDom';
import { useRegisteredLabelId } from '../../utils/useRegisteredLabelId';
import { useLabelableContext } from './LabelableContext';

/**
 * Whether the event originated from interactive content nested inside the label.
 * `closest()` keeps walking past the label, so interactive ancestors must be rejected.
 * Portaled descendants remain valid because their events bubble through the label in React.
 */
function isInteractiveTarget(event: React.SyntheticEvent<Element>) {
  const target = getTarget(event.nativeEvent) as Element | null;
  const match = target?.closest(INTERACTIVE_SELECTOR);
  return match != null && !contains(match, event.currentTarget);
}

export function getControlElement(labelElement: Element, controlId: string) {
  // `getElementById` on the owner document cannot see into shadow roots.
  const rootNode = labelElement.getRootNode() as Document | ShadowRoot;
  return (
    rootNode.getElementById?.(controlId) ?? ownerDocument(labelElement).getElementById(controlId)
  );
}

export function useLabel(params: UseLabelParameters = {}): UseLabelReturnValue {
  const {
    id: idProp,
    fallbackControlId,
    native = false,
    setLabelId: setLabelIdProp,
    focusControl: focusControlProp,
  } = params;

  const { controlId: contextControlId, setLabelId: setContextLabelId } = useLabelableContext();

  const syncLabelId = useStableCallback((nextLabelId: React.SetStateAction<string | undefined>) => {
    setContextLabelId(nextLabelId);
    setLabelIdProp?.(nextLabelId);
  });

  const id = useRegisteredLabelId(idProp, syncLabelId);

  const resolvedControlId = contextControlId ?? fallbackControlId;

  function focusControl(event: React.MouseEvent) {
    if (focusControlProp) {
      focusControlProp(event, resolvedControlId);
      return;
    }

    if (!resolvedControlId) {
      return;
    }

    const controlElement = getControlElement(event.currentTarget, resolvedControlId);
    if (isHTMLElement(controlElement)) {
      focusElementWithVisible(controlElement);
    }
  }

  function handleInteraction(event: React.MouseEvent) {
    if (isInteractiveTarget(event)) {
      return;
    }

    // Prevent text selection when double clicking label.
    if (!event.defaultPrevented && event.detail > 1) {
      event.preventDefault();
    }

    if (native) {
      return;
    }

    focusControl(event);
  }

  return native
    ? {
        id,
        htmlFor: resolvedControlId ?? undefined,
        onMouseDown: handleInteraction,
      }
    : {
        id,
        onClick: handleInteraction,
        onPointerDown(event: React.PointerEvent) {
          if (!isInteractiveTarget(event)) {
            event.preventDefault();
          }
        },
      };
}

export interface UseLabelParameters {
  id?: string | undefined;
  /**
   * Control id used when no labelable context control id exists.
   */
  fallbackControlId?: string | undefined;
  /**
   * Whether the rendered element is a native `<label>`.
   * @default false
   */
  native?: boolean | undefined;
  /**
   * Additional callback to sync the current label id with local component state/store.
   */
  setLabelId?: React.Dispatch<React.SetStateAction<string | undefined>> | undefined;
  /**
   * Custom focus handler for non-native labels.
   * If omitted, focus behavior targets the resolved control id.
   */
  focusControl?: ((event: React.MouseEvent, controlId: string | undefined) => void) | undefined;
}

export type UseLabelReturnValue = React.HTMLAttributes<any> & React.LabelHTMLAttributes<any>;

export function focusElementWithVisible(element: HTMLElement) {
  element.focus({
    // Available from Chrome 144+ (January 2026).
    // Safari and Firefox already support it.
    focusVisible: true,
  });
}
