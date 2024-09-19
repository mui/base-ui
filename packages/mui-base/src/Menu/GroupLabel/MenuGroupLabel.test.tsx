import * as React from 'react';
import * as Menu from '@base_ui/react/Menu';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Menu.GroupLabel />', () => {
  const { render } = createRenderer();

  describeConformance(<Menu.GroupLabel />, () => ({
    render,
    refInstanceof: window.HTMLDivElement,
  }));
});
