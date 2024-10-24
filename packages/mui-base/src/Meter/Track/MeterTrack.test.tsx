import * as React from 'react';
import { Meter } from '@base_ui/react/Meter';
import { createRenderer, describeConformance } from '#test-utils';
import { MeterRootContext } from '../Root/MeterRootContext';

const contextValue: MeterRootContext = {
  direction: 'ltr',
  max: 100,
  min: 0,
  value: 30,
  percentageValue: 30,
  segment: 'low',
  isOptimal: false,
  ownerState: {
    direction: 'ltr',
    max: 100,
    min: 0,
    segment: 'low',
    isOptimal: false,
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
    refInstanceof: window.HTMLSpanElement,
  }));
});
