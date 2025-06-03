import * as React from 'react';
import { Calendar } from '@base-ui-components/react/calendar';
import { createTemporalRenderer, describeConformance } from '#test-utils';

describe('<Calendar.DayGridRow />', () => {
  const { render, adapter } = createTemporalRenderer();

  const date = adapter.now('default');
  const startOfWeek = adapter.startOfWeek(date);

  describeConformance(<Calendar.DayGridRow value={startOfWeek} />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <Calendar.Root>
          <Calendar.DayGrid>
            <Calendar.DayGridBody>{node}</Calendar.DayGridBody>
          </Calendar.DayGrid>
        </Calendar.Root>,
      );
    },
  }));
});
