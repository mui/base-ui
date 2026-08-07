import assert from 'node:assert/strict';
import test from 'node:test';
import { getHarnessDependencyMismatches } from './checkHarnessCompatibility.mts';

test('accepts matching harness dependencies across dependency sections', () => {
  const base = {
    dependencies: { react: '19.2.5' },
    devDependencies: { vitest: '4.1.8' },
  };
  const head = {
    dependencies: { react: '19.2.5', vitest: '4.1.8' },
  };

  assert.deepEqual(getHarnessDependencyMismatches(base, head), []);
});

test('reports changed and newly added harness dependencies', () => {
  const base = {
    dependencies: { react: '19.2.4' },
  };
  const head = {
    dependencies: { react: '19.2.5' },
    devDependencies: { '@mui/internal-benchmark': '0.0.3-canary.7' },
  };

  assert.deepEqual(getHarnessDependencyMismatches(base, head), [
    '@mui/internal-benchmark',
    'react',
  ]);
});
