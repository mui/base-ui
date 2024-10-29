import { defineWorkspace } from 'vitest/config';

export default defineWorkspace(['packages/*/vitest.config.ts', 'docs/vitest.config.ts']);
