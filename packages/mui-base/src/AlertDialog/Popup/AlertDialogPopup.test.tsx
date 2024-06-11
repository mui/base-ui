import * as React from 'react';
import { expect } from 'chai';
import { createRenderer } from '@mui/internal-test-utils';
import * as AlertDialog from '@base_ui/react/AlertDialog';
import { describeConformance } from '../../../test/describeConformance';

describe('<AlertDialog.Popup />', () => {
  const { render } = createRenderer();

  describeConformance(<AlertDialog.Popup animated={false} />, () => ({
    refInstanceof: window.HTMLDivElement,
    render: (node) => {
      return render(<AlertDialog.Root open>{node}</AlertDialog.Root>);
    },
    skip: ['reactTestRenderer'],
  }));

  it('should have role="alertdialog"', () => {
    const { getByTestId } = render(
      <AlertDialog.Root open>
        <AlertDialog.Popup data-testid="test-alert-dialog" animated={false} />
      </AlertDialog.Root>,
    );

    const dialog = getByTestId('test-alert-dialog');
    expect(dialog).to.have.attribute('role', 'alertdialog');
  });
});
