import * as React from 'react';
import * as Select from '@base_ui/react/Select';
import { createRenderer, describeConformance } from '#test-utils';
import { SelectOptionContext } from '../Option/SelectOptionContext';

const selectItemContextValue = {
  open: true,
  selected: true,
};

describe('<Select.ItemIndicator />', () => {
  const { render } = createRenderer();

  describeConformance(<Select.OptionIndicator />, () => ({
    refInstanceof: window.HTMLSpanElement,
    render(node) {
      return render(
        <Select.Root open animated={false}>
          <Select.Positioner>
            <SelectOptionContext.Provider value={selectItemContextValue}>
              {node}
            </SelectOptionContext.Provider>
          </Select.Positioner>
        </Select.Root>,
      );
    },
  }));
});
