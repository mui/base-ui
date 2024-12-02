import * as React from 'react';
import { Tooltip } from '@base-ui-components/react/tooltip';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Tooltip.Portal />', () => {
  const { render } = createRenderer();

  describeConformance(<Tooltip.Portal />, () => ({
    refInstanceof: null,
    render(node) {
      return render(
        <Tooltip.Root open animated={false}>
          {node}
        </Tooltip.Root>,
      );
    },
  }));
});
