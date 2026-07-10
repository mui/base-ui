const REACT_DOCS_SECTION_DEFAULTS = {
  overview: 'quick-start',
  handbook: 'styling',
  components: 'accordion',
  utils: 'csp-provider',
} as const;

type ReactDocsSection = keyof typeof REACT_DOCS_SECTION_DEFAULTS;

function splitUrl(url: string) {
  const hashIndex = url.indexOf('#');
  const hash = hashIndex === -1 ? '' : url.slice(hashIndex);
  const withoutHash = hashIndex === -1 ? url : url.slice(0, hashIndex);

  const queryIndex = withoutHash.indexOf('?');
  const query = queryIndex === -1 ? '' : withoutHash.slice(queryIndex);
  const pathname = queryIndex === -1 ? withoutHash : withoutHash.slice(0, queryIndex);

  return { pathname, query, hash };
}

function isReactDocsSection(section: string | undefined): section is ReactDocsSection {
  return section !== undefined && Object.hasOwn(REACT_DOCS_SECTION_DEFAULTS, section);
}

/**
 * Converts internal route-group paths and legacy section URLs to their public React docs URL.
 */
export function getCanonicalReactDocsUrl(url: string) {
  const { pathname, query, hash } = splitUrl(url);
  const markdownExtension = pathname.endsWith('.md') ? '.md' : '';
  const pathnameWithoutExtension = markdownExtension ? pathname.slice(0, -3) : pathname;
  const normalizedPathname =
    pathnameWithoutExtension.length > 1
      ? pathnameWithoutExtension.replace(/\/$/, '')
      : pathnameWithoutExtension;
  const segments = normalizedPathname.split('/');

  if (segments[1] !== 'react') {
    return url;
  }

  const sectionSegment = segments[2];
  const routeGroupMatch = sectionSegment?.match(/^\(([^/()]+)\)$/);
  const sectionName = routeGroupMatch?.[1] ?? sectionSegment;

  if (isReactDocsSection(sectionName)) {
    const canonicalPathname =
      segments.length === 3
        ? `/react/${REACT_DOCS_SECTION_DEFAULTS[sectionName]}`
        : ['', 'react', ...segments.slice(3)].join('/');

    return `${canonicalPathname}${markdownExtension}${query}${hash}`;
  }

  const canonicalSegments = segments.filter(
    (segment, index) => index < 2 || !/^\([^/()]+\)$/.test(segment),
  );

  if (canonicalSegments.length === segments.length) {
    return url;
  }

  return `${canonicalSegments.join('/')}${markdownExtension}${query}${hash}`;
}
