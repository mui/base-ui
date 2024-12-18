'use client';
import * as React from 'react';
import clsx from 'clsx';

export function Container({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={clsx('QuickNavContainer', className)} {...props} />;
}

export function Root({ children, className, ...props }: React.ComponentProps<'div'>) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => onMounted(ref), []);
  return (
    <nav aria-label="On this page" ref={ref} className={clsx('QuickNavRoot', className)} {...props}>
      <div className="QuickNavInner">{children}</div>
    </nav>
  );
}

// When nav height is larger than viewport, we make document scroll push it around
// so it sticks to top or bottom depending on scroll direction as if it was a real
// physical object constrained by the viewport.
function onMounted(ref: React.RefObject<HTMLDivElement | null>) {
  if (!ref.current) {
    return undefined;
  }

  let top: number;
  let bottom: number;
  let prevScrollY = getScrollY();
  let resizeObserver: ResizeObserver | undefined;
  let state: 'Scrollable' | 'StickyTop' | 'StickyBottom' = 'StickyTop';
  let raf = 0;

  const cssTop = parseFloat(getComputedStyle(ref.current).top);

  let cachedPositions: {
    staticTop: number;
    absoluteTop: number;
    absoluteBottom: number;
  } | null = null;

  function getCachedPositions() {
    if (cachedPositions === null) {
      cachedPositions = getNaturalPositions();
    }

    return cachedPositions;
  }

  function getNaturalPositions() {
    if (!ref.current) {
      return { absoluteTop: 0, staticTop: 0, absoluteBottom: 0 };
    }

    const initialStyles = {
      top: ref.current.style.top,
      bottom: ref.current.style.bottom,
      marginTop: ref.current.style.marginTop,
      marginBottom: ref.current.style.marginBottom,
    };

    ref.current.style.top = '0px';
    ref.current.style.bottom = '';
    ref.current.style.marginTop = '';
    ref.current.style.marginBottom = '';

    // Get the nav top Y coordinate from the start of the document
    // if it was `position: static` and `position: absolute`
    // relative to the start of the document
    ref.current.style.position = 'static';
    const staticTop = getScrollY() + ref.current.getBoundingClientRect().y;
    ref.current.style.position = 'absolute';
    const absoluteTop = getScrollY() + ref.current.getBoundingClientRect().y;

    // Get the nav bottom Y coordinate when it's at its maximum possible bottom position
    // relative to the start of the document
    ref.current.style.position = 'absolute';
    ref.current.style.top = 'auto';
    ref.current.style.bottom = '0';
    const rect = ref.current.getBoundingClientRect();
    const absoluteBottom = getScrollY() + rect.bottom;

    ref.current.style.position = '';
    ref.current.style.top = initialStyles.top;
    ref.current.style.bottom = initialStyles.bottom;
    ref.current.style.marginTop = initialStyles.marginTop;
    ref.current.style.marginBottom = initialStyles.marginBottom;
    // Remove the style attibute if it's empty so that the DOM is tidy
    if (ref.current?.style.length === 0) {
      ref.current.removeAttribute('style');
    }

    return { absoluteTop, staticTop, absoluteBottom };
  }

  function setHeightProperty() {
    if (!resizeObserver && ref.current) {
      resizeObserver = new ResizeObserver(([entry]) => {
        const [{ blockSize }] = entry.borderBoxSize;
        ref.current?.style.setProperty('--height', `${blockSize}px`);
      });
      resizeObserver.observe(ref.current);
    }
  }

  function stickToTop() {
    if (ref.current) {
      state = 'StickyTop';
      ref.current.style.top = '';
      ref.current.style.bottom = '';
      ref.current.style.marginTop = '';
      ref.current.style.marginBottom = '';
    }
  }

  function stickToBottom() {
    if (ref.current) {
      state = 'StickyBottom';
      setHeightProperty();
      ref.current.style.top = `min(var(--top), 100dvh - var(--height))`;
      ref.current.style.bottom = '';
      ref.current.style.marginTop = '';
      ref.current.style.marginBottom = '';
    }
  }

  function unstick(newTop: number, newBottom: number) {
    if (ref.current) {
      state = 'Scrollable';
      const { absoluteTop, absoluteBottom, staticTop } = getCachedPositions();
      const marginTop = Math.max(staticTop - absoluteTop, getScrollY() + newTop - absoluteTop);
      const marginBottom = Math.max(0, absoluteBottom - getScrollY() - newBottom);

      // Choose the smaller margin because at document edges,
      // the larger one may push the nav out of the container edges
      if (marginTop < marginBottom) {
        ref.current.style.top = 'auto';
        ref.current.style.bottom = '0';
        ref.current.style.marginTop = marginTop ? `${marginTop}px` : '';
        ref.current.style.marginBottom = '';
      } else {
        ref.current.style.top = '';
        ref.current.style.bottom = '';
        ref.current.style.marginTop = '';
        ref.current.style.marginBottom = marginBottom ? `${marginBottom}px` : '';
      }
    }
  }

  function handleUpdate() {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      if (!ref.current) {
        return;
      }

      const delta = getScrollY() - prevScrollY;
      prevScrollY = getScrollY();

      // We may get into <0.1px rounding issues in Safari and Firefox
      const rect = ref.current.getBoundingClientRect();
      top = Math.round(rect.top);
      bottom = Math.round(rect.bottom);

      // Skip when scrolling in the direction that matches the sticky position
      if ((delta > 0 && state === 'StickyBottom') || (delta < 0 && state === 'StickyTop')) {
        return;
      }

      // Should be top-sticky if the entire nav can fit in the viewport
      if (rect.height + cssTop <= window.innerHeight) {
        if (state !== 'StickyTop') {
          stickToTop();
        }
        return;
      }

      if (state === 'StickyTop') {
        const clippedAtBottom = bottom - window.innerHeight;
        if (delta >= clippedAtBottom) {
          stickToBottom();
        } else {
          unstick(top - delta, bottom - delta);
        }
        return;
      }

      if (state === 'StickyBottom') {
        if (delta <= top) {
          stickToTop();
        } else {
          unstick(top - delta, bottom - delta);
        }
        return;
      }

      if (state === 'Scrollable' && delta <= 0 && top - delta >= cssTop) {
        stickToTop();
        return;
      }

      if (state === 'Scrollable' && delta >= 0 && bottom - delta <= window.innerHeight) {
        stickToBottom();
      }
    });
  }
  const requestIdleCallback = window.requestIdleCallback ?? window.setTimeout;
  const cancelIdleCallback = window.cancelIdleCallback ?? window.clearTimeout;

  let callbackId = 0;
  function handleResize() {
    cancelIdleCallback(callbackId);
    callbackId = requestIdleCallback(() => {
      cachedPositions = getNaturalPositions();
      handleUpdate();
    });
  }

  // Maintain nav position as much as possible to avoid layout shifts
  let hash = window.location.hash;
  let pathname = window.location.pathname;
  function handlePopState() {
    if (hash !== window.location.hash && pathname === window.location.pathname) {
      window.removeEventListener('scroll', handleUpdate);

      requestAnimationFrame(() => {
        if (state === 'Scrollable') {
          unstick(Math.min(cssTop, top), Math.max(window.innerHeight, bottom));
        }

        prevScrollY = getScrollY();
        window.addEventListener('scroll', handleUpdate);
      });
    }
    hash = window.location.hash;
    pathname = window.location.pathname;
  }

  requestIdleCallback(getCachedPositions);
  requestIdleCallback(handleUpdate);
  window.addEventListener('scroll', handleUpdate);
  window.addEventListener('resize', handleResize);
  window.addEventListener('popstate', handlePopState);

  return () => {
    resizeObserver?.disconnect();
    window.removeEventListener('scroll', handleUpdate);
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('popstate', handlePopState);
  };
}

/** Get window.scrollY accounting for a potential scroll lock offset top style */
function getScrollY() {
  return window.scrollY - parseFloat(document.documentElement.style.top || '0');
}

export function Title({ className, ...props }: React.ComponentProps<'h2'>) {
  return <div aria-hidden className={clsx('QuickNavTitle', className)} {...props} />;
}

export function List({ className, ...props }: React.ComponentProps<'ul'>) {
  return <ul className={clsx('QuickNavList', className)} {...props} />;
}

export function Item({ className, ...props }: React.ComponentProps<'li'>) {
  return <li className={clsx('QuickNavItem', className)} {...props} />;
}

export function Link({ className, ...props }: React.ComponentProps<'a'>) {
  return <a className={clsx('QuickNavLink', className)} {...props} />;
}
