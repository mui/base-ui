import { useEnhancedEffect } from './useEnhancedEffect';
import { useId } from './useId';

const activeLocks = new Set<string>();
let originalStyles = {};
let originalBodyOverflow = '';

/**
 * Locks the scroll of the document when enabled.
 *
 * @param enabled - Whether to enable the scroll lock.
 */
export function useScrollLock(enabled: boolean = true) {
  const lockId = useId();

  useEnhancedEffect(() => {
    if (!enabled || !lockId) {
      return undefined;
    }

    const html = document.documentElement;
    const rootStyle = html.style;
    const bodyStyle = document.body.style;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    let resizeRaf: number;
    let scrollX: number;
    let scrollY: number;

    function lockScroll() {
      const offsetLeft = window.visualViewport?.offsetLeft || 0;
      const offsetTop = window.visualViewport?.offsetTop || 0;
      scrollX = rootStyle.left ? parseFloat(rootStyle.left) : window.scrollX;
      scrollY = rootStyle.top ? parseFloat(rootStyle.top) : window.scrollY;

      activeLocks.add(lockId!);

      // We don't need to lock the scroll if there's already an active lock. However, it's possible
      // that the one that originally locked it doesn't get cleaned up last. In that case, one of the
      // newer locks needs to perform the style and scroll restoration.
      if (activeLocks.size > 1) {
        return cleanup;
      }

      originalStyles = {
        position: rootStyle.position,
        top: rootStyle.top,
        left: rootStyle.left,
        right: rootStyle.right,
        ...(scrollbarWidth && {
          overflowX: rootStyle.overflowX,
          overflowY: rootStyle.overflowY,
        }),
      };
      originalBodyOverflow = bodyStyle.overflow;

      bodyStyle.overflow = 'hidden';

      Object.assign(rootStyle, {
        position: html.scrollHeight > html.clientHeight ? 'fixed' : '',
        top: `${-(scrollY - Math.floor(offsetTop))}px`,
        left: `${-(scrollX - Math.floor(offsetLeft))}px`,
        right: '0',
        ...(scrollbarWidth && {
          overflowY: html.scrollHeight > html.clientHeight ? 'scroll' : 'hidden',
          overflowX: html.scrollWidth > html.clientWidth ? 'scroll' : 'hidden',
        }),
      });

      return undefined;
    }

    function cleanup() {
      if (!lockId) {
        return;
      }

      activeLocks.delete(lockId);

      if (activeLocks.size === 0) {
        Object.assign(rootStyle, originalStyles);
        bodyStyle.overflow = originalBodyOverflow;

        if (window.scrollTo.toString().includes('[native code]')) {
          window.scrollTo(scrollX, scrollY);
        }
      }
    }

    const handleResize = () => {
      cleanup();
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(lockScroll);
    };

    lockScroll();
    window.addEventListener('resize', handleResize);

    return () => {
      cleanup();
      window.removeEventListener('resize', handleResize);
    };
  }, [lockId, enabled]);
}
