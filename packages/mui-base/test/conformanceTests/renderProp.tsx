import * as React from 'react';
import { expect } from 'chai';
import { type BaseUiConformanceTestsOptions } from '../describeConformance';
import { throwMissingPropError } from './utils';
import { randomStringValue } from '@mui/internal-test-utils';

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
          <Element ref={forwardedRef} {...props} data-testid="wrapped" />
        </div>
      );
    },
  );

  describe('prop: render', () => {
    it('renders a customized root element', async () => {
      const testValue = randomStringValue();
      const { queryByTestId } = await render(
        React.cloneElement(element, {
          render: (props: {}) => <Wrapper {...props} data-test-value={testValue} />,
        }),
      );

      expect(queryByTestId('wrapper')).not.to.equal(null);
      expect(queryByTestId('wrapped')).not.to.equal(null);
      expect(queryByTestId('wrapped')).to.have.attribute('data-test-value', testValue);
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
