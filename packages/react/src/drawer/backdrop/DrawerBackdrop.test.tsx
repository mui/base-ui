import { expect } from 'vitest';
import { Drawer } from '@base-ui/react/drawer';
import { screen } from '@mui/internal-test-utils';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Drawer.Backdrop />', () => {
  const { render } = createRenderer();

  describeConformance(<Drawer.Backdrop />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <Drawer.Root open modal={false}>
          {node}
        </Drawer.Root>,
      );
    },
  }));

  it('has role="presentation"', async () => {
    await render(
      <Drawer.Root open>
        <Drawer.Backdrop data-testid="backdrop" />
      </Drawer.Root>,
    );

    expect(screen.getByTestId('backdrop')).toHaveAttribute('role', 'presentation');
  });

  it('has open and closed state attributes', async () => {
    const { setProps } = await render(
      <Drawer.Root open>
        <Drawer.Backdrop data-testid="backdrop" />
      </Drawer.Root>,
    );

    const backdrop = screen.getByTestId('backdrop');
    expect(backdrop).toHaveAttribute('data-open', '');
    expect(backdrop).not.toHaveAttribute('data-closed');

    await setProps({ open: false });

    expect(backdrop).toHaveAttribute('data-closed', '');
    expect(backdrop).not.toHaveAttribute('data-open');
  });
});
