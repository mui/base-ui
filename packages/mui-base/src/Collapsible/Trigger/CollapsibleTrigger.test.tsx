import * as React from 'react';
import { createRenderer } from '@mui/internal-test-utils';
import * as Collapsible from '@base_ui/react/Collapsible';
import { CollapsibleContext } from '@base_ui/react/Collapsible';
import { describeConformance } from '../../../test/describeConformance';
import type { CollapsibleContextValue } from '../Root/CollapsibleRoot.types';

const contextValue: CollapsibleContextValue = {
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

describe('<Collapsible.Trigger />', () => {
  const { render } = createRenderer();

  describeConformance(<Collapsible.Trigger />, () => ({
    inheritComponent: 'button',
    render: (node) => {
      const { container, ...other } = render(
        <CollapsibleContext.Provider value={contextValue}>{node}</CollapsibleContext.Provider>,
      );

      return { container, ...other };
    },
    refInstanceof: window.HTMLButtonElement,
  }));
});
