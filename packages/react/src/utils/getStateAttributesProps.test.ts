import { expect } from 'chai';
import { getStateAttributesProps } from './getStateAttributesProps';

describe('getStateAttributesProps', () => {
  it('converts the state fields to data attributes', () => {
    const state = {
      checked: true,
      orientation: 'vertical',
      count: 42,
    };

    const result = getStateAttributesProps(state);
    expect(result).to.deep.equal({
      'data-checked': '',
      'data-orientation': 'vertical',
      'data-count': '42',
    });
  });

  it('changes the fields names to lowercase', () => {
    const state = {
      readOnly: true,
    };

    const result = getStateAttributesProps(state);
    expect(result).to.deep.equal({
      'data-readonly': '',
    });
  });

  it('changes true values to a data-attribute without a value', () => {
    const state = {
      required: true,
      disabled: false,
    };

    const result = getStateAttributesProps(state);
    expect(result).to.deep.equal({ 'data-required': '' });
  });

  it('does not include false values', () => {
    const state = {
      required: true,
      disabled: false,
    };

    const result = getStateAttributesProps(state);
    expect(result).not.to.haveOwnProperty('data-disabled');
  });

  it('supports custom mapping', () => {
    const state = {
      checked: true,
      orientation: 'vertical',
      count: 42,
    };

    const result = getStateAttributesProps(state, {
      checked: (value) => ({ 'data-state': value ? 'checked' : 'unchecked' }),
    });

    expect(result).to.deep.equal({
      'data-state': 'checked',
      'data-orientation': 'vertical',
      'data-count': '42',
    });
  });

  it('supports nulls returned from custom mapping', () => {
    const state = {
      checked: false,
      orientation: 'vertical',
    };

    const result = getStateAttributesProps(state, {
      checked: (value) => (value === true ? { 'data-state': 'checked' } : null),
    });

    expect(result).to.deep.equal({
      'data-orientation': 'vertical',
    });
  });
});
