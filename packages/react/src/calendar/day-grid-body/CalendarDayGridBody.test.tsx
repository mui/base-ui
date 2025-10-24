import * as React from 'react';
import { Calendar } from '@base-ui-components/react/calendar';
import { createTemporalRenderer, describeConformance } from '#test-utils';

describe('<Calendar.DayGridBody />', () => {
  const { render } = createTemporalRenderer();

  describeConformance(<Calendar.DayGridBody />, () => ({
    refInstanceof: window.HTMLTableSectionElement,
    render(node) {
      return render(
        <Calendar.Root>
          <Calendar.DayGrid>{node}</Calendar.DayGrid>
        </Calendar.Root>,
      );
    },
  }));
});
