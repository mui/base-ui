import { expect } from 'chai';
import * as React from 'react';
import { Meter } from '@base-ui-components/react/meter';
import { screen } from '@mui/internal-test-utils';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Meter.Root />', () => {
  const { render } = createRenderer();

  describeConformance(<Meter.Root value={50} />, () => ({
    render,
    refInstanceof: window.HTMLDivElement,
  }));

  describe('ARIA attributes', () => {
    it('sets the correct aria attributes', async () => {
      const { getByRole } = await render(
        <Meter.Root value={30}>
          <Meter.Label>Battery Level</Meter.Label>
          <Meter.Track>
            <Meter.Indicator />
          </Meter.Track>
        </Meter.Root>,
      );

      const meter = getByRole('meter');

      expect(meter).to.have.attribute('aria-valuenow', '0.3');
      expect(meter).to.have.attribute('aria-valuemin', '0');
      expect(meter).to.have.attribute('aria-valuemax', '100');
      expect(meter).to.have.attribute('aria-valuetext', '30%');
      expect(meter.getAttribute('aria-labelledby')).to.equal(
        screen.getByText('Battery Level').getAttribute('id'),
      );
    });

    it('should update aria-valuenow when value changes', async () => {
      const { getByRole, setProps } = await render(
        <Meter.Root value={50}>
          <Meter.Track>
            <Meter.Indicator />
          </Meter.Track>
        </Meter.Root>,
      );
      const meter = getByRole('meter');
      await setProps({ value: 77 });
      expect(meter).to.have.attribute('aria-valuenow', '0.77');
    });
  });

  describe('prop: format', () => {
    it('formats the value', async () => {
      const format: Intl.NumberFormatOptions = {
        style: 'currency',
        currency: 'USD',
      };
      function formatValue(v: number) {
        return new Intl.NumberFormat(undefined, format).format(v);
      }
      const { getByRole, getByTestId } = await render(
        <Meter.Root value={30} format={format}>
          <Meter.Value data-testid="value" />
          <Meter.Track>
            <Meter.Indicator />
          </Meter.Track>
        </Meter.Root>,
      );
      const value = getByTestId('value');
      const meter = getByRole('meter');
      expect(value).to.have.text(formatValue(30));
      expect(meter).to.have.attribute('aria-valuetext', formatValue(30));
    });
  });

  describe('prop: locale', () => {
    it('sets the locale when formatting the value', async () => {
      // In German locale, numbers use dot as thousands separator and comma as decimal separator
      const expectedValue = new Intl.NumberFormat('de-DE').format(86.49);
      const { getByTestId } = await render(
        <Meter.Root
          value={86.49}
          format={{
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }}
          locale="de-DE"
        >
          <Meter.Value data-testid="value" />
        </Meter.Root>,
      );

      expect(getByTestId('value')).to.have.text(expectedValue);
    });
  });
});
