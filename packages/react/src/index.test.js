/* eslint import/namespace: ['error', { allowComputed: true }] */
/**
 * Important: This test also serves as a point to
 * import the entire lib for coverage reporting
 */
import { expect } from 'chai';
import { describe, it } from 'vitest';
import * as BaseUI from './index';

describe('@base-ui-components/react', () => {
  it('should have exports', () => {
    expect(typeof BaseUI).to.equal('object');
  });

  it('should not have undefined exports', () => {
    Object.keys(BaseUI).forEach((exportKey) => {
      expect(Boolean(BaseUI[exportKey])).to.equal(true);
    });
  });
});
