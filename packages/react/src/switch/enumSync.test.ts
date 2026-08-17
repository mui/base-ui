import { expect } from 'vitest';
import { stateAttributesMapping } from './stateAttributesMapping';
import { SwitchRootDataAttributes } from './root/SwitchRootDataAttributes';

// The state-attribute mapping inlines these enum members as string literals so
// `SwitchRootDataAttributes` tree-shakes out of the bundle (it is kept for
// types/docs only). Nothing else links the literals to the enum, so re-link
// them here: renaming only one side fails CI.
describe('Switch enum sync', () => {
  it('names the checked/unchecked data-attributes per SwitchRootDataAttributes', () => {
    expect(Object.keys(stateAttributesMapping.checked!(true)!)[0]).toBe(
      SwitchRootDataAttributes.checked,
    );
    expect(Object.keys(stateAttributesMapping.checked!(false)!)[0]).toBe(
      SwitchRootDataAttributes.unchecked,
    );
  });
});
