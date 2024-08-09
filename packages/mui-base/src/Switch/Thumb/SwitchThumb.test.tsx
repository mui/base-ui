import * as React from 'react';
import * as Switch from '@base_ui/react/Switch';
import { createRenderer, describeConformance } from '#test-utils';
import { SwitchContext } from '../Root/SwitchContext';

const testContext = {
  checked: false,
  disabled: false,
  readOnly: false,
  required: false,
  dirty: false,
  touched: false,
  valid: null,
};

describe('<Switch.Thumb />', () => {
  const { render } = createRenderer();

  describeConformance(<Switch.Thumb />, () => ({
    refInstanceof: window.HTMLSpanElement,
    render: (node) => {
      return render(<SwitchContext.Provider value={testContext}>{node}</SwitchContext.Provider>);
    },
  }));
});
