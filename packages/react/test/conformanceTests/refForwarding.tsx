import * as React from 'react';
import { expect, describe, it } from 'vitest';
import type {
  ConformantComponentProps,
  BaseUiConformanceTestsOptions,
} from '../describeConformance';
import { throwMissingPropError } from './utils';

export function testRefForwarding(
  element: React.ReactElement<ConformantComponentProps>,
  getOptions: () => BaseUiConformanceTestsOptions,
) {
  describe('ref', () => {
    it('attaches the ref', async () => {
      const { render, refInstanceof } = getOptions();

      if (!render) {
        throwMissingPropError('render');
      }

      const ref = React.createRef<unknown>();
      await render(React.cloneElement(element, { ref }));

      expect(ref.current).toBeInstanceOf(refInstanceof);
    });
  });
}
