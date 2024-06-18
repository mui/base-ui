import * as React from 'react';
import { expect } from 'chai';
import { type BaseUiConformanceTestsOptions } from '../describeConformance';
import { throwMissingPropError } from './utils';

export function testClassName(
  element: React.ReactElement,
  getOptions: () => BaseUiConformanceTestsOptions,
) {
  describe('prop: className', () => {
    const { render } = getOptions();

    if (!render) {
      throwMissingPropError('render');
    }

    it('should apply the className when passed as a string', async () => {
      await render(React.cloneElement(element, { className: 'test-class' }));
      expect(document.querySelector('.test-class')).not.to.equal(null);
    });
  });
}
