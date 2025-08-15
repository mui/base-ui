import * as React from 'react';
import { Button } from '@base-ui-components/react/button';
import { describeConformance, createRenderer } from '#test-utils';

describe('<Button />', () => {
  const { render } = createRenderer();

  describeConformance(<Button />, () => ({
    render: (node) => render(node),
    refInstanceof: window.HTMLButtonElement,
  }));
});
