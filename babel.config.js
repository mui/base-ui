const path = require('path');

const errorCodesPath = path.resolve(__dirname, './docs/src/error-codes.json');
const missingError = process.env.MUI_EXTRACT_ERROR_CODES === 'true' ? 'write' : 'annotate';

function resolveAliasPath(relativeToBabelConf) {
  const resolvedPath = path.relative(process.cwd(), path.resolve(__dirname, relativeToBabelConf));
  return `./${resolvedPath.replace('\\', '/')}`;
}

module.exports = function getBabelConfig(api) {
  const useESModules = !api.env(['node']);

  const defaultAlias = {
    docs: resolveAliasPath('./docs'),
    test: resolveAliasPath('./test'),
    '@mui-internal/api-docs-builder': resolveAliasPath(
      './node_modules/@mui/monorepo/packages/api-docs-builder',
    ),
  };

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
      },
    ],
    '@babel/preset-typescript',
  ];

  const plugins = [
    'babel-plugin-optimize-clsx',
    [
      '@babel/plugin-transform-runtime',
      {
        useESModules,
        // any package needs to declare 7.4.4 as a runtime dependency. default is ^7.0.0
        version: '^7.4.4',
      },
    ],
    [
      'babel-plugin-transform-react-remove-prop-types',
      {
        mode: 'unsafe-wrap',
      },
    ],
    [
      '@mui/internal-babel-plugin-minify-errors',
      {
        errorCodesPath,
        missingError,
        runtimeModule: '#formatErrorMessage',
        detection: 'opt-out',
      },
    ],
  ];

  const devPlugins = [
    [
      'babel-plugin-module-resolver',
      {
        root: ['./'],
        alias: defaultAlias,
      },
    ],
    'babel-plugin-add-import-extension',
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
      development: {
        plugins: devPlugins,
      },
      test: {
        sourceMaps: 'both',
        plugins: devPlugins,
      },
      production: {
        plugins: ['babel-plugin-add-import-extension'],
      },
    },
  };
};
