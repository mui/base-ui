import * as React from 'react';
import { expect } from 'chai';
import { createRenderer } from '@mui/internal-test-utils';
import * as Progress from '@base_ui/react/Progress';
import { ProgressContext } from '@base_ui/react/Progress';
import { describeConformance } from '../../../test/describeConformance';
import type { ProgressContextValue } from '../Root/ProgressRoot.types';

const contextValue: ProgressContextValue = {
  direction: 'ltr',
  max: 100,
  min: 0,
  value: 30,
  state: 'progressing',
  ownerState: {
    direction: 'ltr',
    max: 100,
    min: 0,
  },
};

describe('<Progress.Indicator />', () => {
  const { render } = createRenderer();

  describeConformance(<Progress.Indicator />, () => ({
    inheritComponent: 'span',
    render: (node) => {
      const { container, ...other } = render(
        <ProgressContext.Provider value={contextValue}>{node}</ProgressContext.Provider>,
      );

      return { container, ...other };
    },
    refInstanceof: window.HTMLSpanElement,
  }));

  describe('internal styles', () => {
    it('determinate', function test() {
      if (/jsdom/.test(window.navigator.userAgent)) {
        this.skip();
      }

      const { getByTestId } = render(
        <Progress.Root value={33}>
          <Progress.Track>
            <Progress.Indicator data-testid="indicator" />
          </Progress.Track>
        </Progress.Root>,
      );

      const indicator = getByTestId('indicator');

      expect(indicator).toHaveComputedStyle({
        left: '0px',
        width: '33%',
      });
    });

    it('indeterminate', function test() {
      if (/jsdom/.test(window.navigator.userAgent)) {
        this.skip();
      }

      const { getByTestId } = render(
        <Progress.Root value={null}>
          <Progress.Track>
            <Progress.Indicator data-testid="indicator" />
          </Progress.Track>
        </Progress.Root>,
      );

      const indicator = getByTestId('indicator');

      expect(indicator).toHaveComputedStyle({});
    });
  });
});
