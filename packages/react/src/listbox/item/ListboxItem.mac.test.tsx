import { describe, expect, it, vi } from 'vitest';
import { Listbox } from '@base-ui/react/listbox';
import { act, fireEvent, flushMicrotasks, screen } from '@mui/internal-test-utils';
import { createRenderer } from '#test-utils';

vi.mock('@base-ui/utils/platform', async () => {
  const actual =
    await vi.importActual<typeof import('@base-ui/utils/platform')>('@base-ui/utils/platform');
  return { platform: { ...actual.platform, os: { ...actual.platform.os, mac: true } } };
});

describe('<Listbox.Item /> on macOS', () => {
  const { render } = createRenderer();

  it.each([
    { name: 'a space', key: ' ' },
    { name: 'a non-breaking space', key: ' ' },
  ])('toggles the focused item on Option+Space reported as $name', async ({ key }) => {
    const handleValueChange = vi.fn();

    await render(
      <Listbox.Root multiple="opt-in" defaultValue={['a']} onValueChange={handleValueChange}>
        <Listbox.List>
          <Listbox.Item value="a">a</Listbox.Item>
          <Listbox.Item value="b">b</Listbox.Item>
        </Listbox.List>
      </Listbox.Root>,
    );

    const itemB = screen.getByRole('option', { name: 'b' });
    await act(async () => itemB.focus());

    fireEvent.keyDown(itemB, { key, code: 'Space', altKey: true });
    fireEvent.keyUp(itemB, { key, code: 'Space', altKey: true });
    await flushMicrotasks();

    expect(handleValueChange).toHaveBeenCalledTimes(1);
    expect(handleValueChange.mock.calls[0][0]).toEqual(['a', 'b']);
  });

  it('moves focus without changing the selection on Option+arrow keys, then toggles with Option+Space', async () => {
    const handleValueChange = vi.fn();

    await render(
      <Listbox.Root multiple="opt-in" defaultValue={['a']} onValueChange={handleValueChange}>
        <Listbox.List>
          <Listbox.Item value="a">a</Listbox.Item>
          <Listbox.Item value="b">b</Listbox.Item>
          <Listbox.Item value="c">c</Listbox.Item>
        </Listbox.List>
      </Listbox.Root>,
    );

    const itemA = screen.getByRole('option', { name: 'a' });
    await act(async () => itemA.focus());

    fireEvent.keyDown(itemA, { key: 'ArrowDown', altKey: true });
    await flushMicrotasks();
    const itemB = screen.getByRole('option', { name: 'b' });
    fireEvent.keyDown(itemB, { key: 'ArrowDown', altKey: true });
    await flushMicrotasks();

    const itemC = screen.getByRole('option', { name: 'c' });
    expect(itemC).toHaveAttribute('data-highlighted');
    expect(handleValueChange).not.toHaveBeenCalled();

    fireEvent.keyDown(itemC, { key: '\u00a0', code: 'Space', altKey: true });
    fireEvent.keyUp(itemC, { key: '\u00a0', code: 'Space', altKey: true });
    await flushMicrotasks();

    expect(handleValueChange).toHaveBeenCalledTimes(1);
    expect(handleValueChange.mock.calls[0][0]).toEqual(['a', 'c']);
  });

  it('does not use Cmd+arrow keys to move without selecting', async () => {
    const handleValueChange = vi.fn();

    await render(
      <Listbox.Root multiple="opt-in" defaultValue={['a']} onValueChange={handleValueChange}>
        <Listbox.List>
          <Listbox.Item value="a">a</Listbox.Item>
          <Listbox.Item value="b">b</Listbox.Item>
        </Listbox.List>
      </Listbox.Root>,
    );

    const itemA = screen.getByRole('option', { name: 'a' });
    await act(async () => itemA.focus());

    fireEvent.keyDown(itemA, { key: 'ArrowDown', metaKey: true });
    await flushMicrotasks();

    expect(itemA).toHaveAttribute('data-highlighted');
    expect(handleValueChange).not.toHaveBeenCalled();
  });
});
