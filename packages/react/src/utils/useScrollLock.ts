import { isIOS, isWebKit } from './detectBrowser';
import { ownerDocument } from './owner';
import { useEnhancedEffect } from './useEnhancedEffect';

let originalHtmlStyles = {};
let originalBodyStyles = {};
let preventScrollCount = 0;
let restore: () => void = () => {};

function preventScrollIOS(referenceElement?: Element | null) {
  const doc = ownerDocument(referenceElement);
  const html = doc.documentElement;
  const body = doc.body;
  const htmlStyle = html.style;
  const bodyStyle = body.style;

  // iOS 12 does not support `visualViewport`.
  const offsetLeft = window.visualViewport?.offsetLeft || 0;
  const offsetTop = window.visualViewport?.offsetTop || 0;
  const scrollX = bodyStyle.left ? parseFloat(bodyStyle.left) : window.scrollX;
  const scrollY = bodyStyle.top ? parseFloat(bodyStyle.top) : window.scrollY;

  originalHtmlStyles = {
    overflowX: htmlStyle.overflowX,
    overflowY: htmlStyle.overflowY,
  };

  originalBodyStyles = {
    position: bodyStyle.position,
    top: bodyStyle.top,
    left: bodyStyle.left,
    right: bodyStyle.right,
    overflowX: bodyStyle.overflowX,
    overflowY: bodyStyle.overflowY,
  };

  Object.assign(htmlStyle, {
    overflow: 'visible',
  });

  Object.assign(bodyStyle, {
    position: 'fixed',
    top: `${-(scrollY - Math.floor(offsetTop))}px`,
    left: `${-(scrollX - Math.floor(offsetLeft))}px`,
    right: '0',
    overflow: 'hidden',
  });

  return () => {
    Object.assign(htmlStyle, originalHtmlStyles);
    Object.assign(bodyStyle, originalBodyStyles);
    window.scrollTo({ left: scrollX, top: scrollY, behavior: 'instant' });
  };
}

function preventScrollStandard(referenceElement?: Element | null) {
  const doc = ownerDocument(referenceElement);
  const html = doc.documentElement;
  const body = doc.body;
  const htmlStyle = html.style;
  const bodyStyle = body.style;

  let resizeRaf: number;
  let scrollX: number;
  let scrollY: number;

  function lockScroll() {
    const htmlComputedStyles = getComputedStyle(html);
    const bodyComputedStyles = getComputedStyle(body);
    const hasConstantOverflowY =
      htmlComputedStyles.overflowY === 'scroll' || bodyComputedStyles.overflowY === 'scroll';
    const hasConstantOverflowX =
      htmlComputedStyles.overflowX === 'scroll' || bodyComputedStyles.overflowX === 'scroll';

    scrollX = htmlStyle.left ? parseFloat(htmlStyle.left) : window.scrollX;
    scrollY = htmlStyle.top ? parseFloat(htmlStyle.top) : window.scrollY;

    originalHtmlStyles = {
      position: htmlStyle.position,
      top: htmlStyle.top,
      left: htmlStyle.left,
      right: htmlStyle.right,
      overflowX: htmlStyle.overflowX,
      overflowY: htmlStyle.overflowY,
    };
    originalBodyStyles = {
      overflowX: bodyStyle.overflowX,
      overflowY: bodyStyle.overflowY,
    };

    const isScrollableY = html.scrollHeight > html.clientHeight;
    const isScrollableX = html.scrollWidth > html.clientWidth;

    // Handle `scrollbar-gutter` in Chrome when there is no scrollable content.
    const hasScrollbarGutterStable = htmlComputedStyles.scrollbarGutter?.includes('stable');

    // Safari needs visual viewport offsets added to account for pinch-zoom
    const visualOffsetTop = isWebKit() ? doc.defaultView?.visualViewport?.offsetTop || 0 : 0;
    const visualOffsetLeft = isWebKit() ? doc.defaultView?.visualViewport?.offsetLeft || 0 : 0;

    if (!hasScrollbarGutterStable) {
      Object.assign(htmlStyle, {
        position: 'fixed',
        top: `${-scrollY + visualOffsetTop}px`,
        left: `${-scrollX + visualOffsetLeft}px`,
        right: '0',
      });
    }

    Object.assign(htmlStyle, {
      overflowY:
        !hasScrollbarGutterStable && (isScrollableY || hasConstantOverflowY) ? 'scroll' : 'hidden',
      overflowX:
        !hasScrollbarGutterStable && (isScrollableX || hasConstantOverflowX) ? 'scroll' : 'hidden',
    });

    // Ensure two scrollbars can't appear since `<html>` now has a forced scrollbar, but the
    // `<body>` may have one too.
    if (isScrollableY || hasConstantOverflowY) {
      bodyStyle.overflowY = 'visible';
    }
    if (isScrollableX || hasConstantOverflowX) {
      bodyStyle.overflowX = 'visible';
    }
  }

  function cleanup() {
    Object.assign(htmlStyle, originalHtmlStyles);
    Object.assign(bodyStyle, originalBodyStyles);

    if (window.scrollTo.toString().includes('[native code]')) {
      window.scrollTo({ left: scrollX, top: scrollY, behavior: 'instant' });
    }
  }

  function handleResize() {
    cleanup();
    cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(lockScroll);
  }

  lockScroll();
  window.addEventListener('resize', handleResize);

  return () => {
    cancelAnimationFrame(resizeRaf);
    cleanup();
    window.removeEventListener('resize', handleResize);
  };
}

/**
 * Locks the scroll of the document when enabled.
 *
 * @param enabled - Whether to enable the scroll lock.
 */
export function useScrollLock(enabled: boolean = true, referenceElement?: Element | null) {
  useEnhancedEffect(() => {
    if (!enabled) {
      return undefined;
    }

    preventScrollCount += 1;
    if (preventScrollCount === 1) {
      restore = isIOS()
        ? preventScrollIOS(referenceElement)
        : preventScrollStandard(referenceElement);
    }

    return () => {
      preventScrollCount -= 1;
      if (preventScrollCount === 0) {
        restore();
      }
    };
  }, [enabled, referenceElement]);
}
