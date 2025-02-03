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
    SOURCE_GITHUB_BRANCH: 'master',
    GITHUB_TEMPLATE_DOCS_FEEDBACK: '6.docs-feedback.yml',
  },
  webpack: (config, options) => {
    const plugins = config.plugins.slice();
    const includesMonorepo = [/(@mui[\\/]monorepo)$/, /(@mui[\\/]monorepo)[\\/](?!.*node_modules)/];

    return {
      ...config,
      plugins,
      resolve: {
        ...config.resolve,
        alias: {
          ...config.resolve.alias,
          docs: path.resolve(workspaceRoot, 'docs'),
        },
      },
      module: {
        ...config.module,
        rules: config.module.rules.concat([
          {
            test: /\.+(js|jsx|mjs|ts|tsx)$/,
            include: includesMonorepo,
            use: options.defaultLoaders.babel,
          },
        ]),
      },
    };
  },
  transpilePackages: ['@mui/monorepo'],
  ...(process.env.NODE_ENV === 'production' && { distDir: 'export', output: 'export' }),
  experimental: {
    esmExternals: true,
    workerThreads: false,
  },
  devIndicators: {
    appIsrStatus: false,
  },
};

// Remove deprecated options that come from `withDocsInfra()` and cause warnings
const { optimizeFonts, ...result } = withMdx(withDocsInfra(nextConfig));
export default result;
