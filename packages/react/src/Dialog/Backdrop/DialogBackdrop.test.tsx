import * as React from 'react';
import { expect } from 'chai';
import { Dialog } from '@base-ui-components/react/Dialog';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Dialog.Backdrop />', () => {
  const { render } = createRenderer();

  describeConformance(<Dialog.Backdrop />, () => ({
    refInstanceof: window.HTMLDivElement,
    render: (node) => {
      return render(
        <Dialog.Root open modal={false} animated={false}>
          {node}
        </Dialog.Root>,
      );
    },
  }));

  it('has role="presentation"', async () => {
    const { getByTestId } = await render(
      <Dialog.Root open animated={false}>
        <Dialog.Backdrop data-testid="backdrop" />
      </Dialog.Root>,
    );

    expect(getByTestId('backdrop')).to.have.attribute('role', 'presentation');
  });
});
