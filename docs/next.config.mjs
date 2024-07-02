// @ts-check
import * as path from 'path';
import * as url from 'url';
import * as fs from 'fs';
// eslint-disable-next-line no-restricted-imports
import withDocsInfra from '@mui/monorepo/docs/nextConfigDocsInfra.js';
import { findPages } from './src/utils/findPages.mjs';
import {
  LANGUAGES,
  LANGUAGES_SSR,
  LANGUAGES_IGNORE_PAGES,
  LANGUAGES_IN_PROGRESS,
} from './config.js';

const currentDirectory = url.fileURLToPath(new URL('.', import.meta.url));
const workspaceRoot = path.resolve(currentDirectory, '../');

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
  // Avoid conflicts with the other Next.js apps hosted under https://mui.com/
  assetPrefix: process.env.DEPLOY_ENV === 'development' ? undefined : '/base-ui/',
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
          'docs-base': path.resolve(workspaceRoot, 'docs'),
          docs: path.resolve(workspaceRoot, 'node_modules/@mui/monorepo/docs'),
        },
      },
      module: {
        ...config.module,
        rules: config.module.rules.concat([
          {
            test: /\.md$/,
            resourceQuery: /@mui\/markdown/,
            use: [
              options.defaultLoaders.babel,
              {
                loader: '@mui/internal-markdown/loader',
                options: {
                  workspaceRoot,
                  ignoreLanguagePages: LANGUAGES_IGNORE_PAGES,
                  languagesInProgress: LANGUAGES_IN_PROGRESS,
                  packages: [
                    {
                      productId: 'base-ui',
                      paths: [path.join(workspaceRoot, 'packages/mui-base/src')],
                    },
                  ],
                  env: {
                    SOURCE_CODE_REPO: options.config.env.SOURCE_CODE_REPO,
                    LIB_VERSION: options.config.env.LIB_VERSION,
                  },
                },
              },
            ],
          },
          {
            test: /\.+(js|jsx|mjs|ts|tsx)$/,
            include: includesMonorepo,
            use: options.defaultLoaders.babel,
          },
        ]),
      },
    };
  },
  distDir: 'export',
  // Next.js provides a `defaultPathMap` argument, we could simplify the logic.
  // However, we don't in order to prevent any regression in the `findPages()` method.
  exportPathMap,
  transpilePackages: ['@mui/docs', '@mui/monorepo'],
  ...(process.env.NODE_ENV === 'production'
    ? {
        output: 'export',
      }
    : {
        rewrites: async () => {
          return [
            { source: `/:lang(${LANGUAGES.join('|')})?/:rest*`, destination: '/:rest*' },
            { source: '/api/:rest*', destination: '/api-docs/:rest*' },
          ];
        },
        // redirects only take effect in the development, not production (because of `next export`).
        redirects: async () => [
          {
            source: '/',
            destination: '/base-ui/getting-started/',
            permanent: false,
          },
        ],
      }),
};

function exportPathMap() {
  const allPages = findPages();
  /**
   * @type {Record<string, {page: string, query: {userLanguage: string}}>}
   */
  const map = {};

  /**
   * @param {import('./src/utils/findPages.mjs').NextJSPage[]} pages
   * @param {string} userLanguage
   */
  function traverse(pages, userLanguage) {
    const prefix = userLanguage === 'en' ? '' : `/${userLanguage}`;

    pages.forEach((page) => {
      // The experiments pages are only meant for experiments, they shouldn't leak to production.
      if (page.pathname.includes('/experiments/') && process.env.DEPLOY_ENV === 'production') {
        return;
      }

      if (!page.children) {
        map[`${prefix}${page.pathname.replace(/^\/api-docs\/(.*)/, '/api/$1')}`] = {
          page: page.pathname,
          query: {
            userLanguage,
          },
        };
        return;
      }

      traverse(page.children, userLanguage);
    });
  }

  // We want to speed-up the build of pull requests.
  if (process.env.PULL_REQUEST === 'true') {
    // eslint-disable-next-line no-console
    console.log('Considering only English for SSR');
    traverse(allPages, 'en');
  } else {
    // eslint-disable-next-line no-console
    console.log('Considering various locales for SSR');
    LANGUAGES_SSR.forEach((userLanguage) => {
      traverse(allPages, userLanguage);
    });
  }

  return map;
}

export default withDocsInfra(nextConfig);
