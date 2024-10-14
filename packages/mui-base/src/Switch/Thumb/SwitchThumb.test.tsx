import * as React from 'react';
import { Switch } from '@base_ui/react/Switch';
import { createRenderer, describeConformance } from '#test-utils';
import { SwitchRootContext } from '../Root/SwitchRootContext';

const testContext: SwitchRootContext = {
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
      return render(
        <SwitchRootContext.Provider value={testContext}>{node}</SwitchRootContext.Provider>,
      );
    },
  }));
});
