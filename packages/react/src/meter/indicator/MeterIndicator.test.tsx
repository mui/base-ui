import * as React from 'react';
import { expect } from 'chai';
import { Meter } from '@base-ui-components/react/meter';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';
import { MeterRootContext } from '../root/MeterRootContext';

const contextValue: MeterRootContext = {
  max: 100,
  min: 0,
  value: 30,
  percentageValue: 30,
  state: {
    max: 100,
    min: 0,
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
    refInstanceof: window.HTMLDivElement,
  }));

  describe.skipIf(isJSDOM)('internal styles', () => {
    it('sets positioning styles', async () => {
      const { getByTestId } = await render(
        <Meter.Root value={33}>
          <Meter.Track>
            <Meter.Indicator data-testid="indicator" render={<span />} />
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
