import * as React from 'react';
import type { ElementProps } from '@floating-ui/react';
import { getTarget, isTypeableElement } from '@floating-ui/react/utils';
import { useEnhancedEffect } from './useEnhancedEffect';
import { isIOS } from './detectBrowser';
import { ownerDocument } from './owner';
import { useEventCallback } from './useEventCallback';
import { getPreventScrollCount } from './useScrollLock';

/**
 * Temporarily allows disabling the scroll lock when a typeable element (e.g. input or textarea)
 * is focused. This allows the document to slide up when the keyboard is shown on iOS.
 * Scroll needs to be manually restored since the sliding causes the page to scroll in the
 * background.
 * https://github.com/mui/base-ui/issues/1455
 */
export function useIOSKeyboardSlideFix(params: {
  enabled: boolean;
  popupRef: React.RefObject<HTMLElement | null>;
  setLock: (lock: boolean) => void;
}) {
  const { enabled, setLock: setLockParam, popupRef } = params;

  const setLock = useEventCallback(setLockParam);

  const hasBeenEnabledRef = React.useRef(enabled);

  useEnhancedEffect(() => {
    if (!isIOS()) {
      return undefined;
    }

    if (enabled) {
      hasBeenEnabledRef.current = true;
    }

    if (!hasBeenEnabledRef.current) {
      return undefined;
    }

    const doc = ownerDocument(popupRef.current);
    const html = doc.documentElement;
    if (enabled) {
      const scrollX = html.scrollLeft;
      const scrollY = html.scrollTop;
      return () => {
        // Doesn't work on Chrome iOS; Safari and Edge work correctly
        if (getPreventScrollCount() === 0) {
          html.scrollTop = scrollY;
          html.scrollLeft = scrollX;
        }
      };
    }

    return undefined;
  }, [enabled, popupRef]);

  const handlePress = useEventCallback((event: React.FocusEvent | React.MouseEvent) => {
    if (!isIOS()) {
      return;
    }

    const target = getTarget(event.nativeEvent) as Element | null;
    if (isTypeableElement(target)) {
      setLock(false);
      setTimeout(() => setLock(true));
    }
  });

  return React.useMemo(
    () => ({
      floating: {
        onFocus: handlePress,
        onClick: handlePress,
      } satisfies ElementProps['floating'],
    }),
    [handlePress],
  );
}
