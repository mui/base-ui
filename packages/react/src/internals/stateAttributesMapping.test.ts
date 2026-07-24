import { expect } from 'vitest';
import { transitionStatusMapping, TransitionStatusDataAttributes } from './stateAttributesMapping';
import { fieldValidityMapping } from './field-constants/constants';
import * as FieldControlDataAttributes from '../field/control/FieldControlDataAttributes';

// These shared mappings inline their enum members as string literals so the
// enums tree-shake out of every consumer bundle (they are kept for types/docs
// only). Nothing else links the literals to the enums, so re-link them here:
// renaming only one side fails CI.
describe('internals state-attribute enum sync', () => {
  it('names the transition data-attributes per TransitionStatusDataAttributes', () => {
    expect(Object.keys(transitionStatusMapping.transitionStatus('starting')!)[0]).toBe(
      TransitionStatusDataAttributes.startingStyle,
    );
    expect(Object.keys(transitionStatusMapping.transitionStatus('ending')!)[0]).toBe(
      TransitionStatusDataAttributes.endingStyle,
    );
  });

  it('names the validity data-attributes per FieldControlDataAttributes', () => {
    expect(Object.keys(fieldValidityMapping.valid(true)!)[0]).toBe(
      FieldControlDataAttributes.valid,
    );
    expect(Object.keys(fieldValidityMapping.valid(false)!)[0]).toBe(
      FieldControlDataAttributes.invalid,
    );
  });
});
