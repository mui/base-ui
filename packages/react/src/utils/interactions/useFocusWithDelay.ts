'use client';
import * as React from 'react';
import { getWindow, isHTMLElement } from '@floating-ui/utils/dom';
import { useTimeout } from '@base-ui-components/utils/useTimeout';
import type { FloatingRootContext, ElementProps } from '../../floating-ui-react';
import { createChangeEventDetails } from '../createBaseUIEventDetails';
import { REASONS } from '../reasons';
import { activeElement, contains, getDocument } from '../../floating-ui-react/utils';

interface UseFocusWithDelayProps {
  delay?: number | (() => number | undefined);
}

/**
 * Adds support for delay, since Floating UI's `useFocus` hook does not support it.
 */
export function useFocusWithDelay(
  store: FloatingRootContext,
  props: UseFocusWithDelayProps = {},
): ElementProps {
  const domReference = store.useState('domReferenceElement');
  const dataRef = store.context.dataRef;
  const { delay } = props;

  const timeout = useTimeout();
  const blockFocusRef = React.useRef(false);

  React.useEffect(() => {
    // TODO: remove domReference from dependencies or split this hook into trigger/popup hooks.
    const win = getWindow(domReference);

    // If the reference was focused and the user left the tab/window, and the preview card was not
    // open, the focus should be blocked when they return to the tab/window.
    function handleBlur() {
      const currentDomReference = store.select('domReferenceElement');
      if (
        !store.select('open') &&
        isHTMLElement(currentDomReference) &&
        currentDomReference === activeElement(getDocument(currentDomReference))
      ) {
        blockFocusRef.current = true;
      }
    }

    win.addEventListener('blur', handleBlur);
    return () => {
      win.removeEventListener('blur', handleBlur);
    };
  }, [store, domReference]);

  const reference: ElementProps['reference'] = React.useMemo(
    () => ({
      onFocus(event) {
        const { nativeEvent } = event;
        const delayValue = typeof delay === 'function' ? delay() : delay;
        timeout.start(delayValue ?? 0, () => {
          store.setOpen(true, createChangeEventDetails(REASONS.triggerFocus, nativeEvent));
        });
      },
      onBlur(event) {
        blockFocusRef.current = false;
        const { relatedTarget, nativeEvent } = event;

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
            contains(currentDomReference, activeEl)
          ) {
            return;
          }

          store.setOpen(false, createChangeEventDetails(REASONS.triggerFocus, nativeEvent));
        });
      },
    }),
    [delay, store, dataRef, timeout],
  );

  return React.useMemo(() => ({ reference }), [reference]);
}
