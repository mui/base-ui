import { expect } from 'vitest';
import { transitionStatusMapping } from './stateAttributesMapping';
import { fieldValidityMapping } from './field-constants/constants';

// Every animated component and every field-aware component emits these attributes, so pin the
// names against literals: comparing against the constants the mappings already read would pass
// through any rename.
describe('shared state-attribute mappings', () => {
  describe('transitionStatusMapping', () => {
    it('emits the transition data attributes', () => {
      expect(transitionStatusMapping.transitionStatus('starting')).toEqual({
        'data-starting-style': '',
      });
      expect(transitionStatusMapping.transitionStatus('ending')).toEqual({
        'data-ending-style': '',
      });
    });

    it('emits nothing outside a transition', () => {
      expect(transitionStatusMapping.transitionStatus('idle')).toBe(null);
      expect(transitionStatusMapping.transitionStatus(undefined)).toBe(null);
    });
  });

  describe('fieldValidityMapping', () => {
    it('emits the validity data attributes', () => {
      expect(fieldValidityMapping.valid(true)).toEqual({ 'data-valid': '' });
      expect(fieldValidityMapping.valid(false)).toEqual({ 'data-invalid': '' });
    });

    it('emits nothing while validity is unknown', () => {
      expect(fieldValidityMapping.valid(null)).toBe(null);
    });
  });
});
