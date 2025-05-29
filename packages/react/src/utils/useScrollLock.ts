import { isFirefox, isIOS, isWebKit } from './detectBrowser';
import { ownerDocument, ownerWindow } from './owner';
import { useModernLayoutEffect } from './useModernLayoutEffect';
import { Timeout } from './useTimeout';
import { AnimationFrame } from './useAnimationFrame';

/* eslint-disable lines-between-class-members */

let originalHtmlStyles: Partial<CSSStyleDeclaration> = {};
let originalBodyStyles: Partial<CSSStyleDeclaration> = {};
let originalHtmlScrollBehavior = '';

function hasInsetScrollbars(referenceElement: Element | null) {
  if (typeof document === 'undefined') {
    return false;
  }
  const doc = ownerDocument(referenceElement);
  const win = ownerWindow(doc);
  return win.innerWidth - doc.documentElement.clientWidth > 0;
}

function preventScrollBasic(referenceElement: Element | null) {
  const doc = ownerDocument(referenceElement);
  const html = doc.documentElement;
  const originalOverflow = html.style.overflow;
  html.style.overflow = 'hidden';
  return () => {
    html.style.overflow = originalOverflow;
  };
}

function preventScrollStandard(referenceElement: Element | null) {
  const doc = ownerDocument(referenceElement);
  const html = doc.documentElement;
  const body = doc.body;
  const win = ownerWindow(html);

  let scrollTop = 0;
  let scrollLeft = 0;
  const resizeFrame = AnimationFrame.create();

  // Pinch-zoom in Safari causes a shift. Just don't lock scroll if there's any pinch-zoom.
  if (isWebKit && (win.visualViewport?.scale ?? 1) !== 1) {
    return () => {};
  }

  function lockScroll() {
    /* DOM reads: */

    const htmlStyles = win.getComputedStyle(html);
    const bodyStyles = win.getComputedStyle(body);

    scrollTop = html.scrollTop;
    scrollLeft = html.scrollLeft;

    originalHtmlStyles = {
      overflowY: html.style.overflowY,
      overflowX: html.style.overflowX,
    };
    originalHtmlScrollBehavior = html.style.scrollBehavior;

    originalBodyStyles = {
      position: body.style.position,
      height: body.style.height,
      width: body.style.width,
      boxSizing: body.style.boxSizing,
      overflowY: body.style.overflowY,
      overflowX: body.style.overflowX,
      scrollBehavior: body.style.scrollBehavior,
    };

    // Handle `scrollbar-gutter` in Chrome when there is no scrollable content.
    const hasScrollbarGutterStable = htmlStyles.scrollbarGutter?.includes('stable');

    const isScrollableY = html.scrollHeight > html.clientHeight;
    const isScrollableX = html.scrollWidth > html.clientWidth;
    const hasConstantOverflowY =
      htmlStyles.overflowY === 'scroll' || bodyStyles.overflowY === 'scroll';
    const hasConstantOverflowX =
      htmlStyles.overflowX === 'scroll' || bodyStyles.overflowX === 'scroll';

    // Values can be negative in Firefox
    const scrollbarWidth = Math.max(0, win.innerWidth - html.clientWidth);
    const scrollbarHeight = Math.max(0, win.innerHeight - html.clientHeight);

    // Avoid shift due to the default <body> margin. This does cause elements to be clipped
    // with whitespace. Warn if <body> has margins?
    const marginY = parseFloat(bodyStyles.marginTop) + parseFloat(bodyStyles.marginBottom);
    const marginX = parseFloat(bodyStyles.marginLeft) + parseFloat(bodyStyles.marginRight);

    /*
     * DOM writes:
     * Do not read the DOM past this point!
     */

    Object.assign(html.style, {
      overflowY:
        !hasScrollbarGutterStable && (isScrollableY || hasConstantOverflowY) ? 'scroll' : 'hidden',
      overflowX:
        !hasScrollbarGutterStable && (isScrollableX || hasConstantOverflowX) ? 'scroll' : 'hidden',
    });

    Object.assign(body.style, {
      position: 'relative',
      height:
        marginY || scrollbarHeight ? `calc(100dvh - ${marginY + scrollbarHeight}px)` : '100dvh',
      width: marginX || scrollbarWidth ? `calc(100vw - ${marginX + scrollbarWidth}px)` : '100vw',
      boxSizing: 'border-box',
      overflow: 'hidden',
      scrollBehavior: 'unset',
    });

    body.scrollTop = scrollTop;
    body.scrollLeft = scrollLeft;
    html.setAttribute('data-base-ui-scroll-locked', '');
    html.style.scrollBehavior = 'unset';
  }

  function cleanup() {
    Object.assign(html.style, originalHtmlStyles);
    Object.assign(body.style, originalBodyStyles);
    html.scrollTop = scrollTop;
    html.scrollLeft = scrollLeft;
    html.removeAttribute('data-base-ui-scroll-locked');
    html.style.scrollBehavior = originalHtmlScrollBehavior;
  }

  function handleResize() {
    cleanup();
    resizeFrame.request(lockScroll);
  }

  lockScroll();
  win.addEventListener('resize', handleResize);

  return () => {
    resizeFrame.cancel();
    cleanup();
    win.removeEventListener('resize', handleResize);
  };
}

class ScrollLocker {
  lockCount = 0;
  restore = null as (() => void) | null;
  timeoutLock = Timeout.create();
  timeoutUnlock = Timeout.create();

  acquire(referenceElement: Element | null) {
    this.lockCount += 1;
    if (this.lockCount === 1 && this.restore === null) {
      this.timeoutLock.start(0, () => this.lock(referenceElement));
    }
    return this.release;
  }

  release = () => {
    this.lockCount -= 1;
    if (this.lockCount === 0 && this.restore) {
      this.timeoutUnlock.start(0, this.unlock);
    }
  };

  private unlock = () => {
    if (this.lockCount === 0 && this.restore) {
      this.restore?.();
      this.restore = null;
    }
  };

  private lock(referenceElement: Element | null) {
    if (this.lockCount === 0 || this.restore !== null) {
      return;
    }

    const isOverflowHiddenLock = isIOS || (isFirefox && !hasInsetScrollbars(referenceElement));

    // Firefox on macOS with overlay scrollbars uses a basic scroll lock that doesn't
    // need the inset scrollbars handling to prevent overlay scrollbars from appearing
    // on scroll containers briefly whenever the lock is enabled.
    // On iOS, scroll locking does not work if the navbar is collapsed. Due to numerous
    // side effects and bugs that arise on iOS, it must be researched extensively before
    // being enabled to ensure it doesn't cause the following issues:
    // - Textboxes must scroll into view when focused, nor cause a glitchy scroll animation.
    // - The navbar must not force itself into view and cause layout shift.
    // - Scroll containers must not flicker upon closing a popup when it has an exit animation.
    this.restore = isOverflowHiddenLock
      ? preventScrollBasic(referenceElement)
      : preventScrollStandard(referenceElement);
  }
}

const SCROLL_LOCKER = new ScrollLocker();

/**
 * Locks the scroll of the document when enabled.
 *
 * @param enabled - Whether to enable the scroll lock.
 */
export function useScrollLock(params: {
  enabled: boolean;
  mounted: boolean;
  open: boolean;
  referenceElement?: Element | null;
}) {
  const { enabled = true, mounted, open, referenceElement = null } = params;

  // https://github.com/mui/base-ui/issues/1135
  useModernLayoutEffect(() => {
    if (isWebKit && mounted && !open) {
      const doc = ownerDocument(referenceElement);
      const originalUserSelect = doc.body.style.userSelect;
      const originalWebkitUserSelect = doc.body.style.webkitUserSelect;
      doc.body.style.userSelect = 'none';
      doc.body.style.webkitUserSelect = 'none';
      return () => {
        doc.body.style.userSelect = originalUserSelect;
        doc.body.style.webkitUserSelect = originalWebkitUserSelect;
      };
    }
    return undefined;
  }, [mounted, open, referenceElement]);

  useModernLayoutEffect(() => {
    if (!enabled) {
      return undefined;
    }
    return SCROLL_LOCKER.acquire(referenceElement);
  }, [enabled, referenceElement]);
}
