import * as React from 'react';
import { Accordion } from '@base-ui-components/react/accordion';
import { describeConformance, createRenderer } from '#test-utils';
import { NOOP } from '../../utils/noop';
import { CollapsibleRootContext } from '../../collapsible/root/CollapsibleRootContext';
import { AccordionRootContext } from '../root/AccordionRootContext';
import { AccordionItemContext } from '../item/AccordionItemContext';

const accordionRootContextValue: AccordionRootContext = {
  accordionItemRefs: { current: [] },
  animated: false,
  direction: 'ltr',
  disabled: false,
  handleValueChange: NOOP,
  hiddenUntilFound: false,
  keepMounted: false,
  orientation: 'vertical',
  state: {
    value: [0],
    disabled: false,
    orientation: 'vertical',
  },
  value: [0],
};

const accordionItemContextValue: AccordionItemContext = {
  open: true,
  state: {
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
  state: {
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
