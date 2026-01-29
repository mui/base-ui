import { expect } from 'chai';
import { Drawer } from '@base-ui/react/drawer';
import { screen } from '@mui/internal-test-utils';
import { createRenderer } from '#test-utils';

interface TestCaseProps {
  open: boolean;
}

function TestCase(props: TestCaseProps) {
  const { open } = props;

  return (
    <Drawer.Provider>
      <Drawer.IndentBackground data-testid="bg" />
      <Drawer.Indent data-testid="indent">
        <Drawer.Root open={open}>
          <Drawer.Trigger>Open</Drawer.Trigger>
        </Drawer.Root>
      </Drawer.Indent>
    </Drawer.Provider>
  );
}

describe('<Drawer.Indent />', () => {
  const { render } = createRenderer();

  it('sets data-active when any drawer is open', async () => {
    const { setProps } = await render(<TestCase open={false} />);

    expect(screen.getByTestId('indent')).to.have.attribute('data-inactive');
    expect(screen.getByTestId('indent')).not.to.have.attribute('data-active');

    await setProps({ open: true });

    expect(screen.getByTestId('indent')).to.have.attribute('data-active');
    expect(screen.getByTestId('indent')).not.to.have.attribute('data-inactive');
    expect(screen.getByTestId('bg')).to.have.attribute('data-active');
  });
});
