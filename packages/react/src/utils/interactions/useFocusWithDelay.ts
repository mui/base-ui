'use client';
import * as React from 'react';
import { getWindow, isElement, isHTMLElement } from '@floating-ui/utils/dom';
import { isMac, isSafari } from '@base-ui/utils/detectBrowser';
import { useTimeout } from '@base-ui/utils/useTimeout';
import type { FloatingContext, FloatingRootContext, ElementProps } from '../../floating-ui-react';
import { createChangeEventDetails } from '../createBaseUIEventDetails';
import { REASONS } from '../reasons';
import {
  activeElement,
  contains,
  getDocument,
  getTarget,
  isTypeableElement,
  matchesFocusVisible,
} from '../../floating-ui-react/utils';
import { createAttribute } from '../../floating-ui-react/utils/createAttribute';
import { FloatingUIOpenChangeDetails } from '../types';

interface UseFocusWithDelayProps {
  delay?: number | (() => number | undefined);
}

const isMacSafari = isMac && isSafari;

/**
 * Adds support for delay, since Floating UI's `useFocus` hook does not support it.
 */
export function useFocusWithDelay(
  context: FloatingRootContext | FloatingContext,
  props: UseFocusWithDelayProps = {},
): ElementProps {
  const store = 'rootStore' in context ? context.rootStore : context;
  const { dataRef, events } = store.context;
  const { delay } = props;

  const timeout = useTimeout();
  const blockFocusRef = React.useRef(false);
  const keyboardModalityRef = React.useRef(true);

  React.useEffect(() => {
    const domReference = store.select('domReferenceElement');
    const win = getWindow(domReference);

    // If the reference was focused and the user left the tab/window, and the preview card was not
    // open, the focus should be blocked when they return to the tab/window.
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
  }, [store]);

  React.useEffect(() => {
    function onOpenChangeLocal(details: FloatingUIOpenChangeDetails) {
      if (details.reason === REASONS.triggerPress || details.reason === REASONS.escapeKey) {
        blockFocusRef.current = true;
      }
    }

    events.on('openchange', onOpenChangeLocal);
    return () => {
      events.off('openchange', onOpenChangeLocal);
    };
  }, [events]);

  const reference: ElementProps['reference'] = React.useMemo(
    () => ({
      onMouseLeave() {
        blockFocusRef.current = false;
      },
      onFocus(event) {
        if (blockFocusRef.current) {
          return;
        }

        const target = getTarget(event.nativeEvent);

        if (isElement(target)) {
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

        // If focus moves from another trigger and the popup was open, call setOpen with the current trigger immediately.
        if (
          (store.select('open') && movedFromOtherTrigger) ||
          delayValue === 0 ||
          delayValue === undefined
        ) {
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
          const currentDomReference = store.select('domReferenceElement');
          const activeEl = activeElement(
            currentDomReference ? currentDomReference.ownerDocument : document,
          );

          // Focus left the page, keep it open.
          if (!relatedTarget && activeEl === currentDomReference) {
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
            contains(currentDomReference, activeEl) ||
            movedToFocusGuard
          ) {
            return;
          }

          // If the next focused element is one of the triggers, do not close
          // the floating element. The focus handler of that trigger will
          // handle the open state.
          if (store.context.triggerElements.hasElement(event.relatedTarget as Element)) {
            return;
          }

          store.setOpen(false, createChangeEventDetails(REASONS.triggerFocus, nativeEvent));
        });
      },
    }),
    [delay, store, dataRef, timeout],
  );

  return React.useMemo(() => ({ reference, trigger: reference }), [reference]);
}
