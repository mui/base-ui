import { describe, expect, it, vi } from 'vitest';
import { Listbox } from '@base-ui/react/listbox';
import { act, fireEvent, screen } from '@mui/internal-test-utils';
import { createRenderer } from '#test-utils';

vi.mock('@base-ui/utils/platform', async () => {
  const actual =
    await vi.importActual<typeof import('@base-ui/utils/platform')>('@base-ui/utils/platform');
  return {
    platform: { ...actual.platform, engine: { ...actual.platform.engine, webkit: true } },
  };
});

describe('<Listbox.Item /> in WebKit', () => {
  const { render } = createRenderer();

  // WebKit fires `mousemove` without movement when the list scrolls under a resting pointer.
  it.each([
    { name: 'keeps focus when the pointer did not move', movementX: 0, focused: 'a' },
    { name: 'moves focus when the pointer moved', movementX: 1, focused: 'b' },
  ])('$name', async ({ movementX, focused }) => {
    await render(
      <Listbox.Root>
        <Listbox.List>
          <Listbox.Item value="a">a</Listbox.Item>
          <Listbox.Item value="b">b</Listbox.Item>
        </Listbox.List>
      </Listbox.Root>,
    );

    await act(async () => screen.getByRole('option', { name: 'a' }).focus());
    fireEvent.mouseMove(screen.getByRole('option', { name: 'b' }), { movementX, movementY: 0 });

    expect(screen.getByRole('option', { name: focused })).toHaveFocus();
  });
});
