import * as React from 'react';
import { expect } from 'vitest';
import { AlertDialog } from '@base-ui-components/react/alert-dialog';
import { createRenderer, describeConformance } from '#test-utils';

describe('<AlertDialog.Backdrop />', () => {
  const { render } = createRenderer();

  describeConformance(<AlertDialog.Backdrop />, () => ({
    refInstanceof: window.HTMLDivElement,
    render: (node) => {
      return render(<AlertDialog.Root open>{node}</AlertDialog.Root>);
    },
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
