'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { contains } from '@base-ui/utils/shadowDom';
import type { ElementProps, PopupInteractionStore } from '../types';
import { stopEvent } from '../event';
import { useTypeahead } from './useTypeahead';
import type { UseTypeaheadProps } from './useTypeahead';

export type UsePopupTypeaheadProps = UseTypeaheadProps;

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
  const { enabled = true, selectedIndex = null, onTyping: onTypingProp } = props;
  const open = store.useState('open');
  const onTyping = useStableCallback(onTypingProp);

  const typeahead = useTypeahead(props);

  const onKeyDown = useStableCallback((event: React.KeyboardEvent) => {
    // While the popup is open, typing keys belong to typeahead, so they don't reach other
    // handlers. Space is stopped by the typeahead itself while the user is typing.
    if (
      enabled &&
      open &&
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
    const currentDomReferenceElement = store.select('anchorElement');
    const currentFloatingElement = store.select('positionerElement');
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
