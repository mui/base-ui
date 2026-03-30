export const SIDE_NAV_SCROLL_MARGIN = 48;
export const SIDE_NAV_VIEWPORT_SELECTOR = '[data-side-nav-viewport]';
export const SIDE_NAV_LINK_SELECTOR = '[data-side-nav-link][href]';
export const SIDE_NAV_PREHYDRATED_PATH_WINDOW_KEY = 'baseUiSideNavPrehydratedPath';

export function normalizeSideNavPathname(pathname: string): string {
  if (!pathname) {
    return '/';
  }

  return pathname.endsWith('/') && pathname !== '/' ? pathname.slice(0, -1) : pathname;
}

export function getSideNavScrollTop({
  viewportScrollTop,
  targetTop,
  headerHeight,
  scrollMargin,
  windowScrollY,
}: {
  viewportScrollTop: number;
  targetTop: number;
  headerHeight: number;
  scrollMargin: number;
  windowScrollY: number;
}): number {
  const direction = viewportScrollTop > targetTop ? -1 : 1;
  const offset = Math.max(0, headerHeight - Math.max(0, windowScrollY));
  return targetTop + offset + scrollMargin * direction;
}

export function getSideNavPrehydratedPath(win: Window): string | null {
  const value = (win as Window & Record<string, unknown>)[SIDE_NAV_PREHYDRATED_PATH_WINDOW_KEY];
  return typeof value === 'string' ? value : null;
}

export function clearSideNavPrehydratedPath(win: Window): void {
  delete (win as Window & Record<string, unknown>)[SIDE_NAV_PREHYDRATED_PATH_WINDOW_KEY];
}

export function createSideNavPrehydrationScript({
  headerHeight,
  scrollMargin,
}: {
  headerHeight: number;
  scrollMargin: number;
}): string {
  // Keep in sync with `normalizeSideNavPathname` in this file.
  // On initial load, `window.scrollY` is usually 0, so the full header offset is applied.
  // If the browser restores scroll position (back/forward), it typically does so after scripts.
  // The script is a best-effort optimization and should fail silently.
  return `(() => {
  try {
    const viewport = document.querySelector('${SIDE_NAV_VIEWPORT_SELECTOR}');
    if (!(viewport instanceof HTMLElement)) {
      return;
    }

    const normalizePath = (pathname) => {
      if (!pathname) {
        return '/';
      }

      return pathname.endsWith('/') && pathname !== '/' ? pathname.slice(0, -1) : pathname;
    };

    const pathname = normalizePath(window.location.pathname);
    const activeLink = Array.from(viewport.querySelectorAll('${SIDE_NAV_LINK_SELECTOR}')).find((link) => {
      if (!(link instanceof HTMLAnchorElement)) {
        return false;
      }

      const href = link.getAttribute('href');
      if (!href || href[0] !== '/') {
        return false;
      }

      return normalizePath(href.split('#')[0]) === pathname;
    });

    if (!(activeLink instanceof HTMLAnchorElement)) {
      return;
    }

    const item = activeLink.closest('li');
    if (!(item instanceof HTMLElement)) {
      return;
    }

    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const scaledScrollMargin = (${scrollMargin} * rem) / 16;
    const scaledHeaderHeight = (${headerHeight} * rem) / 16;

    const viewportRect = viewport.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();
    const itemTop = itemRect.top - viewportRect.top + viewport.scrollTop;
    const itemBottom = itemTop + itemRect.height;
    const viewportTop = viewport.scrollTop;
    const viewportBottom = viewportTop + viewport.clientHeight;

    let targetTop = null;
    if (itemTop < viewportTop) {
      targetTop = itemTop;
    } else if (itemBottom > viewportBottom) {
      targetTop = itemBottom - viewport.clientHeight;
    }

    if (targetTop === null) {
      return;
    }

    const direction = viewport.scrollTop > targetTop ? -1 : 1;
    const offset = Math.max(0, scaledHeaderHeight - Math.max(0, window.scrollY));
    viewport.scrollTop = targetTop + offset + scaledScrollMargin * direction;

    window['${SIDE_NAV_PREHYDRATED_PATH_WINDOW_KEY}'] = pathname;
  } catch {}
})();`;
}
