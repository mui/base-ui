import * as React from 'react';
import * as Select from '@base_ui/react/Select';
import { createRenderer, describeConformance } from '#test-utils';
import { SelectItemContext } from '../Item/SelectItemContext';

const selectItemContextValue = {
  open: true,
  selected: true,
};

describe('<Select.ItemIndicator />', () => {
  const { render } = createRenderer();

  describeConformance(<Select.ItemIndicator />, () => ({
    refInstanceof: window.HTMLSpanElement,
    render(node) {
      return render(
        <Select.Root open animated={false}>
          <Select.Positioner>
            <SelectItemContext.Provider value={selectItemContextValue}>
              {node}
            </SelectItemContext.Provider>
          </Select.Positioner>
        </Select.Root>,
      );
    },
  }));
});
