import * as React from 'react';
import { expect } from 'chai';
import { flushMicrotasks, randomStringValue } from '@mui/internal-test-utils';
import { throwMissingPropError } from './utils';
import type {
  ConformantComponentProps,
  BaseUiConformanceTestsOptions,
} from '../describeConformance';

export function testPropForwarding(
  element: React.ReactElement<ConformantComponentProps>,
  getOptions: () => BaseUiConformanceTestsOptions,
) {
  const { render, testRenderPropWith: Element = 'div' } = getOptions();

  if (!render) {
    throwMissingPropError('render');
  }

  describe('prop forwarding', () => {
    it('forwards custom props to the default root element', async () => {
      const otherProps = {
        lang: 'fr',
        'data-foobar': randomStringValue(),
      };

      const { getByTestId } = await render(
        React.cloneElement(element, { 'data-testid': 'root', ...otherProps }),
      );

      await flushMicrotasks();

      const customRoot = getByTestId('root');
      expect(customRoot).to.have.attribute('lang', otherProps.lang);
      expect(customRoot).to.have.attribute('data-foobar', otherProps['data-foobar']);
    });

    it('forwards custom props to the customized root element', async () => {
      const otherProps = {
        lang: 'fr',
        'data-foobar': randomStringValue(),
      };

      const { getByTestId } = await render(
        React.cloneElement(element, {
          render: (props: any) => <Element {...props} data-testid="custom-root" />,
          ...otherProps,
        }),
      );

      await flushMicrotasks();

      const customRoot = getByTestId('custom-root');
      expect(customRoot).to.have.attribute('lang', otherProps.lang);
      expect(customRoot).to.have.attribute('data-foobar', otherProps['data-foobar']);
    });
  });
}
