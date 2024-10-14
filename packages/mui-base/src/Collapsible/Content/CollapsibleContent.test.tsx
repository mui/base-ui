import * as React from 'react';
import { createRenderer } from '@mui/internal-test-utils';
import { Collapsible } from '@base_ui/react/Collapsible';
import { CollapsibleContext } from '../Root/CollapsibleContext';
import { describeConformance } from '../../../test/describeConformance';

const contextValue: Collapsible.Root.Context = {
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
        <CollapsibleContext.Provider value={contextValue}>{node}</CollapsibleContext.Provider>,
      );

      return { container, ...other };
    },
    refInstanceof: window.HTMLDivElement,
  }));
});
