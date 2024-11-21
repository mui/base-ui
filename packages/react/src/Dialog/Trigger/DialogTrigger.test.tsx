import * as React from 'react';
import { Dialog } from '@base-ui-components/react/Dialog';
import { createRenderer, describeConformance } from '#test-utils';

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
  }));
});
