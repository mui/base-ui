export const SIDE_NAV_SCROLL_MARGIN = 48;
export const SIDE_NAV_VIEWPORT_SELECTOR = '[data-side-nav-viewport]';
export const SIDE_NAV_LINK_SELECTOR = 'a.SideNavLink[href]';
export const SIDE_NAV_PREHYDRATED_PATH_ATTRIBUTE = 'data-side-nav-prehydrated-path';

export function normalizeSideNavPathname(pathname: string): string {
  if (!pathname) {
    return '/';
  }

  const normalized = pathname.endsWith('/') && pathname !== '/' ? pathname.slice(0, -1) : pathname;
  return normalized || '/';
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

export function createSideNavPrehydrationScript({
  headerHeight,
  scrollMargin,
}: {
  headerHeight: number;
  scrollMargin: number;
}): string {
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

      const normalized = pathname.endsWith('/') && pathname !== '/' ? pathname.slice(0, -1) : pathname;
      return normalized || '/';
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
    const targetTop = itemRect.top - viewportRect.top + viewport.scrollTop;
    const direction = viewport.scrollTop > targetTop ? -1 : 1;
    const offset = Math.max(0, scaledHeaderHeight - Math.max(0, window.scrollY));
    viewport.scrollTop = targetTop + offset + scaledScrollMargin * direction;

    document.documentElement.setAttribute('${SIDE_NAV_PREHYDRATED_PATH_ATTRIBUTE}', pathname);
  } catch {
    // Fail silently; this optimization should never block rendering.
  }
})();`;
}
