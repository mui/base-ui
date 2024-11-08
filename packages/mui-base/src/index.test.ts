/* eslint import/namespace: ['error', { allowComputed: true }] */
/**
 * Important: This test also serves as a point to
 * import the entire lib for coverage reporting
 */
import { expect } from 'chai';
import * as BaseUI from './index.js';

describe('@base_ui/react', () => {
  it('should have exports', () => {
    expect(typeof BaseUI).to.equal('object');
  });

  it('should not have undefined exports', () => {
    Object.keys(BaseUI).forEach((exportKey) => {
      expect(Boolean((BaseUI as Record<string, unknown>)[exportKey])).to.equal(true);
    });
  });
});
