import * as React from 'react';
import { Calendar } from '@base-ui-components/react/calendar';
import { createTemporalRenderer, describeConformance } from '#test-utils';

describe('<Calendar.SetVisibleMonth />', () => {
  const { render } = createTemporalRenderer();

  describeConformance(<Calendar.SetVisibleMonth target="next" />, () => ({
    refInstanceof: window.HTMLButtonElement,
    render(node) {
      return render(<Calendar.Root>{node}</Calendar.Root>);
    },
  }));
});
