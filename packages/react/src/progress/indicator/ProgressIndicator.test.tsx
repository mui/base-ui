import * as React from 'react';
import { expect } from 'chai';
import { Progress } from '@base-ui-components/react/progress';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';

describe('<Progress.Indicator />', () => {
  const { render } = createRenderer();

  describeConformance(<Progress.Indicator />, () => ({
    render: (node) => {
      return render(<Progress.Root value={40}>{node}</Progress.Root>);
    },
    refInstanceof: window.HTMLDivElement,
  }));

  describe.skipIf(isJSDOM)('internal styles', () => {
    it('determinate', async () => {
      const { getByTestId } = await render(
        <Progress.Root value={33}>
          <Progress.Track>
            <Progress.Indicator data-testid="indicator" render={<span />} />
          </Progress.Track>
        </Progress.Root>,
      );

      const indicator = getByTestId('indicator');

      expect(indicator).toHaveComputedStyle({
        insetInlineStart: '0px',
        width: '33%',
      });
    });

    it('sets zero width when value is 0', async () => {
      const { getByTestId } = await render(
        <Progress.Root value={0}>
          <Progress.Track>
            <Progress.Indicator data-testid="indicator" />
          </Progress.Track>
        </Progress.Root>,
      );

      const indicator = getByTestId('indicator');

      expect(indicator).toHaveComputedStyle({
        insetInlineStart: '0px',
        width: '0px',
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
