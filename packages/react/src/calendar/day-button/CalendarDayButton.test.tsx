import * as React from 'react';
import { Calendar } from '@base-ui-components/react/calendar';
import { createTemporalRenderer, describeConformance } from '#test-utils';

describe('<Calendar.DayButton />', () => {
  const { render, adapter } = createTemporalRenderer();

  const date = adapter.now('default');
  const startOfWeek = adapter.startOfWeek(date);

  describeConformance(<Calendar.DayButton />, () => ({
    refInstanceof: window.HTMLButtonElement,
    render(node) {
      return render(
        <Calendar.Root>
          <Calendar.DayGrid>
            <Calendar.DayGridBody>
              <Calendar.DayGridRow value={startOfWeek}>
                <Calendar.DayGridCell value={date}>{node}</Calendar.DayGridCell>
              </Calendar.DayGridRow>
            </Calendar.DayGridBody>
          </Calendar.DayGrid>
        </Calendar.Root>,
      );
    },
  }));
});
