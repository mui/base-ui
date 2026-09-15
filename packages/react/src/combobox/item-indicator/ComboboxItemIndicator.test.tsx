import { describe, it, expect } from 'vitest';
import { Combobox } from '@base-ui/react/combobox';
import { createRenderer, describeConformance } from '#test-utils';
import { screen } from '@mui/internal-test-utils';

describe('<Combobox.ItemIndicator />', () => {
  const { render } = createRenderer();

  describeConformance(<Combobox.ItemIndicator keepMounted />, () => ({
    refInstanceof: window.HTMLSpanElement,
    render(node) {
      return render(
        <Combobox.Root>
          <Combobox.Item>{node}</Combobox.Item>
        </Combobox.Root>,
      );
    },
  }));

  it('does not render the default checkmark when `render` is a childless custom element', async () => {
    // Regression test for https://github.com/mui/base-ui/issues/4752
    await render(
      <Combobox.Root defaultOpen defaultValue="apple">
        <Combobox.Input />
        <Combobox.Portal keepMounted>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.List>
                <Combobox.Item value="apple">
                  apple
                  <Combobox.ItemIndicator
                    keepMounted
                    render={<span data-testid="custom-indicator" className="my-check" />}
                  />
                </Combobox.Item>
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );

    const indicator = screen.getByTestId('custom-indicator');
    expect(indicator.textContent).toBe('');
  });

  it('updates a mounted indicator when its item becomes unselected', async () => {
    const { user } = await render(
      <Combobox.Root defaultOpen defaultValue="apple">
        <Combobox.Input />
        <Combobox.Portal keepMounted>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.List>
                <Combobox.Item value="apple">
                  apple
                  <Combobox.ItemIndicator keepMounted data-testid="apple-indicator" />
                </Combobox.Item>
                <Combobox.Item value="banana">banana</Combobox.Item>
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );

    expect(screen.getByTestId('apple-indicator')).toHaveAttribute('data-selected');

    await user.click(screen.getByRole('option', { name: 'banana' }));

    expect(screen.getByTestId('apple-indicator')).not.toHaveAttribute('data-selected');
  });
});
