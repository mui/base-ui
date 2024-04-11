import * as React from 'react';
import { expect } from 'chai';
import { type BaseUiConformanceTestsOptions } from '../describeConformance';
import { throwMissingPropError } from './utils';

export function testRenderProp(
  element: React.ReactElement,
  getOptions: () => BaseUiConformanceTestsOptions,
) {
  const { render, testRenderPropWith: Element = 'div' } = getOptions();

  if (!render) {
    throwMissingPropError('render');
  }

  const Wrapper = React.forwardRef<any, { children?: React.ReactNode }>(
    function Wrapper(props, forwardedRef) {
      return (
        <div data-testid="base-ui-wrapper">
          {/* @ts-ignore */}
          <Element ref={forwardedRef} {...props} />
        </div>
      );
    },
  );

  describe('prop: render', () => {
    it('renders a customized root element', async () => {
      await render(
        React.cloneElement(element, {
          render: (props: any) => <Wrapper {...props} />,
        }),
      );

      expect(document.querySelector('[data-testid="base-ui-wrapper"]')).to.not.equal(null);
    });

    it('should pass the ref to the custom component', () => {
      let instanceFromRef = null;

      function Test() {
        return React.cloneElement(element, {
          ref: (el: HTMLElement | null) => {
            instanceFromRef = el;
          },
          render: (props: {}) => <Wrapper {...props} />,
          'data-testid': 'wrapped',
        });
      }

      render(<Test />);
      expect(instanceFromRef!.tagName).to.equal(Element.toUpperCase());
      expect(instanceFromRef!).to.have.attribute('data-testid', 'wrapped');
    });
  });
}
