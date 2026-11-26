import { describe } from 'vitest';
import * as React from 'react';
import { Toggle } from '@base-ui/react/toggle';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Toggle />', () => {
  const { render } = createRenderer();

  describeConformance(<Toggle />, () => ({
    refInstanceof: window.HTMLButtonElement,
    testRenderPropWith: 'button',
    button: true,
    render,
  }));
});
