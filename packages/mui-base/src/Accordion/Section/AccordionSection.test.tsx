import * as React from 'react';
// import { expect } from 'chai';
// import { spy } from 'sinon';
import { createRenderer /* , act */ } from '@mui/internal-test-utils';
import * as Accordion from '@base_ui/react/Accordion';
import { describeConformance } from '../../../test/describeConformance';

const { AccordionRootContext } = Accordion;

const accordionRootContextValue: Accordion.Root.Context = {
  accordionSectionRefs: { current: [] },
  animated: false,
  disabled: false,
  handleOpenChange() {},
  ownerState: {
    value: [0],
    disabled: false,
  },
  value: [0],
};

describe('<Accordion.Section />', () => {
  const { render } = createRenderer();

  describeConformance(<Accordion.Section />, () => ({
    inheritComponent: 'div',
    render: (node) => {
      const { container, ...other } = render(
        <AccordionRootContext.Provider value={accordionRootContextValue}>
          {node}
        </AccordionRootContext.Provider>,
      );

      return { container, ...other };
    },
    refInstanceof: window.HTMLDivElement,
  }));
});
