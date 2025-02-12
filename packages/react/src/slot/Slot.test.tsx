import * as React from 'react';
import { expect } from 'chai';
import { Slot } from '@base-ui-components/react/slot';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Slot />', () => {
  const { render } = createRenderer();

  describeConformance(<Slot state={{}} />, () => ({
    render,
    refInstanceof: window.HTMLDivElement,
  }));
});
