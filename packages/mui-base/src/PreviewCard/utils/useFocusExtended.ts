'use client';
import * as React from 'react';
import { getWindow, isHTMLElement } from '@floating-ui/utils/dom';
import type { FloatingRootContext, ElementProps } from '@floating-ui/react';
import { activeElement, contains, getDocument } from '@floating-ui/react/utils';
import { OPEN_DELAY } from './constants';

interface UseFocusExtendedProps {
  delay?: number;
}

/**
 * @ignore - internal hook.
 * Adds support for delay, since Floating UI's `useFocus` hook does not support it.
 */
export function useFocusExtended(
  context: FloatingRootContext,
  props: UseFocusExtendedProps = {},
): ElementProps {
  const { onOpenChange, elements, open, dataRef } = context;
  const { delay = OPEN_DELAY } = props;

  const timeoutRef = React.useRef(-1);
  const blockFocusRef = React.useRef(false);

  React.useEffect(() => {
    const win = getWindow(elements.domReference);

    // If the reference was focused and the user left the tab/window, and the preview card was not
    // open, the focus should be blocked when they return to the tab/window.
    function handleBlur() {
      if (
        !open &&
        isHTMLElement(elements.domReference) &&
        elements.domReference === activeElement(getDocument(elements.domReference))
      ) {
        blockFocusRef.current = true;
      }
    }

    win.addEventListener('blur', handleBlur);
    return () => {
      win.removeEventListener('blur', handleBlur);
    };
  }, [elements.domReference, open]);

  React.useEffect(() => {
    return () => {
      window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const reference: ElementProps['reference'] = React.useMemo(
    () => ({
      onFocus(event) {
        const { nativeEvent } = event;
        timeoutRef.current = window.setTimeout(() => {
          onOpenChange(true, nativeEvent, 'focus');
        }, delay);
      },
      onBlur(event) {
        blockFocusRef.current = false;
        const { relatedTarget, nativeEvent } = event;

        window.clearTimeout(timeoutRef.current);

        // Wait for the window blur listener to fire.
        timeoutRef.current = window.setTimeout(() => {
          const activeEl = activeElement(
            elements.domReference ? elements.domReference.ownerDocument : document,
          );

          // Focus left the page, keep it open.
          if (!relatedTarget && activeEl === elements.domReference) {
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
            contains(elements.domReference, activeEl)
          ) {
            return;
          }

          onOpenChange(false, nativeEvent, 'focus');
        });
      },
    }),
    [delay, onOpenChange, elements.domReference, dataRef],
  );

  return React.useMemo(() => ({ reference }), [reference]);
}
