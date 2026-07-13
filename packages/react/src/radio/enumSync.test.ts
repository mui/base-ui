import { expect } from 'vitest';
import { stateAttributesMapping } from './utils/stateAttributesMapping';
import { RadioRootDataAttributes } from './root/RadioRootDataAttributes';

// The state-attribute mapping inlines these enum members as string literals so
// `RadioRootDataAttributes` tree-shakes out of the bundle (it is kept for
// types/docs only). Nothing else links the literals to the enum, so re-link
// them here: renaming only one side fails CI.
describe('Radio enum sync', () => {
  it('names the checked/unchecked data-attributes per RadioRootDataAttributes', () => {
    expect(Object.keys(stateAttributesMapping.checked(true))[0]).toBe(
      RadioRootDataAttributes.checked,
    );
    expect(Object.keys(stateAttributesMapping.checked(false))[0]).toBe(
      RadioRootDataAttributes.unchecked,
    );
  });
});
