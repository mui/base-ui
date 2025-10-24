import * as React from 'react';
import { Calendar } from '@base-ui-components/react/calendar';
import { createTemporalRenderer, describeConformance } from '#test-utils';

describe('<Calendar.DayGridHeader />', () => {
  const { render } = createTemporalRenderer();

  describeConformance(<Calendar.DayGridHeader />, () => ({
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
