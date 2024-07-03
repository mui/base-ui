import * as React from 'react';
import { expect } from 'chai';
import * as AlertDialog from '@base_ui/react/AlertDialog';
import { createRenderer, describeConformance } from '../../../test';

describe('<AlertDialog.Popup />', () => {
  const { render } = createRenderer();

  describeConformance(<AlertDialog.Popup />, () => ({
    refInstanceof: window.HTMLDivElement,
    render: (node) => {
      return render(
        <AlertDialog.Root open animated={false}>
          <AlertDialog.Backdrop />
          {node}
        </AlertDialog.Root>,
      );
    },
  }));

  it('should have role="alertdialog"', async () => {
    const { getByTestId } = await render(
      <AlertDialog.Root open animated={false}>
        <AlertDialog.Backdrop />
        <AlertDialog.Popup data-testid="test-alert-dialog" />
      </AlertDialog.Root>,
    );

    const dialog = getByTestId('test-alert-dialog');
    expect(dialog).to.have.attribute('role', 'alertdialog');
  });
});
