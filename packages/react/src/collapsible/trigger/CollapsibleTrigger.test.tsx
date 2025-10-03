import * as React from 'react';
import { createRenderer } from '@mui/internal-test-utils';
import { Collapsible } from '@base-ui-components/react/collapsible';
import { describeConformance } from '../../../test/describeConformance';

describe('<Collapsible.Trigger />', () => {
  const { render } = createRenderer();

  describeConformance(<Collapsible.Trigger />, () => ({
    refInstanceof: window.HTMLButtonElement,
    testComponentPropWith: 'button',
    button: true,
    render: (node) => {
      const { container, ...other } = render(<Collapsible.Root>{node}</Collapsible.Root>);

      return { container, ...other };
    },
  }));
});
