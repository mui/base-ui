import { expect } from 'vitest';
import { ProgressRootDataAttributes } from './root/ProgressRootDataAttributes';
import { progressStateAttributesMapping } from './root/stateAttributesMapping';

// The state-attribute mapping derives these attribute names without referencing
// `ProgressRootDataAttributes`, so re-link the runtime output to the public enum
// in tests. Test-only imports add no production bytes.
describe('Progress enum sync', () => {
  it.each([
    ['indeterminate', ProgressRootDataAttributes.indeterminate],
    ['progressing', ProgressRootDataAttributes.progressing],
    ['complete', ProgressRootDataAttributes.complete],
  ] as const)('names the %s data-attribute per ProgressRootDataAttributes', (status, attribute) => {
    const emitted = progressStateAttributesMapping.status!(status);

    expect(Object.keys(emitted!)).toEqual([attribute]);
  });
});
