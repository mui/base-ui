/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest';
import type { CodePrecompute } from '@mui/internal-docs-infra/lite/runtime';
import { openDemoCodeSandbox, openDemoStackBlitz } from './demoSandboxes';

const code: CodePrecompute = {
  deferredUrl: '/demo-sources/example.json',
  variants: {
    Default: {
      fileName: 'Demo.tsx',
      exportName: 'default',
      html: '<span>truncated</span>',
      language: 'tsx',
      totalLines: 20,
    },
  },
};

describe('demo sandboxes', () => {
  it('rejects a StackBlitz project when deferred sources failed to load', () => {
    expect(() => openDemoStackBlitz(code, 'Default', 'Demo', null)).toThrow(
      'Deferred demo sources failed to load',
    );
  });

  it('rejects a CodeSandbox project when deferred sources failed to load', () => {
    expect(() => openDemoCodeSandbox(code, 'Default', 'Demo', null)).toThrow(
      'Deferred demo sources failed to load',
    );
  });
});
