import * as React from 'react';
import * as Progress from '@base_ui/react/Progress';
import { ProgressContext } from '@base_ui/react/Progress';
import { createRenderer, describeConformance } from '#test-utils';
import type { ProgressContextValue } from '../Root/ProgressRoot.types';

const contextValue: ProgressContextValue = {
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
        <ProgressContext.Provider value={contextValue}>{node}</ProgressContext.Provider>,
      );
    },
    refInstanceof: window.HTMLSpanElement,
  }));
});
