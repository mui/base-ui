import { expect } from 'chai';
import { combineComponentExports } from './combineComponentExports';

const Root = function Root() {
  return 'root';
};

const Sub1 = function Sub1() {
  return 'sub1';
};

const Sub2 = function Sub2() {
  return 'sub2';
};

describe('combineComponentExports', () => {
  it('should combine the exports', () => {
    const Combined = combineComponentExports(Root, { Sub1, Sub2 });

    expect(Combined).haveOwnProperty('Sub1');
    expect(Combined).haveOwnProperty('Sub2');

    expect(Combined()).to.equal('root');
    expect(Combined.Sub1()).to.equal('sub1');
    expect(Combined.Sub2()).to.equal('sub2');
  });
});
