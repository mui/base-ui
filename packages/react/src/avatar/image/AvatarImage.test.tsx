import * as React from 'react';
import { Avatar } from '@base-ui-components/react/avatar';
import { describeConformance, createRenderer } from '#test-utils';

describe('<Avatar.Image />', () => {
  const { render } = createRenderer();

  describeConformance(<Avatar.Image />, () => ({
    render: (node) => {
      return render(
        <Avatar.Root>
          {node}
        </Avatar.Root>
      )
    },
    refInstanceof: window.HTMLSpanElement,
  }));
});
