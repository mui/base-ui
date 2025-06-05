import * as React from 'react';
import { Calendar } from '@base-ui-components/react/calendar';
import { createTemporalRenderer, describeConformance } from '#test-utils';

describe('<Calendar.SetMonth />', () => {
  const { render, adapter } = createTemporalRenderer();

  describeConformance(<Calendar.SetMonth target={adapter.now('default')} />, () => ({
    refInstanceof: window.HTMLButtonElement,
    render(node) {
      return render(<Calendar.Root>{node}</Calendar.Root>);
    },
  }));
});
