'use client';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';

/**
 * Keeps the anchor the interaction hooks see on the element the popup belongs to. A press on
 * another element and positioning both change it, so it's restored whenever the open state or the
 * elements change.
 */
export function useValuePopupAnchor(
  store: { set(key: 'anchorElement', value: Element | null): void },
  open: boolean,
  anchorElement: Element | null,
  positionerElement: HTMLElement | null,
) {
  useIsoLayoutEffect(() => {
    store.set('anchorElement', anchorElement);
  }, [open, anchorElement, positionerElement, store]);
}
