import path from 'path';

export default {
  base: {
    rootPath: path.join(process.cwd(), 'packages/mui-base'),
    entryPointPath: 'src/index.d.ts',
  },
  docs: {
    rootPath: path.join(process.cwd(), 'docs'),
    tsConfigPath: 'tsconfig.json',
  },
};
