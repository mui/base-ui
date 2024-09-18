import * as React from 'react';
import * as Group from '@base_ui/react/Group';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Group.Label />', () => {
  const { render } = createRenderer();

  describeConformance(<Group.Label />, () => ({
    render,
    refInstanceof: window.HTMLDivElement,
  }));
});
