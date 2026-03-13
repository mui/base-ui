// @ts-check
import * as path from 'path';
import * as url from 'url';
import * as fs from 'fs';
import { withDeploymentConfig } from '@mui/internal-docs-infra/withDocsInfra';
import transformMarkdownMetadata from '@mui/internal-docs-infra/pipeline/transformMarkdownMetadata';
import transformMarkdownRelativePaths from '@mui/internal-docs-infra/pipeline/transformMarkdownRelativePaths';
import nextMdx from '@next/mdx';
import rehypeExtractToc from '@stefanprobst/rehype-extract-toc';
import remarkGfm from 'remark-gfm';
import remarkTypography from 'remark-typography';
import { rehypeQuickNav } from 'docs/src/components/QuickNav/rehypeQuickNav.mjs';
import { rehypeConcatHeadings } from 'docs/src/components/QuickNav/rehypeConcatHeadings.mjs';
import { rehypeKbd } from 'docs/src/components/Kbd/rehypeKbd.mjs';
import { rehypeReference } from 'docs/src/components/ReferenceTable/rehypeReference.mjs';
import { rehypeSyntaxHighlighting } from 'docs/src/syntax-highlighting/index.mjs';
import { rehypeSlug } from 'docs/src/components/QuickNav/rehypeSlug.mjs';
import { rehypeSubtitle } from 'docs/src/components/Subtitle/rehypeSubtitle.mjs';

const currentDirectory = url.fileURLToPath(new URL('.', import.meta.url));
const workspaceRoot = path.resolve(currentDirectory, '../');

const withMdx = nextMdx({
  options: {
    remarkPlugins: [
      remarkGfm,
      [
        transformMarkdownMetadata,
        {
          titleSuffix: ' · Base UI',
          extractToIndex: {
            include: ['src/app/react'],
            exclude: [
              'src/app/careers',
              'src/app/production-error',
              'src/app/test',
              'src/app/experiments',
              'src/app/playground',
            ],
            baseDir: path.dirname(url.fileURLToPath(import.meta.url)),
            useVisibleDescription: true,
          },
        },
      ],
      remarkTypography,
      transformMarkdownRelativePaths,
    ],
    rehypePlugins: [
      rehypeReference,
      ...rehypeSyntaxHighlighting,
      rehypeSlug,
      rehypeConcatHeadings,
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
  turbopack: {
    rules: {
      './src/app/sitemap/index.ts': {
        as: '*.ts',
        loaders: ['@mui/internal-docs-infra/pipeline/loadPrecomputedSitemap'],
      },
      './src/app/**/demos/*/index.ts': {
        as: '*.ts',
        loaders: ['@mui/internal-docs-infra/pipeline/loadPrecomputedCodeHighlighter'],
      },
      './src/demo-data/*/index.ts': {
        as: '*.ts',
        loaders: ['@mui/internal-docs-infra/pipeline/loadPrecomputedCodeHighlighter'],
      },
    },
  },
  webpack: (config, { defaultLoaders }) => {
    // for production builds
    config.module.rules.push({
      test: /[/\\\\]sitemap[/\\\\]index\.ts$/,
      use: [defaultLoaders.babel, '@mui/internal-docs-infra/pipeline/loadPrecomputedSitemap'],
    });
    config.module.rules.push({
      test: /[/\\\\]demos[/\\\\][^/\\\\]+[/\\\\]index\.ts$/,
      use: [
        defaultLoaders.babel,
        '@mui/internal-docs-infra/pipeline/loadPrecomputedCodeHighlighter',
      ],
    });
    config.module.rules.push({
      test: /[/\\\\]src[/\\\\]demo-data[/\\\\][^/\\\\]+[/\\\\]index\.ts$/,
      use: [
        defaultLoaders.babel,
        '@mui/internal-docs-infra/pipeline/loadPrecomputedCodeHighlighter',
      ],
    });

    return config;
  },
  env: {
    // docs-infra
    LIB_VERSION: rootPackage.version,
    SOURCE_CODE_REPO: 'https://github.com/mui/base-ui',
  },
  ...(process.env.NODE_ENV === 'production' && { distDir: 'export', output: 'export' }),
  devIndicators: false,
  experimental: {
    globalNotFound: true,
  },
};

const mergedConfig = withMdx(withDeploymentConfig(nextConfig));

if (!process.env.CI) {
  delete mergedConfig.experimental?.cpus;
}

export default mergedConfig;
