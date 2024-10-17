import * as React from 'react';
import { createRenderer } from '@mui/internal-test-utils';
import { Collapsible } from '@base_ui/react/Collapsible';
import { describeConformance } from '../../../test/describeConformance';
import { CollapsibleRootContext } from '../Root/CollapsibleRootContext';

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

describe('<Collapsible.Trigger />', () => {
  const { render } = createRenderer();

  describeConformance(<Collapsible.Trigger />, () => ({
    inheritComponent: 'button',
    render: (node) => {
      const { container, ...other } = render(
        <CollapsibleRootContext.Provider value={contextValue}>
          {node}
        </CollapsibleRootContext.Provider>,
      );

      return { container, ...other };
    },
    refInstanceof: window.HTMLButtonElement,
  }));
});
