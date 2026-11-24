import { expect, describe, it } from 'vitest';
import { fireEvent, screen } from '@mui/internal-test-utils';
import { Listbox } from '@base-ui/react/listbox';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Listbox.Label />', () => {
  const { render } = createRenderer();

  describeConformance(<Listbox.Label />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(<Listbox.Root>{node}</Listbox.Root>);
    },
  }));

  it('should wire aria-labelledby from Listbox.Label to Listbox.List', async () => {
    await render(
      <Listbox.Root>
        <Listbox.Label>Choose one</Listbox.Label>
        <Listbox.List>
          <Listbox.Item value="a">a</Listbox.Item>
        </Listbox.List>
      </Listbox.Root>,
    );

    const list = screen.getByRole('listbox');
    const labelId = list.getAttribute('aria-labelledby');
    expect(labelId).not.toBeNull();

    const label = document.getElementById(labelId!);
    expect(label).toHaveTextContent('Choose one');
  });

  it('keeps the label linked when the list has its own id', async () => {
    await render(
      <Listbox.Root>
        <Listbox.Label>Artists</Listbox.Label>
        <Listbox.List id="artists">
          <Listbox.Item value="a">a</Listbox.Item>
        </Listbox.List>
      </Listbox.Root>,
    );

    const list = screen.getByRole('listbox', { name: 'Artists' });
    expect(list).toHaveAttribute('id', 'artists');
    const item = screen.getByRole('option', { name: 'a' });
    expect(item).not.toHaveFocus();

    fireEvent.click(screen.getByText('Artists'));

    expect(item).toHaveFocus();
  });
});
