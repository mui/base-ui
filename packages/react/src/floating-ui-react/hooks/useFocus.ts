import * as React from 'react';
import { getWindow, isElement, isHTMLElement } from '@floating-ui/utils/dom';
import { isMac, isSafari } from '@base-ui/utils/detectBrowser';
import { useTimeout } from '@base-ui/utils/useTimeout';
import {
  activeElement,
  contains,
  getDocument,
  getTarget,
  isTypeableElement,
  matchesFocusVisible,
} from '../utils';

import type { ElementProps, FloatingContext, FloatingRootContext } from '../types';
import { createChangeEventDetails } from '../../utils/createBaseUIEventDetails';
import { REASONS } from '../../utils/reasons';
import { createAttribute } from '../utils/createAttribute';
import { FloatingUIOpenChangeDetails } from '../../utils/types';

const isMacSafari = isMac && isSafari;

export interface UseFocusProps {
  /**
   * Whether the Hook is enabled, including all internal Effects and event
   * handlers.
   * @default true
   */
  enabled?: boolean | undefined;
  /**
   * Whether the open state only changes if the focus event is considered
   * visible (`:focus-visible` CSS selector).
   * @default true
   */
  visibleOnly?: boolean | undefined;
  /**
   * Waits for the specified time before opening.
   * @default undefined
   */
  delay?: (number | (() => number | undefined)) | undefined;
}

/**
 * Opens the floating element while the reference element has focus, like CSS
 * `:focus`.
 * @see https://floating-ui.com/docs/useFocus
 */
export function useFocus(
  context: FloatingRootContext | FloatingContext,
  props: UseFocusProps = {},
): ElementProps {
  const store = 'rootStore' in context ? context.rootStore : context;

  const { events, dataRef } = store.context;
  const { enabled = true, visibleOnly = true, delay } = props;

  const blockFocusRef = React.useRef(false);
  // Track which reference should be blocked from re-opening after Escape/press dismissal.
  const blockedReferenceRef = React.useRef<Element | null>(null);
  const timeout = useTimeout();
  const keyboardModalityRef = React.useRef(true);

  React.useEffect(() => {
    const domReference = store.select('domReferenceElement');
    if (!enabled) {
      return undefined;
    }

    const win = getWindow(domReference);

    // If the reference was focused and the user left the tab/window, and the
    // floating element was not open, the focus should be blocked when they
    // return to the tab/window.
    function onBlur() {
      const currentDomReference = store.select('domReferenceElement');
      if (
        !store.select('open') &&
        isHTMLElement(currentDomReference) &&
        currentDomReference === activeElement(getDocument(currentDomReference))
      ) {
        blockFocusRef.current = true;
      }
    }

    function onKeyDown() {
      keyboardModalityRef.current = true;
    }

    function onPointerDown() {
      keyboardModalityRef.current = false;
    }

    win.addEventListener('blur', onBlur);

    if (isMacSafari) {
      win.addEventListener('keydown', onKeyDown, true);
      win.addEventListener('pointerdown', onPointerDown, true);
    }

    return () => {
      win.removeEventListener('blur', onBlur);

      if (isMacSafari) {
        win.removeEventListener('keydown', onKeyDown, true);
        win.removeEventListener('pointerdown', onPointerDown, true);
      }
    };
  }, [store, enabled]);

  React.useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    function onOpenChangeLocal(details: FloatingUIOpenChangeDetails) {
      if (details.reason === REASONS.triggerPress || details.reason === REASONS.escapeKey) {
        const referenceElement = store.select('domReferenceElement');
        if (isElement(referenceElement)) {
          blockedReferenceRef.current = referenceElement;
          blockFocusRef.current = true;
        }
      }
    }

    events.on('openchange', onOpenChangeLocal);
    return () => {
      events.off('openchange', onOpenChangeLocal);
    };
  }, [events, enabled, store]);

  const reference: ElementProps['reference'] = React.useMemo(
    () => ({
      onMouseLeave() {
        blockFocusRef.current = false;
        blockedReferenceRef.current = null;
      },
      onFocus(event) {
        const focusTarget = event.currentTarget as Element;
        if (blockFocusRef.current) {
          if (blockedReferenceRef.current === focusTarget) {
            return;
          }

          blockFocusRef.current = false;
          blockedReferenceRef.current = null;
        }

        const target = getTarget(event.nativeEvent);

        if (visibleOnly && isElement(target)) {
          // Safari fails to match `:focus-visible` if focus was initially
          // outside the document.
          if (isMacSafari && !event.relatedTarget) {
            if (!keyboardModalityRef.current && !isTypeableElement(target)) {
              return;
            }
          } else if (!matchesFocusVisible(target)) {
            return;
          }
        }

        const movedFromOtherTrigger =
          event.relatedTarget &&
          store.context.triggerElements.hasElement(event.relatedTarget as Element);

        const { nativeEvent, currentTarget } = event;
        const delayValue = typeof delay === 'function' ? delay() : delay;

        if (
          (store.select('open') && movedFromOtherTrigger) ||
          delayValue === 0 ||
          delayValue === undefined
        ) {
          store.setOpen(
            true,
            createChangeEventDetails(
              REASONS.triggerFocus,
              nativeEvent,
              currentTarget as HTMLElement,
            ),
          );
          return;
        }

        timeout.start(delayValue, () => {
          if (blockFocusRef.current) {
            return;
          }

          store.setOpen(
            true,
            createChangeEventDetails(
              REASONS.triggerFocus,
              nativeEvent,
              currentTarget as HTMLElement,
            ),
          );
        });
      },
      onBlur(event) {
        blockFocusRef.current = false;
        blockedReferenceRef.current = null;
        const relatedTarget = event.relatedTarget;
        const nativeEvent = event.nativeEvent;

        // Hit the non-modal focus management portal guard. Focus will be
        // moved into the floating element immediately after.
        const movedToFocusGuard =
          isElement(relatedTarget) &&
          relatedTarget.hasAttribute(createAttribute('focus-guard')) &&
          relatedTarget.getAttribute('data-type') === 'outside';

        // Wait for the window blur listener to fire.
        timeout.start(0, () => {
          const domReference = store.select('domReferenceElement');
          const activeEl = activeElement(domReference ? domReference.ownerDocument : document);

          // Focus left the page, keep it open.
          if (!relatedTarget && activeEl === domReference) {
            return;
          }

          // When focusing the reference element (e.g. regular click), then
          // clicking into the floating element, prevent it from hiding.
          // Note: it must be focusable, e.g. `tabindex="-1"`.
          // We can not rely on relatedTarget to point to the correct element
          // as it will only point to the shadow host of the newly focused element
          // and not the element that actually has received focus if it is located
          // inside a shadow root.
          if (
            contains(dataRef.current.floatingContext?.refs.floating.current, activeEl) ||
            contains(domReference, activeEl) ||
            movedToFocusGuard
          ) {
            return;
          }

          // If the next focused element is one of the triggers, do not close
          // the floating element. The focus handler of that trigger will
          // handle the open state.
          const nextFocusedElement = relatedTarget ?? activeEl;
          if (isElement(nextFocusedElement)) {
            const triggerElements = store.context.triggerElements;
            if (
              triggerElements.hasElement(nextFocusedElement) ||
              triggerElements.hasMatchingElement((trigger) => contains(trigger, nextFocusedElement))
            ) {
              return;
            }
          }

          store.setOpen(false, createChangeEventDetails(REASONS.triggerFocus, nativeEvent));
        });
      },
    }),
    [dataRef, store, visibleOnly, timeout, delay],
  );

  return React.useMemo(
    () => (enabled ? { reference, trigger: reference } : {}),
    [enabled, reference],
  );
}
