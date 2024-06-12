import * as React from 'react';
import { createMount, createRenderer } from '@mui/internal-test-utils';
import { OptionGroup, optionGroupClasses } from '@base_ui/react/legacy/OptionGroup';
import { describeConformanceUnstyled } from '../../../test/describeConformanceUnstyled';

describe('<OptionGroup />', () => {
  const mount = createMount();
  const { render } = createRenderer();

  describeConformanceUnstyled(<OptionGroup />, () => ({
    inheritComponent: 'li',
    render,
    mount,
    refInstanceof: window.HTMLLIElement,
    testComponentPropWith: 'span',
    slots: {
      root: {
        expectedClassName: optionGroupClasses.root,
      },
      label: {
        expectedClassName: optionGroupClasses.label,
      },
      list: {
        expectedClassName: optionGroupClasses.list,
      },
    },
    skip: [
      'componentProp',
      'ownerStatePropagation', // the component does not have its own state
    ],
  }));
});
