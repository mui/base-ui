import * as React from 'react';
import { usePreventScroll } from '@react-aria/overlays';
import { isIOS } from './detectBrowser';
import { ownerDocument, ownerWindow } from './owner';
import { useEnhancedEffect } from './useEnhancedEffect';

let originalHtmlStyles = {};
let originalBodyStyles = {};
let preventScrollCount = 0;
let restore: () => void = () => {};

function supportsDvh() {
  return (
    typeof CSS !== 'undefined' &&
    typeof CSS.supports === 'function' &&
    CSS.supports('height', '1dvh')
  );
}

function preventScrollStandard(referenceElement?: Element | null) {
  const doc = ownerDocument(referenceElement);
  const html = doc.documentElement;
  const body = doc.body;
  const win = ownerWindow(html);

  let scrollTop: number = 0;
  let resizeRaf = -1;

  function lockScroll() {
    const htmlStyles = win.getComputedStyle(html);
    const bodyStyles = win.getComputedStyle(body);

    scrollTop = html.scrollTop;

    originalHtmlStyles = {
      overflowY: html.style.overflowY,
      overflowX: html.style.overflowX,
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

    Object.assign(body.style, {
      position: 'relative',
      height: `calc(100dvh - ${bodyVerticalMargins}px)`,
      boxSizing: 'border-box',
      overflow: 'hidden',
    });

    body.scrollTop = scrollTop;
    html.setAttribute('data-base-ui-scroll-locked', '');
  }

  function cleanup() {
    Object.assign(html.style, originalHtmlStyles);
    Object.assign(body.style, originalBodyStyles);
    html.scrollTop = scrollTop;
    html.removeAttribute('data-base-ui-scroll-locked');
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
  const isReactAriaHook = React.useMemo(() => isIOS() || !supportsDvh(), []);

  usePreventScroll({
    // react-aria will remove the scrollbar offset immediately upon close, since we use `open`,
    // not `mounted`, to disable/enable the scroll lock. However since there are no inset
    // scrollbars, no layouting issues occur.
    isDisabled: !enabled || !isReactAriaHook,
  });

  useEnhancedEffect(() => {
    if (!enabled || isReactAriaHook) {
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
  }, [enabled, isReactAriaHook, referenceElement]);
}
