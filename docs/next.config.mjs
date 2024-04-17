// @ts-check
import * as path from 'path';
import * as url from 'url';
import * as fs from 'fs';
import { createRequire } from 'module';
// @ts-expect-error This expected error should be gone once we update the monorepo
// eslint-disable-next-line no-restricted-imports
import withDocsInfra from '@mui/monorepo/docs/nextConfigDocsInfra.js';
import { findPages } from './src/modules/utils/find.mjs';
import {
  LANGUAGES,
  LANGUAGES_SSR,
  LANGUAGES_IGNORE_PAGES,
  LANGUAGES_IN_PROGRESS,
} from './config.js';

const currentDirectory = url.fileURLToPath(new URL('.', import.meta.url));
const require = createRequire(import.meta.url);

const workspaceRoot = path.join(currentDirectory, '../');

/**
 * @param {string} pkgPath
 * @returns {{version: string}}
 */
function loadPkg(pkgPath) {
  const pkgContent = fs.readFileSync(path.resolve(workspaceRoot, pkgPath, 'package.json'), 'utf8');
  return JSON.parse(pkgContent);
}

const pkg = loadPkg('.');

export default withDocsInfra({
  experimental: {
    workerThreads: true,
    cpus: 3,
  },
  // Avoid conflicts with the other Next.js apps hosted under https://mui.com/
  assetPrefix: process.env.DEPLOY_ENV === 'development' ? undefined : '/base-ui/',
  env: {
    // docs-infra
    LIB_VERSION: pkg.version,
    SOURCE_CODE_REPO: 'https://github.com/mui/base-ui',
    SOURCE_GITHUB_BRANCH: 'master',
    GITHUB_TEMPLATE_DOCS_FEEDBACK: '6.docs-feedback.yml',
  },
  // @ts-ignore
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
          'docs-base': path.resolve(currentDirectory, '../docs'),
          docs: path.resolve(currentDirectory, '../node_modules/@mui/monorepo/docs'),
        },
      },
      module: {
        ...config.module,
        rules: config.module.rules.concat([
          {
            test: /\.md$/,
            oneOf: [
              {
                resourceQuery: /@mui\/markdown/,
                use: [
                  options.defaultLoaders.babel,
                  {
                    loader: require.resolve('@mui/internal-markdown/loader'),
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
            ],
          },
          {
            test: /\.+(js|jsx|mjs|ts|tsx)$/,
            include: includesMonorepo,
            use: options.defaultLoaders.babel,
          },
          {
            test: /\.(js|mjs|ts|tsx)$/,
            include: [workspaceRoot],
            exclude: /node_modules/,
            use: options.defaultLoaders.babel,
          },
        ]),
      },
    };
  },
  distDir: 'export',
  // Next.js provides a `defaultPathMap` argument, we could simplify the logic.
  // However, we don't in order to prevent any regression in the `findPages()` method.
  exportPathMap: () => {
    const pages = findPages();
    const map = {};

    // @ts-ignore
    function traverse(pages2, userLanguage) {
      const prefix = userLanguage === 'en' ? '' : `/${userLanguage}`;

      // @ts-ignore
      pages2.forEach((page) => {
        // The experiments pages are only meant for experiments, they shouldn't leak to production.
        if (page.pathname.includes('/experiments/') && process.env.DEPLOY_ENV === 'production') {
          return;
        }

        if (!page.children) {
          // @ts-ignore
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
      traverse(pages, 'en');
    } else {
      // eslint-disable-next-line no-console
      console.log('Considering various locales for SSR');
      LANGUAGES_SSR.forEach((userLanguage) => {
        traverse(pages, userLanguage);
      });
    }

    return map;
  },
  transpilePackages: ['@mui/docs'],
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
            destination: '/base-ui/',
            permanent: false,
          },
        ],
      }),
});
