import { expect } from 'chai';
import { linearScale } from './linearScale';

describe('linearScale', () => {
  it('scales the value', () => {
    expect(linearScale(5, 10, 0)).to.equal(0.5);
    expect(linearScale(5, 10, 0, 100)).to.equal(50);
    expect(linearScale(2, 5, -1)).to.equal(0.5);
  });
});
