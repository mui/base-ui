/* eslint-disable testing-library/render-result-naming-convention */
import * as React from 'react';
import { expect } from 'chai';
import { vi } from 'vitest';
import { createRenderer } from '#test-utils';
import { reactMajor } from '@mui/internal-test-utils';
import type { BaseUIComponentProps, ComponentRenderFn, HTMLProps } from '../utils/types';
import { useRenderElement } from './useRenderElement';

describe('useRenderElement', () => {
  const { render } = createRenderer();

  const TestComponent = React.forwardRef(function TestComponent(
    componentProps: BaseUIComponentProps<'div', { active?: boolean }> & { active?: boolean },
    forwardedRef: React.ForwardedRef<HTMLDivElement>,
  ) {
    const { className, render: renderProp, active, ...elementProps } = componentProps;

    const state = { active };

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

  describe('prop: render', () => {
    it('accepts render as a function that receives props and state', async () => {
      const renderCalls: Array<[HTMLProps, { active?: boolean }]> = [];
      const renderFn: ComponentRenderFn<HTMLProps, { active?: boolean }> = (props, state) => {
        renderCalls.push([props, state]);
        return <span {...props} data-active={String(state.active)} />;
      };

      const { container } = await render(
        <TestComponent active render={renderFn} data-testid="custom" />,
      );

      const element = container.firstElementChild;

      expect(renderCalls.length).to.be.greaterThan(0);
      const [firstCallProps, firstCallState] = renderCalls[0];
      expect(firstCallProps).to.include({
        className: 'test-component',
        'data-testid': 'custom',
      });
      expect(firstCallProps.style).to.deep.equal({ padding: '10px' });
      expect(firstCallState).to.deep.equal({ active: true });
      expect(element?.tagName).to.equal('SPAN');
      expect(element).to.have.attribute('data-testid', 'custom');
      expect(element).to.have.attribute('data-active', 'true');
    });

    it('warns when render is passed a function with an uppercase name', async () => {
      const warnSpy = vi
        .spyOn(console, 'warn')
        .mockName('console.warn')
        .mockImplementation(() => {});

      function UppercaseRenderPropWarningTestComponent(props: React.ComponentPropsWithRef<'span'>) {
        return <span {...props} />;
      }

      await render(<TestComponent render={UppercaseRenderPropWarningTestComponent} />);

      expect(warnSpy.mock.calls.length).to.equal(1);
      expect(warnSpy.mock.calls[0][0]).to.contain(
        'Base UI: The `render` prop received a function named `UppercaseRenderPropWarningTestComponent` that starts with an uppercase letter.',
      );
      expect(warnSpy.mock.calls[0][0]).to.contain(
        'Use `render={<Component />}` or `render={(props) => <Component {...props} />}` instead.',
      );
      warnSpy.mockRestore();
    });

    it('does not warn when render is passed a lowercase callback', async () => {
      const warnSpy = vi
        .spyOn(console, 'warn')
        .mockName('console.warn')
        .mockImplementation(() => {});

      const renderFn = (props: React.ComponentPropsWithRef<'span'>) => <span {...props} />;

      await render(<TestComponent render={renderFn} />);

      expect(warnSpy.mock.calls.length).to.equal(0);
      warnSpy.mockRestore();
    });

    it('does not warn when render is passed as a React element', async () => {
      const warnSpy = vi
        .spyOn(console, 'warn')
        .mockName('console.warn')
        .mockImplementation(() => {});

      function UppercaseRenderElement(props: React.ComponentPropsWithRef<'span'>) {
        return <span {...props} />;
      }

      await render(<TestComponent render={<UppercaseRenderElement />} />);

      expect(warnSpy.mock.calls.length).to.equal(0);
      warnSpy.mockRestore();
    });

    it('accepts render as a React element and clones it with merged props', async () => {
      const CustomElement = React.forwardRef<HTMLSpanElement, React.ComponentPropsWithRef<'span'>>(
        function CustomElement(props, ref) {
          return <span ref={ref} {...props} />;
        },
      );

      const { container } = await render(
        <TestComponent active render={<CustomElement data-active="true" />} data-testid="custom" />,
      );

      const element = container.firstElementChild;

      expect(element?.tagName).to.equal('SPAN');
      expect(element).to.have.attribute('data-testid', 'custom');
      expect(element).to.have.attribute('data-active', 'true');
    });

    it('forwards ref to render element', async () => {
      const CustomElement = React.forwardRef<HTMLDivElement, React.ComponentPropsWithRef<'div'>>(
        function CustomElement(props, ref) {
          return <div ref={ref} {...props} />;
        },
      );

      const ref = React.createRef<HTMLDivElement>();
      const { container } = await render(<TestComponent ref={ref} render={<CustomElement />} />);
      const element = container.firstElementChild;
      expect(ref.current).to.equal(element);
    });

    it('merges className from render element and component props', async () => {
      const { container } = await render(
        <TestComponent
          active
          className="component-class"
          render={<div className="render-class" />}
        />,
      );

      const element = container.firstElementChild;

      expect(element?.className).to.contain('component-class');
      expect(element?.className).to.contain('render-class');
      expect(element?.className).to.contain('test-component');
    });

    it('merges className function with render element', async () => {
      const { container } = await render(
        <TestComponent
          active
          className={(state) => (state.active ? 'active-class' : '')}
          render={<div className="render-class" />}
        />,
      );

      const element = container.firstElementChild;

      expect(element?.className).to.contain('active-class');
      expect(element?.className).to.contain('render-class');
      expect(element?.className).to.contain('test-component');
    });

    it('merges style from render element and component props', async () => {
      const { container } = await render(
        <TestComponent
          active
          style={{ color: 'rgb(255, 0, 0)' }}
          render={<div style={{ fontSize: '16px' }} />}
        />,
      );

      const element = container.firstElementChild as HTMLElement;
      expect(element.style.padding).to.equal('10px');
      expect(element.style.color).to.equal('rgb(255, 0, 0)');
      expect(element.style.fontSize).to.equal('16px');
    });

    it('merges style function with render element', async () => {
      const { container } = await render(
        <TestComponent
          active
          style={(state) => ({ color: state.active ? 'rgb(255, 0, 0)' : 'rgb(0, 0, 0)' })}
          render={<div style={{ fontSize: '16px' }} />}
        />,
      );

      const element = container.firstElementChild as HTMLElement;
      expect(element.style.padding).to.equal('10px');
      expect(element.style.color).to.equal('rgb(255, 0, 0)');
      expect(element.style.fontSize).to.equal('16px');
    });

    it('handles lazy elements', async () => {
      const LazyComponent = React.lazy(() =>
        Promise.resolve({
          default: React.forwardRef<HTMLDivElement, React.ComponentPropsWithRef<'div'>>(
            function LazyDiv(props, ref) {
              return <div ref={ref} data-lazy="true" {...props} />;
            },
          ),
        }),
      );

      const { container } = await render(
        <React.Suspense fallback={<div>Loading…</div>}>
          <TestComponent active render={<LazyComponent data-testid="lazy" />} />
        </React.Suspense>,
      );

      const element = container.firstElementChild;
      expect(element).to.not.equal(null);
      expect(element?.getAttribute('data-testid')).to.equal('lazy');
      expect(element?.getAttribute('data-lazy')).to.equal('true');
      expect(element?.className).to.contain('test-component');
    });

    // React 18 also log console error, React 19 fixed that. Ignoring this test for React 18.
    it.skipIf(reactMajor < 19)(
      'throws error for invalid render element in development',
      async () => {
        const originalEnv = process.env.NODE_ENV;

        let error: Error | null = null;
        try {
          process.env.NODE_ENV = 'development';
          await render(<TestComponent render={'not a valid element' as any} />);
        } catch (err) {
          error = err as Error;
        } finally {
          process.env.NODE_ENV = originalEnv;
        }

        expect(error).to.not.equal(null);
        expect(error?.message).to.match(
          /Base UI: The `render` prop was provided an invalid React element/,
        );
      },
    );

    it('handles render element with existing ref', async () => {
      const CustomElement = React.forwardRef<HTMLDivElement, React.ComponentPropsWithRef<'div'>>(
        function CustomElement(props, ref) {
          return <div ref={ref} {...props} />;
        },
      );

      const renderRef = React.createRef<HTMLDivElement>();
      const componentRef = React.createRef<HTMLDivElement>();

      await render(<TestComponent ref={componentRef} render={<CustomElement ref={renderRef} />} />);

      expect(renderRef.current).to.be.instanceOf(HTMLDivElement);
      expect(componentRef.current).to.be.instanceOf(HTMLDivElement);
      expect(renderRef.current).to.equal(componentRef.current);
    });
  });
});
