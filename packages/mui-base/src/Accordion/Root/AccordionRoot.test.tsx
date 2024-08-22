import * as React from 'react';
// import { expect } from 'chai';
// import { spy } from 'sinon';
import { createRenderer /* , act */ } from '@mui/internal-test-utils';
import * as Accordion from '@base_ui/react/Accordion';
import { describeConformance } from '../../../test/describeConformance';

describe('<Accordion.Root />', () => {
  const { render } = createRenderer();

  describeConformance(<Accordion.Root />, () => ({
    inheritComponent: 'div',
    render,
    refInstanceof: window.HTMLDivElement,
  }));
});
