import * as React from 'react';
import { Progress } from '@base_ui/react/Progress';
import { createRenderer, describeConformance } from '#test-utils';
import { ProgressRootContext } from '../Root/ProgressRootContext';

const contextValue: ProgressRootContext = {
  direction: 'ltr',
  max: 100,
  min: 0,
  value: 30,
  state: 'progressing',
  ownerState: {
    direction: 'ltr',
    max: 100,
    min: 0,
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
    refInstanceof: window.HTMLSpanElement,
  }));
});
