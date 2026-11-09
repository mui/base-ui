import * as React from 'react';
import { expect, describe, it } from 'vitest';
import { screen } from '@mui/internal-test-utils';
import type {
  ConformantComponentProps,
  BaseUiConformanceTestsOptions,
} from '../describeConformance';
import { throwMissingPropError } from './utils';

export function testClassName(
  element: React.ReactElement<ConformantComponentProps>,
  getOptions: () => BaseUiConformanceTestsOptions,
) {
  describe('prop: className', () => {
    const { render } = getOptions();

    if (!render) {
      throwMissingPropError('render');
    }

    it('should apply the className to the root element when passed as a string', async () => {
      await render(React.cloneElement(element, { className: 'test-class', 'data-testid': 'root' }));
      expect(screen.getByTestId('root')).toHaveClass('test-class');
    });
  });
}
