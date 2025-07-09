import * as React from 'react';
import { expect } from 'vitest';
import { Dialog } from '@base-ui-components/react/dialog';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Dialog.Backdrop />', () => {
  const { render } = createRenderer();

  describeConformance(<Dialog.Backdrop />, () => ({
    refInstanceof: window.HTMLDivElement,
    render: (node) => {
      return render(
        <Dialog.Root open modal={false}>
          {node}
        </Dialog.Root>,
      );
    },
  }));

  it('has role="presentation"', async () => {
    const { getByTestId } = await render(
      <Dialog.Root open>
        <Dialog.Backdrop data-testid="backdrop" />
      </Dialog.Root>,
    );

    expect(getByTestId('backdrop')).to.have.attribute('role', 'presentation');
  });
});
