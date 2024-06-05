import { useEnhancedEffect } from './useEnhancedEffect';
import { useId } from './useId';
import { isIOS } from './detectBrowser';

const activeLocks = new Set<string>();

/**
 * Locks the scroll of the document when enabled.
 *
 * @param enabled - Whether to enable the scroll lock.
 *
 * API:
 *
 * - [useScrollLock API](https://mui.com/base-ui/api/use-scroll-lock/)
 */
export function useScrollLock(enabled: boolean = true) {
  // Based on Floating UI's FloatingOverlay

  const lockId = useId();
  useEnhancedEffect(() => {
    if (!enabled) {
      return undefined;
    }

    activeLocks.add(lockId!);

    const rootStyle = document.documentElement.style;
    // RTL <body> scrollbar
    const scrollbarX =
      Math.round(document.documentElement.getBoundingClientRect().left) +
      document.documentElement.scrollLeft;
    const paddingProp = scrollbarX ? 'paddingLeft' : 'paddingRight';
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const scrollX = rootStyle.left ? parseFloat(rootStyle.left) : window.scrollX;
    const scrollY = rootStyle.top ? parseFloat(rootStyle.top) : window.scrollY;

    rootStyle.overflow = 'hidden';

    if (scrollbarWidth) {
      rootStyle[paddingProp] = `${scrollbarWidth}px`;
    }

    // Only iOS doesn't respect `overflow: hidden` on document.body, and this
    // technique has fewer side effects.
    if (isIOS()) {
      // iOS 12 does not support `visualViewport`.
      const offsetLeft = window.visualViewport?.offsetLeft || 0;
      const offsetTop = window.visualViewport?.offsetTop || 0;

      Object.assign(rootStyle, {
        position: 'fixed',
        top: `${-(scrollY - Math.floor(offsetTop))}px`,
        left: `${-(scrollX - Math.floor(offsetLeft))}px`,
        right: '0',
      });
    }

    return () => {
      activeLocks.delete(lockId!);

      if (activeLocks.size === 0) {
        Object.assign(rootStyle, {
          overflow: '',
          [paddingProp]: '',
        });

        if (isIOS()) {
          Object.assign(rootStyle, {
            position: '',
            top: '',
            left: '',
            right: '',
          });
          window.scrollTo(scrollX, scrollY);
        }
      }
    };
  }, [lockId, enabled]);
}
