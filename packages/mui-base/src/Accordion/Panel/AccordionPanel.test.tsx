import * as React from 'react';
import { Accordion } from '@base_ui/react/Accordion';
import { describeConformance, createRenderer } from '#test-utils';
import { NOOP } from '../../utils/noop.js';
import { CollapsibleRootContext } from '../../Collapsible/Root/CollapsibleRootContext.js';
import { AccordionRootContext } from '../Root/AccordionRootContext.js';
import { AccordionItemContext } from '../Item/AccordionItemContext.js';

const accordionRootContextValue: AccordionRootContext = {
  accordionItemRefs: { current: [] },
  animated: false,
  direction: 'ltr',
  disabled: false,
  handleValueChange: NOOP,
  hiddenUntilFound: false,
  orientation: 'vertical',
  ownerState: {
    value: [0],
    disabled: false,
    orientation: 'vertical',
  },
  value: [0],
};

const accordionItemContextValue: AccordionItemContext = {
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

const collapsibleContextValue: CollapsibleRootContext = {
  animated: false,
  panelId: ':panel:',
  disabled: false,
  mounted: true,
  open: true,
  setPanelId: NOOP,
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
          <CollapsibleRootContext.Provider value={collapsibleContextValue}>
            <AccordionItemContext.Provider value={accordionItemContextValue}>
              {node}
            </AccordionItemContext.Provider>
          </CollapsibleRootContext.Provider>
        </AccordionRootContext.Provider>,
      ),
    refInstanceof: window.HTMLDivElement,
  }));
});
