'use client';
import * as React from 'react';
import { getWindow, isHTMLElement } from '@floating-ui/utils/dom';
import type { FloatingRootContext, ElementProps } from '@floating-ui/react';
import { activeElement, contains, getDocument } from '@floating-ui/react/utils';
import { useTimeout } from '../../utils/useTimeout';

interface UseFocusWithDelayProps {
  delay?: number;
}

/**
 * Adds support for delay, since Floating UI's `useFocus` hook does not support it.
 */
export function useFocusWithDelay(
  context: FloatingRootContext,
  props: UseFocusWithDelayProps = {},
): ElementProps {
  const { onOpenChange, elements, open, dataRef } = context;
  const { delay } = props;

  const timeout = useTimeout();
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

  const reference: ElementProps['reference'] = React.useMemo(
    () => ({
      onFocus(event) {
        const { nativeEvent } = event;
        timeout.start(delay ?? 0, () => {
          onOpenChange(true, nativeEvent, 'focus');
        });
      },
      onBlur(event) {
        blockFocusRef.current = false;
        const { relatedTarget, nativeEvent } = event;

        // Wait for the window blur listener to fire.
        timeout.start(0, () => {
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
    [delay, onOpenChange, elements.domReference, dataRef, timeout],
  );

  return React.useMemo(() => ({ reference }), [reference]);
}
