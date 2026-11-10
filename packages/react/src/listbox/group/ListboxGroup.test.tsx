import { expect, describe, it } from 'vitest';
import { Listbox } from '@base-ui/react/listbox';
import { screen } from '@mui/internal-test-utils';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Listbox.Group />', () => {
  const { render } = createRenderer();

  describeConformance(<Listbox.Group />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <Listbox.Root>
          <Listbox.List>{node}</Listbox.List>
        </Listbox.Root>,
      );
    },
  }));

  it('associates the label with the group', async () => {
    await render(
      <Listbox.Root>
        <Listbox.List>
          <Listbox.Group>
            <Listbox.GroupLabel>Fruits</Listbox.GroupLabel>
            <Listbox.Item value="apple">Apple</Listbox.Item>
          </Listbox.Group>
        </Listbox.List>
      </Listbox.Root>,
    );

    expect(screen.getByRole('group')).toHaveAttribute(
      'aria-labelledby',
      screen.getByText('Fruits').id,
    );
  });

  it('removes the association when the label unmounts', async () => {
    function App(props: { showLabel: boolean }) {
      return (
        <Listbox.Root>
          <Listbox.List>
            <Listbox.Group>
              {props.showLabel && <Listbox.GroupLabel>Fruits</Listbox.GroupLabel>}
              <Listbox.Item value="apple">Apple</Listbox.Item>
            </Listbox.Group>
          </Listbox.List>
        </Listbox.Root>
      );
    }

    const { setProps } = await render(<App showLabel />);
    expect(screen.getByRole('group')).toHaveAttribute('aria-labelledby');

    await setProps({ showLabel: false });
    expect(screen.getByRole('group')).not.toHaveAttribute('aria-labelledby');
  });
});
