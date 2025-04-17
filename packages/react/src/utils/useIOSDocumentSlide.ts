import * as React from 'react';
import type { ElementProps } from '@floating-ui/react';
import { getTarget, isTypeableElement } from '@floating-ui/react/utils';
import { useEnhancedEffect } from './useEnhancedEffect';
import { isIOS } from './detectBrowser';
import { ownerDocument } from './owner';
import { useEventCallback } from './useEventCallback';

/**
 * Temporarily allows disabling the scroll lock when a typeable element (e.g. input or textarea)
 * is focused. This allows the document to slide up when the keyboard is shown on iOS.
 * Scroll needs to be manually restored since the sliding causes the page to scroll in the
 * background.
 * https://github.com/mui/base-ui/issues/1455
 */
export function useIOSDocumentSlide(params: {
  enabled: boolean;
  popupRef: React.RefObject<HTMLElement | null>;
  onDisableLock: () => void;
  onEnableLock: () => void;
}) {
  const {
    enabled,
    onDisableLock: onDisableLockParam,
    onEnableLock: onEnableLockParam,
    popupRef,
  } = params;

  const onDisableLock = useEventCallback(onDisableLockParam);
  const onEnableLock = useEventCallback(onEnableLockParam);

  const scrollRef = React.useRef({ x: 0, y: 0 });

  useEnhancedEffect(() => {
    if (!isIOS()) {
      return;
    }

    const doc = ownerDocument(popupRef.current);
    const html = doc.documentElement;
    if (enabled) {
      scrollRef.current = { x: html.scrollLeft, y: html.scrollTop };
    } else {
      html.scrollTop = scrollRef.current.y;
      html.scrollLeft = scrollRef.current.x;
    }
  }, [enabled, popupRef]);

  const floating: ElementProps['floating'] = React.useMemo(
    () => ({
      onFocus(event) {
        const target = getTarget(event.nativeEvent) as Element | null;
        if (isTypeableElement(target)) {
          onDisableLock();
          window.setTimeout(onEnableLock);
        }
      },
    }),
    [onDisableLock, onEnableLock],
  );

  return React.useMemo(() => ({ floating }), [floating]);
}
