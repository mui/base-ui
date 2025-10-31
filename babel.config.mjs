import getBaseConfig from '@mui/internal-code-infra/babel-config';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));

const errorCodesPath = path.join(dirname, 'docs/src/error-codes.json');

export default function getBabelConfig(api) {
  const baseConfig = getBaseConfig(api);

  const plugins = [
    [
      '@mui/internal-babel-plugin-minify-errors',
      {
        missingError: 'annotate',
        runtimeModule: '#formatErrorMessage',
        detection: 'opt-out',
        errorCodesPath,
      },
    ],
    [
      'babel-plugin-react-compiler',
      /** @type {import('babel-plugin-react-compiler').PluginOptions} */ ({
        compilationMode: 'infer',
        // When targeting react v17 or v18, the packages also need to have
        // "react-compiler-runtime" as a dependency.
        target: '17',
        enableReanimatedCheck: false,
      }),
    ],
  ];

  return {
    ...baseConfig,
    plugins: [...plugins, ...baseConfig.plugins],
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
}
