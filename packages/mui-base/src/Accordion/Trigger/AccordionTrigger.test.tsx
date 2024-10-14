import * as React from 'react';
import { Accordion } from '@base_ui/react/Accordion';
import { describeConformance, createRenderer } from '#test-utils';
import { NOOP } from '../../utils/noop';
import { CollapsibleRootContext } from '../../Collapsible/Root/CollapsibleRootContext';
import { AccordionRootContext } from '../Root/AccordionRootContext';
import { AccordionItemContext } from '../Item/AccordionItemContext';

const accordionRootContextValue: Accordion.Root.Context = {
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

describe('<Accordion.Trigger />', () => {
  const { render } = createRenderer();

  describeConformance(<Accordion.Trigger />, () => ({
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
    refInstanceof: window.HTMLButtonElement,
  }));
});
