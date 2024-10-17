import * as React from 'react';
import { Meter } from '@base-ui-components/react/meter';
import { createRenderer, describeConformance } from '#test-utils';
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

describe('<Meter.Track />', () => {
  const { render } = createRenderer();

  describeConformance(<Meter.Track />, () => ({
    render: (node) => {
      return render(
        <MeterRootContext.Provider value={contextValue}>{node}</MeterRootContext.Provider>,
      );
    },
    refInstanceof: window.HTMLDivElement,
  }));
});
