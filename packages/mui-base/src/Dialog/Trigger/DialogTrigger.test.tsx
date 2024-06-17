import * as React from 'react';
import { createRenderer } from '@mui/internal-test-utils';
import * as Dialog from '@base_ui/react/Dialog';
import { describeConformance } from '../../../test/describeConformance';

describe('<Dialog.Trigger />', () => {
  const { render } = createRenderer();

  describeConformance(<Dialog.Trigger />, () => ({
    refInstanceof: window.HTMLButtonElement,
    render: (node) => {
      return render(
        <Dialog.Root open modal={false}>
          {node}
        </Dialog.Root>,
      );
    },
    skip: ['reactTestRenderer'],
  }));
});
