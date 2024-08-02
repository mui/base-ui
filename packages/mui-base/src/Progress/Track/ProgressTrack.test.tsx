import * as React from 'react';
import { createRenderer } from '@mui/internal-test-utils';
import * as Progress from '@base_ui/react/Progress';
import { ProgressContext } from '@base_ui/react/Progress';
import { describeConformance } from '../../../test/describeConformance';
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
    inheritComponent: 'span',
    render: (node) => {
      const { container, ...other } = render(
        <ProgressContext.Provider value={contextValue}>{node}</ProgressContext.Provider>,
      );

      return { container, ...other };
    },
    refInstanceof: window.HTMLSpanElement,
  }));
});
