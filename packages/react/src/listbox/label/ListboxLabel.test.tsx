import { expect, describe, it } from 'vitest';
import { fireEvent, screen } from '@mui/internal-test-utils';
import { ListboxPreview as Listbox } from '@base-ui/react/listbox';
import { Field } from '@base-ui/react/field';
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

  it('stops labelling the list when it unmounts', async () => {
    function App(props: { labelled: boolean }) {
      return (
        <Listbox.Root>
          {props.labelled && <Listbox.Label>Choose one</Listbox.Label>}
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>
      );
    }

    const { setProps } = await render(<App labelled />);
    expect(screen.getByRole('listbox')).toHaveAttribute('aria-labelledby');

    await setProps({ labelled: false });

    expect(screen.getByRole('listbox')).not.toHaveAttribute('aria-labelledby');
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

  it('leaves the label of an enclosing Field to the Field control', async () => {
    await render(
      <Field.Root>
        <Field.Label>Name</Field.Label>
        <Field.Control />
        <Listbox.Root>
          <Listbox.Label>Fonts</Listbox.Label>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>
      </Field.Root>,
    );

    expect(screen.getByRole('textbox')).toHaveAccessibleName('Name');
    expect(screen.getByRole('listbox')).toHaveAccessibleName('Fonts');
    expect(screen.getByText('Fonts').id).not.toBe(screen.getByText('Name').id);
  });
});
