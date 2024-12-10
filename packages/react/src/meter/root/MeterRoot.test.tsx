import { expect } from 'chai';
import * as React from 'react';
import { Meter } from '@base-ui-components/react/meter';
import { createRenderer, describeConformance } from '#test-utils';
import type { MeterRoot } from './MeterRoot';

function TestMeter(props: MeterRoot.Props) {
  return (
    <Meter.Root {...props}>
      <Meter.Track>
        <Meter.Indicator />
      </Meter.Track>
    </Meter.Root>
  );
}

describe('<Meter.Root />', () => {
  const { render } = createRenderer();

  describeConformance(<Meter.Root value={50} />, () => ({
    render,
    refInstanceof: window.HTMLDivElement,
  }));

  it('renders a meter', async () => {
    const { getByRole } = await render(
      <Meter.Root value={30}>
        <Meter.Track>
          <Meter.Indicator />
        </Meter.Track>
      </Meter.Root>,
    );

    expect(getByRole('meter')).to.have.attribute('aria-valuenow', '0.3');
  });

  describe('ARIA attributes', () => {
    it('sets the correct aria attributes', async () => {
      const { getByRole } = await render(
        <Meter.Root value={30}>
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
    });

    it('should update aria-valuenow when value changes', async () => {
      const { getByRole, setProps } = await render(<TestMeter value={50} />);
      const meter = getByRole('meter');
      setProps({ value: 77 });
      expect(meter).to.have.attribute('aria-valuenow', '0.77');
    });
  });
});
