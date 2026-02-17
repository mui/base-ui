import * as React from 'react';
import { Calendar } from '@base-ui/react/calendar';
import { createTemporalRenderer, describeConformance } from '#test-utils';

describe('<Calendar.DayGridCell />', () => {
  const { render, adapter } = createTemporalRenderer();

  const date = adapter.now('default');
  const startOfWeek = adapter.startOfWeek(date);

  describeConformance(<Calendar.DayGridCell value={date} />, () => ({
    refInstanceof: window.HTMLTableCellElement,
    testRenderPropWith: 'td',
    wrappingAllowed: false,
    render(node) {
      return render(
        <Calendar.Root>
          <Calendar.DayGrid>
            <Calendar.DayGridBody>
              <Calendar.DayGridRow value={startOfWeek}>{node}</Calendar.DayGridRow>
            </Calendar.DayGridBody>
          </Calendar.DayGrid>
        </Calendar.Root>,
      );
    },
  }));
});
