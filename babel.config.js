const { resolve } = require('node:path');

const errorCodesPath = resolve(__dirname, './docs/public/static/error-codes.json');
const missingError = process.env.MUI_EXTRACT_ERROR_CODES === 'true' ? 'write' : 'annotate';

module.exports = function getBabelConfig(api) {
  const useESModules = !api.env(['node']);

  const presets = [
    [
      '@babel/preset-env',
      {
        bugfixes: true,
        browserslistEnv: process.env.BABEL_ENV || process.env.NODE_ENV,
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
    ['@babel/plugin-transform-runtime', { regenerator: false, version: '^7.26.10' }],
    [
      'babel-plugin-transform-react-remove-prop-types',
      {
        mode: 'unsafe-wrap',
      },
    ],
    'babel-plugin-add-import-extension',
    '@babel/plugin-transform-react-constant-elements',
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
  };
};
