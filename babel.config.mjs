import getBaseConfig from '@mui/internal-code-infra/babel-config';

export default function getBabelConfig(api) {
  const baseConfig = getBaseConfig(api);

  return {
    ...baseConfig,
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
