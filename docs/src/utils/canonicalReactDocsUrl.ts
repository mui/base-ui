const REACT_DOCS_ROUTE_MAPPINGS = [
  [/^\/react\/overview$/, '/react/quick-start'],
  [/^\/react\/handbook$/, '/react/styling'],
  [/^\/react\/components$/, '/react'],
  [/^\/react\/utils$/, '/react'],
  [/^\/react\/\(overview\)\/releases$/, '/react/releases'],
  [/^\/react\/\(overview\)\/releases\/([^/]+)$/, '/react/releases/$1'],
  [/^\/react\/\(overview\)\/(quick-start|accessibility|community|about)$/, '/react/$1'],
  [
    /^\/react\/\(handbook\)\/(styling|animation|composition|customization|forms|typescript)$/,
    '/react/$1',
  ],
  [/^\/react\/\(components\)\/([^/]+)$/, '/react/$1'],
  [/^\/react\/\(utils\)\/([^/]+)$/, '/react/$1'],
  [/^\/react\/overview\/releases$/, '/react/releases'],
  [/^\/react\/overview\/releases\/([^/]+)$/, '/react/releases/$1'],
  [/^\/react\/overview\/(quick-start|accessibility|community|about)$/, '/react/$1'],
  [
    /^\/react\/handbook\/(styling|animation|composition|customization|forms|typescript)$/,
    '/react/$1',
  ],
  [/^\/react\/components\/([^/]+)$/, '/react/$1'],
  [/^\/react\/utils\/([^/]+)$/, '/react/$1'],
] as const;

function splitUrl(url: string) {
  const hashIndex = url.indexOf('#');
  const hash = hashIndex === -1 ? '' : url.slice(hashIndex);
  const withoutHash = hashIndex === -1 ? url : url.slice(0, hashIndex);

  const queryIndex = withoutHash.indexOf('?');
  const query = queryIndex === -1 ? '' : withoutHash.slice(queryIndex);
  const pathname = queryIndex === -1 ? withoutHash : withoutHash.slice(0, queryIndex);

  return { pathname, query, hash };
}

export function getCanonicalReactDocsUrl(url: string) {
  const { pathname, query, hash } = splitUrl(url);
  const markdownExtension = pathname.endsWith('.md') ? '.md' : '';
  const pathnameWithoutExtension = markdownExtension ? pathname.slice(0, -3) : pathname;
  const normalizedPathname =
    pathnameWithoutExtension.length > 1
      ? pathnameWithoutExtension.replace(/\/$/, '')
      : pathnameWithoutExtension;

  for (const [pattern, replacement] of REACT_DOCS_ROUTE_MAPPINGS) {
    if (pattern.test(normalizedPathname)) {
      return `${normalizedPathname.replace(pattern, replacement)}${markdownExtension}${query}${hash}`;
    }
  }

  return url;
}
