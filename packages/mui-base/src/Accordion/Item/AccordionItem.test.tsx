import * as React from 'react';
import { Accordion } from '@base_ui/react/Accordion';
import { describeConformance, createRenderer } from '#test-utils';
import { NOOP } from '../../utils/noop';
import { AccordionRootContext } from '../Root/AccordionRootContext';

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

describe('<Accordion.Item />', () => {
  const { render } = createRenderer();

  describeConformance(<Accordion.Item />, () => ({
    render: (node) =>
      render(
        <AccordionRootContext.Provider value={accordionRootContextValue}>
          {node}
        </AccordionRootContext.Provider>,
      ),
    refInstanceof: window.HTMLDivElement,
  }));
});
