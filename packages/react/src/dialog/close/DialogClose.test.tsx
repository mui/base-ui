import * as React from 'react';
import { Dialog } from '@base-ui-components/react/dialog';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Dialog.Close />', () => {
  const { render } = createRenderer();

  describeConformance(<Dialog.Close />, () => ({
    refInstanceof: window.HTMLButtonElement,
    render: (node) => {
      return render(
        <Dialog.Root open modal={false} animated={false}>
          <Dialog.Popup>{node}</Dialog.Popup>
        </Dialog.Root>,
      );
    },
  }));
});
