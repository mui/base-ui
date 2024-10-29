import * as React from 'react';
import { expect } from 'chai';
import { Progress } from '@base_ui/react/Progress';
import { createRenderer, describeConformance } from '#test-utils';
import { ProgressRootContext } from '../Root/ProgressRootContext';

const contextValue: ProgressRootContext = {
  direction: 'ltr',
  max: 100,
  min: 0,
  value: 30,
  state: 'progressing',
  ownerState: {
    direction: 'ltr',
    max: 100,
    min: 0,
    status: 'progressing',
  },
};

describe('<Progress.Indicator />', () => {
  const { render } = createRenderer();

  describeConformance(<Progress.Indicator />, () => ({
    render: (node) => {
      return render(
        <ProgressRootContext.Provider value={contextValue}>{node}</ProgressRootContext.Provider>,
      );
    },
    refInstanceof: window.HTMLSpanElement,
  }));

  describe('internal styles', () => {
    it('determinate', async function test(t = {}) {
      if (/jsdom/.test(window.navigator.userAgent)) {
        // @ts-expect-error to support mocha and vitest
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        this?.skip?.() || t?.skip();
      }

      const { getByTestId } = await render(
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

    it('indeterminate', async function test(t = {}) {
      if (/jsdom/.test(window.navigator.userAgent)) {
        // @ts-expect-error to support mocha and vitest
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        this?.skip?.() || t?.skip();
      }

      const { getByTestId } = await render(
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
