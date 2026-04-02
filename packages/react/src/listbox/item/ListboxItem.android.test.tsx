import { expect, vi } from 'vitest';
import { Listbox } from '@base-ui/react/listbox';
import { fireEvent, flushMicrotasks, screen } from '@mui/internal-test-utils';
import { createRenderer } from '#test-utils';

vi.mock('@base-ui/utils/detectBrowser', async () => {
  const actual = await vi.importActual<typeof import('@base-ui/utils/detectBrowser')>(
    '@base-ui/utils/detectBrowser',
  );
  return { ...actual, isAndroid: true };
});

describe('<Listbox.Item /> Android drag-and-drop', () => {
  beforeEach(() => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
  });

  const { render } = createRenderer();

  it('prevents the native context menu for draggable items', async () => {
    await render(
      <Listbox.Root>
        <Listbox.DragAndDropProvider onItemsReorder={vi.fn()}>
          <Listbox.List>
            <Listbox.Item value="a">
              <Listbox.ItemDragHandle data-testid="handle">drag</Listbox.ItemDragHandle>
              <Listbox.ItemText>a</Listbox.ItemText>
            </Listbox.Item>
          </Listbox.List>
        </Listbox.DragAndDropProvider>
      </Listbox.Root>,
    );

    await flushMicrotasks();

    const handle = screen.getByTestId('handle');
    const eventWasCancelled = !fireEvent.contextMenu(handle);
    await flushMicrotasks();

    expect(eventWasCancelled).toBe(true);
  });

  it('does not prevent the native context menu when drag-and-drop is disabled', async () => {
    await render(
      <Listbox.Root>
        <Listbox.List>
          <Listbox.Item value="a">a</Listbox.Item>
        </Listbox.List>
      </Listbox.Root>,
    );

    await flushMicrotasks();

    const item = screen.getByRole('option', { name: 'a' });
    const eventWasCancelled = !fireEvent.contextMenu(item);
    await flushMicrotasks();

    expect(eventWasCancelled).toBe(false);
  });
});
