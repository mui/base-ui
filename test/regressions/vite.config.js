import * as path from 'path';
import { defineConfig, mergeConfig } from 'vite';
import sharedConfig from '../vite.shared.config';

export default mergeConfig(
  sharedConfig,
  defineConfig({
    root: path.join(process.cwd(), 'test/regressions'),
  }),
);
