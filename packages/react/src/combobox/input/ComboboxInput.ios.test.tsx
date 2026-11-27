import { expect, vi, describe, it } from 'vitest';
import { Combobox } from '@base-ui/react/combobox';
import { createRenderer } from '#test-utils';
import { fireEvent, screen } from '@mui/internal-test-utils';

vi.mock('@base-ui/utils/platform', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@base-ui/utils/platform')>();
  return {
    ...actual,
    platform: {
      ...actual.platform,
      os: { ...actual.platform.os, ios: true, apple: true },
    },
  };
});

describe('<Combobox.Input /> on iOS', () => {
  const { render } = createRenderer();

  it('preserves the composition preview during an item press', async () => {
    const onValueChange = vi.fn();
    const onInputValueChange = vi.fn();
    const { user } = await render(
      <Combobox.Root
        items={['Apple', 'Banana']}
        onValueChange={onValueChange}
        onInputValueChange={onInputValueChange}
      >
        <Combobox.Input />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.List>
                {(item: string) => (
                  <Combobox.Item key={item} value={item}>
                    {item}
                  </Combobox.Item>
                )}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );

    const input = screen.getByRole('combobox');
    await user.click(input);
    fireEvent.compositionStart(input);
    fireEvent.change(input, { target: { value: 'App' } });
    expect(input).toHaveValue('App');

    await user.click(screen.getByRole('option', { name: 'Apple' }));

    expect(onValueChange).toHaveBeenCalledWith('Apple', expect.anything());
    // Replacing the native composition on iOS risks WebKit bug 255857.
    expect(input).toHaveValue('App');

    onInputValueChange.mockClear();
    fireEvent.change(input, { target: { value: 'Appl' } });
    expect(input).toHaveValue('Appl');
    expect(onInputValueChange).not.toHaveBeenCalled();

    fireEvent.compositionEnd(input, { data: 'Appl' });

    expect(onInputValueChange).toHaveBeenCalledTimes(1);
    expect(onInputValueChange).toHaveBeenCalledWith('Appl', expect.anything());
  });
});
