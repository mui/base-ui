import * as React from 'react';
import { expect } from 'chai';
import * as AlertDialog from '@base_ui/react/AlertDialog';
import { createRenderer, describeConformance } from '../../../test';

describe('<AlertDialog.Backdrop />', () => {
  const { render } = createRenderer();

  describeConformance(<AlertDialog.Backdrop />, () => ({
    refInstanceof: window.HTMLDivElement,
    render: (node) => {
      return render(
        <AlertDialog.Root open modal={false}>
          {node}
        </AlertDialog.Root>,
      );
    },
    skip: ['reactTestRenderer'],
  }));

  it('has role="presentation"', async () => {
    const { getByTestId } = await render(
      <AlertDialog.Root open>
        <AlertDialog.Backdrop data-testid="backdrop" />
      </AlertDialog.Root>,
    );

    expect(getByTestId('backdrop')).to.have.attribute('role', 'presentation');
  });
});
