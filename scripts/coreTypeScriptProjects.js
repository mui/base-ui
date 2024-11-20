import path from 'path';

export default {
  react: {
    rootPath: path.join(process.cwd(), 'packages/react'),
    entryPointPath: 'src/index.ts',
    tsConfigPath: 'tsconfig.build.json',
  },
  docs: {
    rootPath: path.join(process.cwd(), 'docs'),
    tsConfigPath: 'tsconfig.json',
  },
};
