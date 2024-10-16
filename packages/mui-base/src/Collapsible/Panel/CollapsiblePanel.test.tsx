import * as React from 'react';
import { createRenderer } from '@mui/internal-test-utils';
import { Collapsible } from '@base_ui/react/Collapsible';
import { CollapsibleRootContext } from '../Root/CollapsibleRootContext';
import { describeConformance } from '../../../test/describeConformance';

const contextValue: CollapsibleRootContext = {
  animated: false,
  panelId: 'PanelId',
  disabled: false,
  mounted: true,
  open: true,
  setPanelId() {},
  setMounted() {},
  setOpen() {},
  transitionStatus: undefined,
  ownerState: {
    open: true,
    disabled: false,
    transitionStatus: undefined,
  },
};

describe('<Collapsible.Panel />', () => {
  const { render } = createRenderer();

  describeConformance(<Collapsible.Panel />, () => ({
    inheritComponent: 'div',
    render: (node) => {
      const { container, ...other } = render(
        <CollapsibleRootContext.Provider value={contextValue}>
          {node}
        </CollapsibleRootContext.Provider>,
      );

      return { container, ...other };
    },
    refInstanceof: window.HTMLDivElement,
  }));
});
