import { getUserAgent } from '@floating-ui/react/utils';
import { isIOS, isWebKit } from './detectBrowser';
import { ownerDocument, ownerWindow } from './owner';
import { useEnhancedEffect } from './useEnhancedEffect';

let originalHtmlStyles = {};
let originalBodyStyles = {};
let preventScrollCount = 0;
let restore: () => void = () => {};

function getVisualOffsets(doc: Document) {
  const win = ownerWindow(doc);
  const vV = win.visualViewport;
  return {
    x: Math.floor(vV?.offsetLeft || 0),
    y: Math.floor(vV?.offsetTop || 0),
  };
}

function preventScrollIOS(referenceElement?: Element | null) {
  const doc = ownerDocument(referenceElement);
  const html = doc.documentElement;
  const body = doc.body;
  const htmlStyle = html.style;
  const bodyStyle = body.style;

  // iOS 12 does not support `visualViewport`.
  const { x, y } = getVisualOffsets(doc);
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
    top: `${-(scrollY - y)}px`,
    left: `${-(scrollX - x)}px`,
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
  const isFirefox = /firefox/i.test(getUserAgent());
  const doc = ownerDocument(referenceElement);
  const html = doc.documentElement;
  const body = doc.body;
  const win = ownerWindow(doc);
  const htmlStyle = html.style;
  const bodyStyle = body.style;

  let resizeRaf: number;
  let scrollX: number;
  let scrollY: number;
  let paddingProp: 'paddingLeft' | 'paddingRight';

  function lockScroll() {
    if (isFirefox) {
      // RTL <body> scrollbar
      const scrollbarX =
        Math.round(doc.documentElement.getBoundingClientRect().left) +
        doc.documentElement.scrollLeft;
      paddingProp = scrollbarX ? 'paddingLeft' : 'paddingRight';
      const scrollbarWidth = win.innerWidth - doc.documentElement.clientWidth;

      bodyStyle.overflow = 'hidden';
      htmlStyle.overflow = 'visible';

      if (scrollbarWidth) {
        bodyStyle[paddingProp] = `${scrollbarWidth}px`;
      }

      return;
    }

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
    const webkit = isWebKit();
    const { x, y } = getVisualOffsets(doc);
    const visualX = webkit ? x : 0;
    const visualY = webkit ? y : 0;

    if (!hasScrollbarGutterStable) {
      Object.assign(htmlStyle, {
        position: 'fixed',
        top: `${-scrollY + visualY}px`,
        left: `${-scrollX + visualX}px`,
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
    if (isFirefox) {
      Object.assign(bodyStyle, {
        overflow: '',
        [paddingProp]: '',
      });
      Object.assign(htmlStyle, {
        overflow: '',
      });
      return;
    }

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
