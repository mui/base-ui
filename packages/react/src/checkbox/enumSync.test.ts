import { expect } from 'vitest';
import { getCheckboxStateAttributesMapping } from './utils/getCheckboxStateAttributesMapping';
import { CheckboxRootDataAttributes } from './root/CheckboxRootDataAttributes';
import type { CheckboxRootState } from './root/CheckboxRoot';

// The state-attribute mapping inlines these enum members as string literals so
// `CheckboxRootDataAttributes` tree-shakes out of the bundle (it is kept for
// types/docs only). Nothing else links the literals to the enum, so re-link
// them here: renaming only one side fails CI.
describe('Checkbox enum sync', () => {
  const mapping = getCheckboxStateAttributesMapping({ indeterminate: false } as CheckboxRootState);

  it('names the checked/unchecked data-attributes per CheckboxRootDataAttributes', () => {
    expect(Object.keys(mapping.checked!(true)!)[0]).toBe(CheckboxRootDataAttributes.checked);
    expect(Object.keys(mapping.checked!(false)!)[0]).toBe(CheckboxRootDataAttributes.unchecked);
  });
});
