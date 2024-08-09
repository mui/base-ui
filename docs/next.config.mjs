// @ts-check
import * as path from 'path';
import * as url from 'url';
import * as fs from 'fs';
// eslint-disable-next-line no-restricted-imports
import withDocsInfra from '@mui/monorepo/docs/nextConfigDocsInfra.js';
import { LANGUAGES, LANGUAGES_IGNORE_PAGES, LANGUAGES_IN_PROGRESS } from './config.js';

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
      }),
};

export default withDocsInfra(nextConfig);
