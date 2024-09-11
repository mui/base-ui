import * as React from 'react';
// import { expect } from 'chai';
// import { spy } from 'sinon';
import * as Accordion from '@base_ui/react/Accordion';
import { describeConformance, createRenderer } from '#test-utils';

const { AccordionRootContext } = Accordion;

const accordionRootContextValue: Accordion.Root.Context = {
  accordionSectionRefs: { current: [] },
  animated: false,
  direction: 'ltr',
  disabled: false,
  handleOpenChange() {},
  orientation: 'vertical',
  ownerState: {
    value: [0],
    disabled: false,
    orientation: 'vertical',
  },
  value: [0],
};

describe('<Accordion.Section />', () => {
  const { render } = createRenderer();

  describeConformance(<Accordion.Section />, () => ({
    inheritComponent: 'div',
    render: (node) =>
      render(
        <AccordionRootContext.Provider value={accordionRootContextValue}>
          {node}
        </AccordionRootContext.Provider>,
      ),
    refInstanceof: window.HTMLDivElement,
  }));
});
