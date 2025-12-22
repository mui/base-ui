import * as React from 'react';
import { expect } from 'chai';
import { getReactElementRef } from './getReactElementRef';

describe('getReactElementRef', () => {
  it('returns null when not provided a React element', () => {
    expect(getReactElementRef(false)).to.equal(null);
    expect(getReactElementRef(undefined)).to.equal(null);
    expect(getReactElementRef(1)).to.equal(null);

    const children = [<div key="1" />, <div key="2" />];
    expect(getReactElementRef(children)).to.equal(null);
  });

  it('returns the ref of a React element', () => {
    const ref = React.createRef<HTMLDivElement>();
    const element = <div ref={ref} />;

    expect(getReactElementRef(element)).to.equal(ref);
  });

  it('returns null for a fragment', () => {
    const element = (
      <React.Fragment>
        <p>Hello</p>
        <p>Hello</p>
      </React.Fragment>
    );

    expect(getReactElementRef(element)).to.equal(null);
  });

  it('returns null for an element without a ref', () => {
    const element = <div />;

    expect(getReactElementRef(element)).to.equal(null);
  });
});
