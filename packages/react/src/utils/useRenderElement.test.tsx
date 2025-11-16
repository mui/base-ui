/* eslint-disable testing-library/render-result-naming-convention */
import * as React from 'react';
import { expect } from 'chai';
import { createRenderer } from '#test-utils';
import { isReactVersionAtLeast } from '@base-ui-components/utils/reactVersion';
import type { BaseUIComponentProps } from '../utils/types';
import { useRenderElement, getElementRef } from './useRenderElement';

describe('useRenderElement', () => {
  const { render } = createRenderer();

  const TestComponent = React.forwardRef(function TestComponent(
    componentProps: BaseUIComponentProps<'div', { active?: boolean }> & { active?: boolean },
    forwardedRef: React.ForwardedRef<HTMLDivElement>,
  ) {
    const { className, render: renderProp, active, ...elementProps } = componentProps;

    const state = React.useMemo(() => ({ active }), [active]);

    const element = useRenderElement('div', componentProps, {
      state,
      ref: forwardedRef,
      props: [{ ...elementProps, className: 'test-component', style: { padding: '10px' } }],
    });

    return element;
  });

  it('accepts className as function', async () => {
    const { container } = await render(
      <TestComponent
        active
        className={(state) => (state.active ? 'active-class' : 'inactive-class')}
      />,
    );

    const element = container.firstElementChild;

    expect(element).to.have.attribute('class', 'active-class test-component');
  });

  it('accepts className as function that returns undefined', async () => {
    const { container } = await render(
      <TestComponent className={(state) => (state.active ? 'active-class' : undefined)} />,
    );

    const element = container.firstElementChild;

    expect(element).to.have.attribute('class', 'test-component');
  });

  it('accepts style as function', async () => {
    const { container } = await render(
      <TestComponent
        active
        style={(state) => ({ color: state.active ? 'rgb(255,0,0)' : 'rgb(0,255,0)' })}
      />,
    );

    const element = container.firstElementChild;

    expect(element?.getAttribute('style')).to.equal('padding: 10px; color: rgb(255, 0, 0);');
  });

  it('accepts style as function that returns undefined', async () => {
    const { container } = await render(
      <TestComponent style={(state) => (state.active ? { color: 'rgb(255,0,0)' } : undefined)} />,
    );

    const element = container.firstElementChild;

    expect(element?.getAttribute('style')).to.equal('padding: 10px;');
  });

  describe('getElementRef', () => {
    it('should return null when not used correctly', () => {
      // @ts-expect-error
      expect(getElementRef(false)).to.equal(null);
      // @ts-expect-error
      expect(getElementRef()).to.equal(null);
      // @ts-expect-error
      expect(getElementRef(1)).to.equal(null);

      const children = [<div key="1" />, <div key="2" />];
      // @ts-expect-error
      expect(getElementRef(children)).to.equal(null);
    });

    it('should return the ref of a React element', () => {
      const ref = React.createRef<HTMLDivElement>();
      const element = <div ref={ref} />;
      expect(getElementRef(element)).to.equal(ref);
    });

    it('should return undefined for a fragment', () => {
      const element = (
        <React.Fragment>
          <p>Hello</p>
          <p>Hello</p>
        </React.Fragment>
      );
      expect(getElementRef(element)).to.equal(isReactVersionAtLeast(19) ? undefined : null);
    });

    it('should return undefined for element with no ref', () => {
      const element = <div />;
      expect(getElementRef(element)).to.equal(isReactVersionAtLeast(19) ? undefined : null);
    });
  });
});
