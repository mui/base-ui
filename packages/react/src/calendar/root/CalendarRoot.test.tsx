import * as React from 'react';
import { Calendar } from '@base-ui-components/react/calendar';
import { createTemporalRenderer, describeConformance } from '#test-utils';

describe('<Calendar.Root />', () => {
  const { render } = createTemporalRenderer();

  describeConformance(<Calendar.Root />, () => ({
    refInstanceof: window.HTMLDivElement,
    render,
  }));
});
