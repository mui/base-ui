import * as React from 'react';
import { Progress } from '@base-ui-components/react/progress';
import { createRenderer, describeConformance } from '#test-utils';
import { ProgressRootContext } from '../root/ProgressRootContext';

const contextValue: ProgressRootContext = {
  max: 100,
  min: 0,
  value: 30,
  formattedValue: '30',
  status: 'progressing',
  state: {
    max: 100,
    min: 0,
    status: 'progressing',
  },
};

describe('<Progress.Track />', () => {
  const { render } = createRenderer();

  describeConformance(<Progress.Track />, () => ({
    render: (node) => {
      return render(
        <ProgressRootContext.Provider value={contextValue}>{node}</ProgressRootContext.Provider>,
      );
    },
    refInstanceof: window.HTMLDivElement,
  }));
});
