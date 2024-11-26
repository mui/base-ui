import * as React from 'react';
import { createRenderer } from '@mui/internal-test-utils';
import { Collapsible } from '@base-ui-components/react/collapsible';
import { describeConformance } from '../../../test/describeConformance';
import { CollapsibleRootContext } from '../root/CollapsibleRootContext';

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
  state: {
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
