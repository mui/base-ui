import * as React from 'react';
import * as Accordion from '@base_ui/react/Accordion';
import * as Collapsible from '@base_ui/react/Collapsible';
import { describeConformance, createRenderer } from '#test-utils';
import { NOOP } from '../../utils/noop';
import { AccordionRootContext } from '../Root/AccordionRootContext';
import { AccordionItemContext } from '../Item/AccordionItemContext';

const { CollapsibleContext } = Collapsible;

const accordionRootContextValue: Accordion.Root.Context = {
  accordionItemRefs: { current: [] },
  animated: false,
  direction: 'ltr',
  disabled: false,
  handleOpenChange: NOOP,
  hiddenUntilFound: false,
  orientation: 'vertical',
  ownerState: {
    value: [0],
    disabled: false,
    orientation: 'vertical',
  },
  value: [0],
};

const accordionItemContextValue: Accordion.Item.Context = {
  open: true,
  ownerState: {
    value: [0],
    disabled: false,
    index: 0,
    open: true,
    orientation: 'vertical',
    transitionStatus: undefined,
  },
  setTriggerId: NOOP,
  triggerId: ':trigger:',
};

const collapsibleContextValue: Collapsible.Root.Context = {
  animated: false,
  contentId: ':content:',
  disabled: false,
  mounted: true,
  open: true,
  setContentId: NOOP,
  setMounted: NOOP,
  setOpen: NOOP,
  transitionStatus: undefined,
  ownerState: {
    open: true,
    disabled: false,
    transitionStatus: undefined,
  },
};

describe('<Accordion.Panel />', () => {
  const { render } = createRenderer();

  describeConformance(<Accordion.Panel />, () => ({
    render: (node) =>
      render(
        <AccordionRootContext.Provider value={accordionRootContextValue}>
          <CollapsibleContext.Provider value={collapsibleContextValue}>
            <AccordionItemContext.Provider value={accordionItemContextValue}>
              {node}
            </AccordionItemContext.Provider>
          </CollapsibleContext.Provider>
        </AccordionRootContext.Provider>,
      ),
    refInstanceof: window.HTMLDivElement,
  }));
});
