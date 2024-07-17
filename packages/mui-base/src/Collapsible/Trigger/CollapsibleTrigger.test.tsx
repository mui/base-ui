import * as React from 'react';
import { createRenderer } from '@mui/internal-test-utils';
import * as Collapsible from '@base_ui/react/Collapsible';
import { CollapsibleContext } from '@base_ui/react/Collapsible';
import { describeConformance } from '../../../test/describeConformance';
import type { CollapsibleContextValue } from '../Root/CollapsibleRoot.types';

const contextValue: CollapsibleContextValue = {
  contentId: 'ContentId',
  disabled: false,
  open: true,
  setContentId() {},
  setOpen() {},
  ownerState: {
    open: true,
    disabled: false,
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
