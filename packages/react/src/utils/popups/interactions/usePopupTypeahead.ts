'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { contains } from '@base-ui/utils/shadowDom';
import type { ElementProps, PopupInteractionStore } from '../types';
import { useTypeahead } from './useTypeahead';
import type { UseTypeaheadProps } from './useTypeahead';

export interface UsePopupTypeaheadProps extends Omit<
  UseTypeaheadProps,
  'getLabel' | 'getCount' | 'stopTypingKeys'
> {
  /**
   * A ref which contains all strings of the list items, by index.
   */
  listRef: React.RefObject<Array<string | null>>;
}

/**
 * Typeahead for a popup and its trigger. While the popup is open, typing keys don't reach other
 * handlers. The typing session continues while focus moves between the trigger and the popup, and
 * resets when the popup opens or closes.
 * @see https://floating-ui.com/docs/useTypeahead
 */
export function usePopupTypeahead(
  store: PopupInteractionStore,
  props: UsePopupTypeaheadProps,
): ElementProps {
  const { listRef, enabled = true, selectedIndex = null } = props;
  const open = store.useState('open');

  const { onKeyDown, endSession, reset } = useTypeahead({
    ...props,
    getLabel: (index) => listRef.current[index],
    getCount: () => listRef.current.length,
    stopTypingKeys: open,
  });

  const onBlur = useStableCallback((event: React.FocusEvent) => {
    const next = event.relatedTarget as Element | null;
    const currentDomReferenceElement = store.select('anchorElement');
    const currentFloatingElement = store.select('positionerElement');
    const withinComposite =
      contains(currentDomReferenceElement, next) || contains(currentFloatingElement, next);

    // Keep the session if focus moves within the composite (reference <-> floating).
    if (withinComposite) {
      return;
    }

    // End the current typing session when focus leaves the composite entirely.
    endSession();
  });

  useIsoLayoutEffect(() => {
    if (!open && selectedIndex !== null) {
      return;
    }

    reset();
  }, [open, selectedIndex, reset]);

  const sharedProps = React.useMemo(() => ({ onKeyDown, onBlur }), [onKeyDown, onBlur]);

  return React.useMemo(
    () => (enabled ? { reference: sharedProps, floating: sharedProps } : {}),
    [enabled, sharedProps],
  );
}
