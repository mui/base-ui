import * as React from 'react';
// import { expect } from 'chai';
// import { spy } from 'sinon';
import * as Accordion from '@base_ui/react/Accordion';
import { describeConformance, createRenderer } from '#test-utils';

describe('<Accordion.Root />', () => {
  const { render } = createRenderer();

  describeConformance(<Accordion.Root />, () => ({
    inheritComponent: 'div',
    render,
    refInstanceof: window.HTMLDivElement,
  }));
});
