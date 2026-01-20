import { screen } from '@mui/internal-test-utils';
import { expect } from 'chai';
import { spy } from 'sinon';
import { Meter } from '@base-ui/react/meter';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Meter.Value />', () => {
  const { render } = createRenderer();

  describeConformance(<Meter.Value />, () => ({
    render: (node) => {
      return render(<Meter.Root value={30}>{node}</Meter.Root>);
    },
    refInstanceof: window.HTMLSpanElement,
  }));

  describe('prop: children', () => {
    it('renders the value when children is not provided', async () => {
      await render(
        <Meter.Root value={30}>
          <Meter.Value data-testid="value" />
        </Meter.Root>,
      );

      const value = screen.getByTestId('value');
      expect(value).to.have.text((0.3).toLocaleString(undefined, { style: 'percent' }));
    });

    it('renders a formatted value when a format is provided', async () => {
      const format: Intl.NumberFormatOptions = {
        style: 'currency',
        currency: 'USD',
      };
      function formatValue(v: number) {
        return new Intl.NumberFormat(undefined, format).format(v);
      }

      await render(
        <Meter.Root value={30} format={format}>
          <Meter.Value data-testid="value" />
        </Meter.Root>,
      );

      const value = screen.getByTestId('value');
      expect(value).to.have.text(formatValue(30));
    });

    it('accepts a render function', async () => {
      const renderSpy = spy();
      const format: Intl.NumberFormatOptions = {
        style: 'currency',
        currency: 'USD',
      };
      function formatValue(v: number) {
        return new Intl.NumberFormat(undefined, format).format(v);
      }
      await render(
        <Meter.Root value={30} format={format}>
          <Meter.Value data-testid="value">{renderSpy}</Meter.Value>
        </Meter.Root>,
      );
      expect(renderSpy.lastCall.args[0]).to.deep.equal(formatValue(30));
      expect(renderSpy.lastCall.args[1]).to.deep.equal(30);
    });
  });
});
