import { expect } from 'vitest';
import { Select } from '@base-ui/react/select';
import { screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Select.ItemIndicator />', () => {
  const { render } = createRenderer();

  describeConformance(<Select.ItemIndicator />, () => ({
    refInstanceof: window.HTMLSpanElement,
    render(node) {
      return render(
        <Select.Root open>
          <Select.Trigger>
            <Select.Value />
          </Select.Trigger>
          <Select.Positioner>
            <Select.Item>{node}</Select.Item>
          </Select.Positioner>
        </Select.Root>,
      );
    },
  }));

  it('settles out of its transition state after the item is deselected', async () => {
    const { user } = await render(
      <Select.Root multiple defaultOpen defaultValue={['a']}>
        <Select.Trigger>
          <Select.Value />
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner>
            <Select.Popup>
              <Select.Item value="a">
                a
                <Select.ItemIndicator keepMounted data-testid="indicator" />
              </Select.Item>
              <Select.Item value="b">b</Select.Item>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>,
    );

    const indicator = screen.getByTestId('indicator');
    expect(indicator).toHaveAttribute('data-selected');

    await user.click(screen.getByRole('option', { name: 'a' }));

    await waitFor(() => {
      expect(indicator).not.toHaveAttribute('data-selected');
    });

    // A kept-mounted indicator must not be left advertising an exit transition once the
    // deselection has finished, or `[data-ending-style]` CSS would stick permanently.
    await waitFor(() => {
      expect(indicator).not.toHaveAttribute('data-ending-style');
    });
  });
});
