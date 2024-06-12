import * as React from 'react';
import { expect } from 'chai';
import * as AlertDialog from '@base_ui/react/AlertDialog';
import { describeConformance, createRenderer } from '../../../test';

describe('<AlertDialog.Popup />', () => {
  const { render } = createRenderer();

  describeConformance(<AlertDialog.Popup animated={false} />, () => ({
    refInstanceof: window.HTMLDivElement,
    render: (node) => {
      return render(
        <AlertDialog.Root open>
          <AlertDialog.Backdrop />
          {node}
        </AlertDialog.Root>,
      );
    },
    skip: ['reactTestRenderer'],
  }));

  it('should have role="alertdialog"', async () => {
    const { getByTestId } = await render(
      <AlertDialog.Root open>
        <AlertDialog.Backdrop />
        <AlertDialog.Popup data-testid="test-alert-dialog" animated={false} />
      </AlertDialog.Root>,
    );

    const dialog = getByTestId('test-alert-dialog');
    expect(dialog).to.have.attribute('role', 'alertdialog');
  });
});
