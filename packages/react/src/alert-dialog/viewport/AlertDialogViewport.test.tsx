import * as React from 'react';
import { expect } from 'chai';
import { AlertDialog } from '@base-ui-components/react/alert-dialog';
import { createRenderer, describeConformance } from '#test-utils';
import { screen } from '@mui/internal-test-utils';

describe('<AlertDialog.Viewport />', () => {
  const { render } = createRenderer();

  describeConformance(<AlertDialog.Viewport />, () => ({
    refInstanceof: window.HTMLDivElement,
    render: (node) => {
      return render(
        <AlertDialog.Root open>
          <AlertDialog.Portal>
            {node}
            <AlertDialog.Popup />
          </AlertDialog.Portal>
        </AlertDialog.Root>,
      );
    },
  }));

  it('renders only when the dialog is mounted by default', async () => {
    function App() {
      const [open, setOpen] = React.useState(false);
      return (
        <AlertDialog.Root open={open} onOpenChange={setOpen}>
          <AlertDialog.Trigger>Open</AlertDialog.Trigger>
          <AlertDialog.Portal>
            <AlertDialog.Viewport data-testid="viewport">
              <AlertDialog.Popup data-testid="popup">Content</AlertDialog.Popup>
            </AlertDialog.Viewport>
          </AlertDialog.Portal>
        </AlertDialog.Root>
      );
    }

    const { user } = await render(<App />);

    expect(screen.queryByTestId('viewport')).to.equal(null);

    await user.click(screen.getByText('Open'));

    expect(screen.getByTestId('viewport')).not.to.equal(null);
    expect(screen.getByTestId('viewport')).to.contain(screen.getByTestId('popup'));
  });

  it('stays mounted when used within a keepMounted portal', async () => {
    const { setProps } = await render(
      <AlertDialog.Root open>
        <AlertDialog.Portal keepMounted>
          <AlertDialog.Viewport data-testid="viewport">
            <AlertDialog.Popup>Content</AlertDialog.Popup>
          </AlertDialog.Viewport>
        </AlertDialog.Portal>
      </AlertDialog.Root>,
    );

    expect(screen.getByTestId('viewport')).not.to.equal(null);

    await setProps({ open: false });

    expect(screen.getByTestId('viewport')).not.to.equal(null);
  });
});
