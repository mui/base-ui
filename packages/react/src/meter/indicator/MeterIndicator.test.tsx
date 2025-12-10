import { screen } from '@mui/internal-test-utils';
import { expect } from 'chai';
import { Meter } from '@base-ui/react/meter';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';

describe('<Meter.Indicator />', () => {
  const { render } = createRenderer();

  describeConformance(<Meter.Indicator />, () => ({
    render: (node) => {
      return render(<Meter.Root value={30}>{node}</Meter.Root>);
    },
    refInstanceof: window.HTMLDivElement,
  }));

  describe.skipIf(isJSDOM)('internal styles', () => {
    it('sets positioning styles', async () => {
      await render(
        <Meter.Root value={33} style={{ width: '100px' }}>
          <Meter.Track>
            <Meter.Indicator data-testid="indicator" />
          </Meter.Track>
        </Meter.Root>,
      );

      const indicator = screen.getByTestId('indicator');

      expect(indicator).toHaveComputedStyle({
        left: '0px',
        width: '33px',
      });
    });

    it('sets zero width when value is 0', async () => {
      await render(
        <Meter.Root value={0} style={{ width: '100px' }}>
          <Meter.Track>
            <Meter.Indicator data-testid="indicator" />
          </Meter.Track>
        </Meter.Root>,
      );

      const indicator = screen.getByTestId('indicator');

      expect(indicator).toHaveComputedStyle({
        insetInlineStart: '0px',
        width: '0px',
      });
    });
  });
});
