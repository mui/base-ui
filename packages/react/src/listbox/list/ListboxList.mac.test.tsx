import { describe, expect, it, vi } from 'vitest';
import { Listbox } from '@base-ui/react/listbox';
import { act, fireEvent, flushMicrotasks, screen } from '@mui/internal-test-utils';
import { createRenderer } from '#test-utils';

vi.mock('@base-ui/utils/platform', async () => {
  const actual =
    await vi.importActual<typeof import('@base-ui/utils/platform')>('@base-ui/utils/platform');
  return { platform: { ...actual.platform, os: { ...actual.platform.os, mac: true } } };
});

describe('<Listbox.List /> on macOS', () => {
  const { render } = createRenderer();

  it('toggles the item the list holds focus for on Option+Space', async () => {
    const handleValueChange = vi.fn();
    await render(
      <Listbox.Root multiple items={['a', 'b', 'c']} onValueChange={handleValueChange}>
        <Listbox.List>
          <Listbox.Item value="a">a</Listbox.Item>
        </Listbox.List>
      </Listbox.Root>,
    );
    await act(async () => screen.getByRole('option', { name: 'a' }).focus());
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'ArrowDown' });
    await flushMicrotasks();
    const list = screen.getByRole('listbox');
    expect(list).toHaveFocus();

    fireEvent.keyDown(list, { key: '\u00a0', code: 'Space', altKey: true });

    expect(handleValueChange.mock.calls.map((call) => call[0])).toEqual([['b']]);
  });
});
