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
});
