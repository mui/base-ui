import { isIOS } from './detectBrowser';
import { ownerDocument, ownerWindow } from './owner';
import { useEnhancedEffect } from './useEnhancedEffect';
import { usePreventScroll } from '@react-aria/overlays';

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
  const doc = ownerDocument(referenceElement);
  const html = doc.documentElement;
  const body = doc.body;
  const win = ownerWindow(doc);

  let scrollTop: number = 0;
  let resizeRaf = -1;

  function lockScroll() {
    const htmlStyles = win.getComputedStyle(html);
    const bodyStyles = win.getComputedStyle(body);

    scrollTop = html.scrollTop;

    originalHtmlStyles = {
      overflowY: html.style.overflowY,
    };

    originalBodyStyles = {
      position: body.style.position,
      height: body.style.height,
      boxSizing: body.style.boxSizing,
      overflowY: body.style.overflowY,
      overflowX: body.style.overflowX,
    };

    // Handle `scrollbar-gutter` in Chrome when there is no scrollable content.
    const hasScrollbarGutterStable = htmlStyles.scrollbarGutter?.includes('stable');

    const isScrollableY = html.scrollHeight > html.clientHeight;
    const isScrollableX = html.scrollWidth > html.clientWidth;
    const hasConstantOverflowY =
      htmlStyles.overflowY === 'scroll' || bodyStyles.overflowY === 'scroll';
    const hasConstantOverflowX =
      htmlStyles.overflowX === 'scroll' || bodyStyles.overflowX === 'scroll';

    Object.assign(html.style, {
      overflowY:
        !hasScrollbarGutterStable && (isScrollableY || hasConstantOverflowY) ? 'scroll' : 'hidden',
      overflowX:
        !hasScrollbarGutterStable && (isScrollableX || hasConstantOverflowX) ? 'scroll' : 'hidden',
    });

    // Avoid shift due to the default <body> margin. This does cause elements to be clipped
    // with whitespace. Warn if <body> has margins?
    const bodyVerticalMargins =
      parseFloat(bodyStyles.marginTop) + parseFloat(bodyStyles.marginBottom);

    const heightProperty = CSS.supports('height', '1dvh') ? 'dvh' : 'vh';

    Object.assign(body.style, {
      position: 'relative',
      height: `calc(100${heightProperty} - ${bodyVerticalMargins}px)`,
      boxSizing: 'border-box',
      overflow: 'hidden',
    });

    body.scrollTop = scrollTop;
  }

  function cleanup() {
    Object.assign(html.style, originalHtmlStyles);
    Object.assign(body.style, originalBodyStyles);
    html.scrollTop = scrollTop;
  }

  function handleResize() {
    cleanup();
    cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(lockScroll);
  }

  lockScroll();
  win.addEventListener('resize', handleResize);

  return () => {
    cancelAnimationFrame(resizeRaf);
    cleanup();
    win.removeEventListener('resize', handleResize);
  };
}

/**
 * Locks the scroll of the document when enabled.
 *
 * @param enabled - Whether to enable the scroll lock.
 */
export function useScrollLock(enabled: boolean = true, referenceElement?: Element | null) {
  usePreventScroll({
    isDisabled: !isIOS() || !enabled,
  });

  useEnhancedEffect(() => {
    if (!enabled || isIOS()) {
      return undefined;
    }

    preventScrollCount += 1;
    if (preventScrollCount === 1) {
      restore = preventScrollStandard(referenceElement);
    }

    return () => {
      preventScrollCount -= 1;
      if (preventScrollCount === 0) {
        restore();
      }
    };
  }, [enabled, referenceElement]);
}
