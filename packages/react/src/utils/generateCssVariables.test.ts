import { expect } from 'chai';
import { generateCssVariables } from './generateCssVariables';

describe('generateCssVariables', () => {
  it('converts the string to a CSS variables', () => {
    expect(generateCssVariables(['width'])).to.deep.equal({ width: '--width' });
  });

  it('converts correctly multi-word strings to CSS variable', () => {
    expect(generateCssVariables(['maxWidth'])).to.deep.equal({ maxWidth: '--max-width' });
  });
});
