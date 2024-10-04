// @ts-check
import * as path from 'path';
import * as url from 'url';
import * as fs from 'fs';
// eslint-disable-next-line no-restricted-imports
import withDocsInfra from '@mui/monorepo/docs/nextConfigDocsInfra.js';

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
            test: /\.+(js|jsx|mjs|ts|tsx)$/,
            include: includesMonorepo,
            use: options.defaultLoaders.babel,
          },
        ]),
      },
    };
  },
  distDir: 'export',
  transpilePackages: ['@mui/monorepo'],
  ...(process.env.NODE_ENV === 'production'
    ? {
        output: 'export',
      }
    : {}),
  experimental: {
    esmExternals: true,
    workerThreads: false,
  },
};

export default withDocsInfra(nextConfig);
