import * as React from 'react';
import { expect } from 'chai';
import { evaluateRenderProp } from './evaluateRenderProp';

describe('evaluateRenderProp', () => {
  describe('function', () => {
    it('should call render function with props and state', () => {
      const render = (props: any, state: any) => <span {...props} {...state} />;
      expect(evaluateRenderProp(render, { id: 'a' }, { 'data-test': 'b' })).to.deep.equal(
        <span id="a" data-test="b" />,
      );
    });
  });

  describe('element', () => {
    it("should merge props, preferring the rendering element's props", () => {
      expect(evaluateRenderProp(<span id="a" />, { id: 'b', inputMode: 'text' }, {})).to.deep.equal(
        <span id="a" inputMode="text" />,
      );
    });
  });
});
