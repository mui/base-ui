import * as React from 'react';
import { expect } from 'chai';
import { Meter } from '@base-ui-components/react/meter';
import { createRenderer, describeConformance } from '#test-utils';
import { MeterRootContext } from '../root/MeterRootContext';

const contextValue: MeterRootContext = {
  direction: 'ltr',
  max: 100,
  min: 0,
  value: 30,
  percentageValue: 30,
  segment: 'low',
  isOptimal: false,
  state: {
    direction: 'ltr',
    max: 100,
    min: 0,
    segment: 'low',
    isOptimal: false,
  },
};

describe('<Meter.Indicator />', () => {
  const { render } = createRenderer();

  describeConformance(<Meter.Indicator />, () => ({
    render: (node) => {
      return render(
        <MeterRootContext.Provider value={contextValue}>{node}</MeterRootContext.Provider>,
      );
    },
    refInstanceof: window.HTMLSpanElement,
  }));

  describe('internal styles', () => {
    it('sets positioning styles', async function test() {
      if (/jsdom/.test(window.navigator.userAgent)) {
        this.skip();
      }

      const { getByTestId } = await render(
        <Meter.Root value={33}>
          <Meter.Track>
            <Meter.Indicator data-testid="indicator" />
          </Meter.Track>
        </Meter.Root>,
      );

      const indicator = getByTestId('indicator');

      expect(indicator).toHaveComputedStyle({
        left: '0px',
        width: '33%',
      });
    });
  });
});
