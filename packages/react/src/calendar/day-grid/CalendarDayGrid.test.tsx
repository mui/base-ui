import * as React from 'react';
import { Calendar } from '@base-ui-components/react/calendar';
import { createTemporalRenderer, describeConformance } from '#test-utils';

describe('<Calendar.DayGrid />', () => {
  const { render } = createTemporalRenderer();

  describeConformance(<Calendar.DayGrid />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(<Calendar.Root>{node}</Calendar.Root>);
    },
  }));
});
