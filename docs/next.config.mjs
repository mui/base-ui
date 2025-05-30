// @ts-check
import * as path from 'path';
import * as url from 'url';
import * as fs from 'fs';
// eslint-disable-next-line no-restricted-imports
import withDocsInfra from '@mui/monorepo/docs/nextConfigDocsInfra.js';
import nextMdx from '@next/mdx';
import rehypeExtractToc from '@stefanprobst/rehype-extract-toc';
import remarkGfm from 'remark-gfm';
import remarkTypography from 'remark-typography';
import { rehypeQuickNav } from 'docs/src/components/QuickNav/rehypeQuickNav.mjs';
import { rehypeKbd } from 'docs/src/components/Kbd/rehypeKbd.mjs';
import { rehypeReference } from 'docs/src/components/ReferenceTable/rehypeReference.mjs';
import { rehypeDemos } from 'docs/src/components/Demo/rehypeDemos.mjs';
import { rehypeSyntaxHighlighting } from 'docs/src/syntax-highlighting/index.mjs';
import { rehypeSlug } from 'docs/src/components/QuickNav/rehypeSlug.mjs';
import { rehypeSubtitle } from 'docs/src/components/Subtitle/rehypeSubtitle.mjs';

const currentDirectory = url.fileURLToPath(new URL('.', import.meta.url));
const workspaceRoot = path.resolve(currentDirectory, '../');

const withMdx = nextMdx({
  options: {
    remarkPlugins: [remarkGfm, remarkTypography],
    rehypePlugins: [
      rehypeDemos,
      rehypeReference,
      ...rehypeSyntaxHighlighting,
      rehypeSlug,
      rehypeExtractToc,
      rehypeQuickNav,
      rehypeSubtitle,
      rehypeKbd,
    ],
  },
});

/**
 * @returns {{version: string}}
 */
function loadPackageJson() {
  const pkgContent = fs.readFileSync(path.resolve(workspaceRoot, 'package.json'), 'utf8');
  return JSON.parse(pkgContent);
}

const rootPackage = loadPackageJson();

/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: false,
  pageExtensions: ['mdx', 'tsx'],
  env: {
    // docs-infra
    LIB_VERSION: rootPackage.version,
    SOURCE_CODE_REPO: 'https://github.com/mui/base-ui',
  },
  ...(process.env.NODE_ENV === 'production' && { distDir: 'export', output: 'export' }),
  devIndicators: false,
  reactStrictMode: false,
};

const mergedConfig = withMdx(withDocsInfra(nextConfig));

delete mergedConfig.experimental?.esmExternals;
if (!process.env.CI) {
  delete mergedConfig.experimental?.cpus;
}

export default mergedConfig;
