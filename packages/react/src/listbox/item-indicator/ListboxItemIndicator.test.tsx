import { expect, describe, it } from 'vitest';
import { Listbox } from '@base-ui/react/listbox';
import { screen } from '@mui/internal-test-utils';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Listbox.ItemIndicator />', () => {
  const { render } = createRenderer();

  describeConformance(<Listbox.ItemIndicator keepMounted />, () => ({
    refInstanceof: window.HTMLSpanElement,
    render(node) {
      return render(
        <Listbox.Root>
          <Listbox.List>
            <Listbox.Item value="a">{node}</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );
    },
  }));

  function TestListbox(props: { keepMounted?: boolean }) {
    return (
      <Listbox.Root defaultValue="a">
        <Listbox.List>
          <Listbox.Item value="a">
            a
            <Listbox.ItemIndicator keepMounted={props.keepMounted} data-testid="indicator-a" />
          </Listbox.Item>
          <Listbox.Item value="b">
            b
            <Listbox.ItemIndicator keepMounted={props.keepMounted} data-testid="indicator-b" />
          </Listbox.Item>
        </Listbox.List>
      </Listbox.Root>
    );
  }

  it('renders only in the selected item', async () => {
    await render(<TestListbox />);

    expect(screen.getByTestId('indicator-a')).toHaveAttribute('data-selected');
    expect(screen.queryByTestId('indicator-b')).toBe(null);
  });

  it('prop: keepMounted keeps the indicator of unselected items in the DOM', async () => {
    await render(<TestListbox keepMounted />);

    expect(screen.getByTestId('indicator-a')).toHaveAttribute('data-selected');
    expect(screen.getByTestId('indicator-b')).not.toHaveAttribute('data-selected');
  });
});
