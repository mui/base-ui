'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import type { ElementProps, FloatingRootContext } from '../types';
import { contains } from '../utils/element';
import { stopEvent } from '../utils/event';
import { useTypeahead } from './useTypeahead';
import type { UseTypeaheadProps } from './useTypeahead';

export interface UsePopupTypeaheadProps extends UseTypeaheadProps {}

/**
 * Typeahead for a popup and its trigger. While the popup is open, typing keys don't reach other
 * handlers. The typing session continues while focus moves between the trigger and the popup, and
 * resets when the popup opens or closes.
 * @see https://floating-ui.com/docs/useTypeahead
 */
export function usePopupTypeahead(
  store: FloatingRootContext,
  props: UsePopupTypeaheadProps,
): ElementProps {
  const { enabled = true, selectedIndex = null, listRef, onTyping: onTypingProp } = props;
  const open = store.useState('open');
  const onTyping = useStableCallback(onTypingProp);

  const typeahead = useTypeahead(props);

  const onKeyDown = useStableCallback((event: React.KeyboardEvent) => {
    // While the popup is open, typing keys belong to typeahead, so they don't reach other
    // handlers. Space is stopped by the typeahead itself while the user is typing.
    if (
      enabled &&
      open &&
      listRef.current != null &&
      event.key.length === 1 &&
      event.key !== ' ' &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey
    ) {
      stopEvent(event);
      onTyping(true);
    }
    typeahead.onKeyDown(event);
  });

  const onBlur = useStableCallback((event: React.FocusEvent) => {
    const next = event.relatedTarget as Element | null;
    const currentDomReferenceElement = store.select('domReferenceElement');
    const currentFloatingElement = store.select('floatingElement');
    const withinComposite =
      contains(currentDomReferenceElement, next) || contains(currentFloatingElement, next);

    // Keep the session if focus moves within the composite (reference <-> floating).
    if (withinComposite) {
      return;
    }

    // End the current typing session when focus leaves the composite entirely.
    typeahead.endSession();
  });

  useIsoLayoutEffect(() => {
    if (!open && selectedIndex !== null) {
      return;
    }

    typeahead.reset();
  }, [open, selectedIndex, typeahead]);

  const sharedProps = React.useMemo(() => ({ onKeyDown, onBlur }), [onKeyDown, onBlur]);

  return React.useMemo(
    () => (enabled ? { reference: sharedProps, floating: sharedProps } : {}),
    [enabled, sharedProps],
  );
}
