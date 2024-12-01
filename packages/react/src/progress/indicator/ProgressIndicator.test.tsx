import * as React from 'react';
import { expect } from 'chai';
import { Progress } from '@base-ui-components/react/progress';
import { describeSkipIf } from '@mui/internal-test-utils';
import { createRenderer, describeConformance } from '#test-utils';
import { ProgressRootContext } from '../root/ProgressRootContext';

const isJSDOM = /jsdom/.test(window.navigator.userAgent);

const contextValue: ProgressRootContext = {
  max: 100,
  min: 0,
  value: 30,
  status: 'progressing',
  state: {
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

  describeSkipIf(isJSDOM)('internal styles', () => {
    it('determinate', async () => {
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

    it('indeterminate', async () => {
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
