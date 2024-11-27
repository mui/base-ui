import * as React from 'react';
import { expect } from 'chai';
import { Meter } from '@base-ui-components/react/meter';
import { createRenderer, describeConformance } from '#test-utils';
import { MeterRootContext } from '../root/MeterRootContext';

const isJSDOM = /jsdom/.test(window.navigator.userAgent);

const contextValue: MeterRootContext = {
  max: 100,
  min: 0,
  value: 30,
  percentageValue: 30,
  segment: 'low',
  isOptimal: false,
  state: {
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
    it('sets positioning styles', async function test(t = {}) {
      if (isJSDOM) {
        // @ts-expect-error to support mocha and vitest
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        this?.skip?.() || t?.skip();
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
