import { expect, vi } from 'vitest';
import * as React from 'react';
import { Combobox } from '@base-ui/react/combobox';
import { createRenderer } from '#test-utils';
import { fireEvent, screen } from '@mui/internal-test-utils';

vi.mock('@base-ui/utils/platform', async () => {
  const actual =
    await vi.importActual<typeof import('@base-ui/utils/platform')>('@base-ui/utils/platform');

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

  // Replacing the value while the native IME is composing leaves the field unable to accept
  // input until it is blurred and refocused, so the stale preview has to survive the press.
  // https://bugs.webkit.org/show_bug.cgi?id=255857
  it('keeps the composition preview when an item is selected with the pointer', async () => {
    const { user } = await render(
      <Combobox.Root items={['창세기', '출애굽기']}>
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
    fireEvent.change(input, { target: { value: '창' } });

    await user.click(screen.getByRole('option', { name: '창세기' }));

    expect(input).toHaveValue('창');
  });

  it('applies the selected value once the composition ends', async () => {
    const { user } = await render(
      <Combobox.Root items={['창세기', '출애굽기']}>
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
    fireEvent.change(input, { target: { value: '창' } });

    await user.click(screen.getByRole('option', { name: '창세기' }));
    fireEvent.compositionEnd(input, { target: { value: '창세기' } });

    expect(input).toHaveValue('창세기');
  });
});
