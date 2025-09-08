import getBaseConfig from '@mui/internal-code-infra/babel-config';

const errorCodesPath = new URL(import.meta.resolve('docs/src/error-codes.json')).pathname;

export default function getBabelConfig(api) {
  const baseConfig = getBaseConfig(api);

  const plugins = [
    [
      '@mui/internal-babel-plugin-minify-errors',
      {
        missingError: 'annotate',
        errorCodesPath,
        runtimeModule: '#formatErrorMessage',
        detection: 'opt-out',
      },
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
