import getBaseConfig from '@mui/internal-code-infra/babel-config';

const errorCodesPath = new URL(import.meta.resolve('./docs/public/static/error-codes.json'))
  .pathname;
const missingError = process.env.MUI_EXTRACT_ERROR_CODES === 'true' ? 'write' : 'annotate';

export default function getBabelConfig(api) {
  const baseConfig = getBaseConfig(api);

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
