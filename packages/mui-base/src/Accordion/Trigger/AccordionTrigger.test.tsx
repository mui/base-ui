import * as React from 'react';
// import { expect } from 'chai';
// import { spy } from 'sinon';
import * as Accordion from '@base_ui/react/Accordion';
import * as Collapsible from '@base_ui/react/Collapsible';
import { describeConformance, createRenderer } from '#test-utils';

const { AccordionRootContext, AccordionSectionContext } = Accordion;

const { CollapsibleContext } = Collapsible;

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

const accordionSectionContextValue: Accordion.Section.Context = {
  open: true,
  ownerState: {
    value: [0],
    disabled: false,
    index: 0,
    open: true,
    orientation: 'vertical',
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
    render: (node) =>
      render(
        <AccordionRootContext.Provider value={accordionRootContextValue}>
          <CollapsibleContext.Provider value={collapsibleContextValue}>
            <AccordionSectionContext.Provider value={accordionSectionContextValue}>
              {node}
            </AccordionSectionContext.Provider>
          </CollapsibleContext.Provider>
        </AccordionRootContext.Provider>,
      ),
    refInstanceof: window.HTMLButtonElement,
  }));
});
