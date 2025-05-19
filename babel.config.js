const { resolve } = require('node:path');

const errorCodesPath = resolve(__dirname, './docs/public/static/error-codes.json');
const missingError = process.env.MUI_EXTRACT_ERROR_CODES === 'true' ? 'write' : 'annotate';
const baseUIPackageJson = require('./packages/react/package.json');

module.exports = function getBabelConfig(api) {
  const useESModules = !api.env('node');

  const presets = [
    [
      '@babel/preset-env',
      {
        bugfixes: true,
        browserslistEnv: api.env(),
        debug: process.env.MUI_BUILD_VERBOSE === 'true',
        modules: useESModules ? false : 'commonjs',
      },
    ],
    [
      '@babel/preset-react',
      {
        runtime: 'automatic',
        useBuiltIns: true,
        useSpread: true,
      },
    ],
    '@babel/preset-typescript',
  ];

  const plugins = [
    [
      'babel-plugin-macros',
      {
        muiError: {
          errorCodesPath,
          missingError,
        },
      },
    ],
    [
      '@babel/plugin-transform-runtime',
      { regenerator: false, version: baseUIPackageJson.dependencies['@babel/runtime'] },
    ],
    '@mui/internal-babel-plugin-display-name',
    ...(useESModules
      ? [['@mui/internal-babel-plugin-resolve-imports', { outExtension: '.js' }]]
      : []),
  ];

  return {
    assumptions: {
      noDocumentAll: true,
      // With our case these assumptions are safe, and the
      // resulting behavior is equivalent to spec mode.
      setPublicClassFields: true,
      privateFieldsAsProperties: true,
      objectRestNoSymbols: true,
      setSpreadProperties: true,
    },
    presets,
    plugins,
    ignore: [
      /@babel[\\|/]runtime/, // Fix a Windows issue.
      '**/*.template.js',
    ],
    overrides: [
      {
        exclude: /\.test\.(js|ts|tsx)$/,
        plugins: ['@babel/plugin-transform-react-constant-elements'],
      },
    ],
    env: {
      test: {
        sourceMaps: 'both',
      },
    },
  };
};
