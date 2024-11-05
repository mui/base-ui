'use client';
import * as React from 'react';
import clsx from 'clsx';

export function Root({ children, className, ...props }: React.ComponentProps<'div'>) {
  const ref = React.useRef<HTMLDivElement>(null);

  // When nav height is larger than viewport, we make document scroll push it around
  // so it sticks to top or bottom depending on scroll direction as if it was a real
  // physical object constrained by the viewport
  React.useEffect(() => {
    if (!ref.current) {
      return undefined;
    }

    let prevScrollY = window.scrollY;
    let top: number;
    let bottom: number;
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

      // Get the nav's natural top position from the start of the document
      // if it was `position: static` and `position: absolute`
      ref.current.style.position = 'static';
      const staticTop = window.scrollY + ref.current.getBoundingClientRect().y;
      ref.current.style.position = 'absolute';
      const absoluteTop = window.scrollY + ref.current.getBoundingClientRect().y;

      // Get the nav's natural distance from bottom to the end of the document
      // if it was `position: absolute` and `bottom: 0`
      ref.current.style.position = 'absolute';
      ref.current.style.top = 'auto';
      ref.current.style.bottom = '0';
      const rect = ref.current.getBoundingClientRect();
      const absoluteBottom = document.body.clientHeight - window.scrollY - rect.bottom;

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
        const scrollY = window.scrollY;
        const bodyHeight = document.body.clientHeight;
        const minMarginTop = staticTop - absoluteTop;
        const rootOffset = scrollY + newTop;
        const marginTop = Math.max(minMarginTop, rootOffset - absoluteTop);
        const marginBottom = Math.max(0, bodyHeight - scrollY - newBottom - absoluteBottom);

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

        const scrollY = window.scrollY;
        const delta = scrollY - prevScrollY;
        prevScrollY = scrollY;

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

    // Set cached positions when event loop is empty
    requestIdleCallback(getCachedPositions);
    window.addEventListener('scroll', handleUpdate);
    window.addEventListener('resize', handleResize);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('scroll', handleUpdate);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div ref={ref} className={clsx('QuickNavRoot', className)} {...props}>
      <div className="QuickNavInner">
        <h2 className="QuickNavTitle">On this page</h2>
        {children}
      </div>
    </div>
  );
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
