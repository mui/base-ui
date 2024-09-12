import { useEnhancedEffect } from './useEnhancedEffect';
import { useId } from './useId';

const activeLocks = new Set<string>();

/**
 * Locks the scroll of the document when enabled.
 *
 * @param enabled - Whether to enable the scroll lock.
 */
export function useScrollLock(enabled: boolean = true) {
  const lockId = useId();

  useEnhancedEffect(() => {
    if (!enabled || !lockId || activeLocks.size > 0) {
      return undefined;
    }

    activeLocks.add(lockId);

    const html = document.documentElement;
    const rootStyle = html.style;
    const scrollX = rootStyle.left ? parseFloat(rootStyle.left) : window.scrollX;
    const scrollY = rootStyle.top ? parseFloat(rootStyle.top) : window.scrollY;
    const offsetLeft = window.visualViewport?.offsetLeft || 0;
    const offsetTop = window.visualViewport?.offsetTop || 0;

    const originalStyles = {
      position: rootStyle.position,
      top: rootStyle.top,
      left: rootStyle.left,
      right: rootStyle.right,
      overflowX: rootStyle.overflowX,
      overflowY: rootStyle.overflowY,
    };

    Object.assign(rootStyle, {
      position: 'fixed',
      top: `${-(scrollY - Math.floor(offsetTop))}px`,
      left: `${-(scrollX - Math.floor(offsetLeft))}px`,
      right: '0',
      overflowY: html.scrollHeight > html.clientHeight ? 'scroll' : 'hidden',
      overflowX: html.scrollWidth > html.clientWidth ? 'scroll' : 'hidden',
    });

    return () => {
      activeLocks.delete(lockId);

      if (activeLocks.size === 0) {
        Object.assign(rootStyle, originalStyles);

        if (window.scrollTo.toString().includes('[native code]')) {
          window.scrollTo(scrollX, scrollY);
        }
      }
    };
  }, [lockId, enabled]);
}
