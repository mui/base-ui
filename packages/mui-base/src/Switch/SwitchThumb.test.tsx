import * as React from 'react';
import { createRenderer } from '@mui/internal-test-utils';
import * as Switch from '@base_ui/react/Switch';
import { describeConformance } from '../../test/describeConformance';
import { SwitchContext } from './SwitchContext';

const testContext = {
  checked: false,
  disabled: false,
  readOnly: false,
  required: false,
};

describe('<Switch.Thumb />', () => {
  const { render } = createRenderer();

  describeConformance(<Switch.Thumb />, () => ({
    inheritComponent: 'span',
    refInstanceof: window.HTMLSpanElement,
    render: (node) => {
      return render(<SwitchContext.Provider value={testContext}>{node}</SwitchContext.Provider>);
    },
    skip: ['reactTestRenderer'],
  }));
});
