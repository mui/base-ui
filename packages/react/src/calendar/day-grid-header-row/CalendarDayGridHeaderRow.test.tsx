import * as React from 'react';
import { Calendar } from '@base-ui/react/calendar';
import { createTemporalRenderer, describeConformance } from '#test-utils';

describe('<Calendar.DayGridHeaderRow />', () => {
  const { render } = createTemporalRenderer();

  describeConformance(<Calendar.DayGridHeaderRow />, () => ({
    refInstanceof: window.HTMLTableRowElement,
    testRenderPropWith: 'tr',
    wrappingAllowed: false,
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
