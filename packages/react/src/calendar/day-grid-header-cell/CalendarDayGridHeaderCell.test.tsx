import * as React from 'react';
import { Calendar } from '@base-ui-components/react/calendar';
import { createTemporalRenderer, describeConformance } from '#test-utils';

describe('<Calendar.DayGridHeaderCell />', () => {
  const { render, adapter } = createTemporalRenderer();

  const date = adapter.now('default');

  describeConformance(<Calendar.DayGridHeaderCell value={date} />, () => ({
    refInstanceof: window.HTMLSpanElement,
    render(node) {
      return render(
        <Calendar.Root>
          <Calendar.DayGrid>
            <Calendar.DayGridHeader>{node}</Calendar.DayGridHeader>
          </Calendar.DayGrid>
        </Calendar.Root>,
      );
    },
  }));
});
