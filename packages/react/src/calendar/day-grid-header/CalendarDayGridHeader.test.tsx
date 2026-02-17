import * as React from 'react';
import { Calendar } from '@base-ui/react/calendar';
import { createTemporalRenderer, describeConformance } from '#test-utils';

describe('<Calendar.DayGridHeader />', () => {
  const { render } = createTemporalRenderer();

  describeConformance(<Calendar.DayGridHeader />, () => ({
    refInstanceof: window.HTMLTableSectionElement,
    testRenderPropWith: 'thead',
    wrappingAllowed: false,
    render(node) {
      return render(
        <Calendar.Root>
          <Calendar.DayGrid>{node}</Calendar.DayGrid>
        </Calendar.Root>,
      );
    },
  }));
});
