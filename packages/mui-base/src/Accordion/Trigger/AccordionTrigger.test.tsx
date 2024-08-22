import * as React from 'react';
// import { expect } from 'chai';
// import { spy } from 'sinon';
import { createRenderer /* , act */ } from '@mui/internal-test-utils';
import * as Accordion from '@base_ui/react/Accordion';
import * as Collapsible from '@base_ui/react/Collapsible';
import { describeConformance } from '../../../test/describeConformance';

const { AccordionRootContext, AccordionSectionContext } = Accordion;

const { CollapsibleContext } = Collapsible;

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

const accordionSectionContextValue: Accordion.Section.Context = {
  open: true,
  ownerState: {
    value: [0],
    disabled: false,
    index: 0,
    open: true,
    transitionStatus: undefined,
  },
};

const collapsibleContextValue: Collapsible.Root.Context = {
  animated: false,
  contentId: ':content:',
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

describe('<Accordion.Trigger />', () => {
  const { render } = createRenderer();

  describeConformance(<Accordion.Trigger />, () => ({
    inheritComponent: 'button',
    render: (node) => {
      const { container, ...other } = render(
        <AccordionRootContext.Provider value={accordionRootContextValue}>
          <CollapsibleContext.Provider value={collapsibleContextValue}>
            <AccordionSectionContext.Provider value={accordionSectionContextValue}>
              {node}
            </AccordionSectionContext.Provider>
          </CollapsibleContext.Provider>
        </AccordionRootContext.Provider>,
      );

      return { container, ...other };
    },
    refInstanceof: window.HTMLButtonElement,
  }));
});
