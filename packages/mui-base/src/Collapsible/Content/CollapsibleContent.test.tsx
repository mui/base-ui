import * as React from 'react';
import { createRenderer } from '@mui/internal-test-utils';
import { Collapsible } from '@base_ui/react/Collapsible';
import { CollapsibleRootContext } from '../Root/CollapsibleRootContext';
import { describeConformance } from '../../../test/describeConformance';

const contextValue: CollapsibleRootContext = {
  animated: false,
  contentId: 'ContentId',
  disabled: false,
  mounted: true,
  open: true,
  setContentId() {},
  setMounted() {},
  setOpen() {},
  transitionStatus: undefined,
  ownerState: {
    open: true,
    disabled: false,
    transitionStatus: undefined,
  },
};

describe('<Collapsible.Content />', () => {
  const { render } = createRenderer();

  describeConformance(<Collapsible.Content />, () => ({
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
