import * as React from 'react';
import { act, fireEvent, screen, waitFor } from '@mui/internal-test-utils';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { expect, vi, describe, beforeEach, it } from 'vitest';
import { createRenderer, describeConformance, resetBrowserPointer } from '#test-utils';
import { Menu } from '@base-ui/react/menu';

describe('<Menu.List />', () => {
  beforeEach(resetBrowserPointer);

  const { render } = createRenderer();

  it('replays keys from an item that holds real focus and activates on Enter', async () => {
    const onClick = vi.fn();
    const { user } = await render(
      <Menu.FilterProvider>
        <Menu.Root defaultOpen>
          <Menu.Trigger>Actions</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.Input aria-label="Filter actions" />
                <Menu.List>
                  <Menu.Item>Rename</Menu.Item>
                  <Menu.Item onClick={onClick}>Delete</Menu.Item>
                </Menu.List>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      </Menu.FilterProvider>,
    );

    const input = screen.getByRole('searchbox', { name: 'Filter actions' });
    await waitFor(() => {
      expect(input).toHaveFocus();
    });
    await user.keyboard('[ArrowDown]');
    const rename = screen.getByRole('menuitem', { name: 'Rename' });
    const del = screen.getByRole('menuitem', { name: 'Delete' });
    expect(input).toHaveAttribute('aria-activedescendant', rename.id);

    // A screen reader following `aria-activedescendant` moves real focus onto the item.
    await act(async () => {
      rename.focus();
    });
    await user.keyboard('[ArrowDown]');

    await waitFor(() => {
      expect(input).toHaveAttribute('aria-activedescendant', del.id);
    });
    expect(input).toHaveFocus();

    await act(async () => {
      del.focus();
    });
    await user.keyboard('[Enter]');

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(input).toHaveValue('');
  });

  it('clears the highlight when focus returns to the input from an item', async () => {
    const { user } = await render(
      <Menu.FilterProvider>
        <Menu.Root defaultOpen>
          <Menu.Trigger>Actions</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.Input aria-label="Filter actions" />
                <Menu.List>
                  <Menu.Item>Rename</Menu.Item>
                  <Menu.Item>Delete</Menu.Item>
                </Menu.List>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      </Menu.FilterProvider>,
    );

    const input = screen.getByRole('searchbox', { name: 'Filter actions' });
    await waitFor(() => {
      expect(input).toHaveFocus();
    });
    await user.keyboard('[ArrowDown]');
    const rename = screen.getByRole('menuitem', { name: 'Rename' });
    expect(input).toHaveAttribute('aria-activedescendant', rename.id);

    // A screen reader parks real focus on the item, then the user moves back to the input.
    await act(async () => {
      rename.focus();
    });
    await act(async () => {
      input.focus();
    });

    expect(input).not.toHaveAttribute('aria-activedescendant');
    expect(rename).not.toHaveAttribute('data-highlighted');
  });

  it('keeps the highlight when focus returns to the input with autoHighlight="always"', async () => {
    await render(
      <Menu.FilterProvider autoHighlight="always">
        <Menu.Root defaultOpen>
          <Menu.Trigger>Actions</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.Input aria-label="Filter actions" />
                <Menu.List>
                  <Menu.Item>Rename</Menu.Item>
                  <Menu.Item>Delete</Menu.Item>
                </Menu.List>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      </Menu.FilterProvider>,
    );

    const input = screen.getByRole('searchbox', { name: 'Filter actions' });
    const rename = screen.getByRole('menuitem', { name: 'Rename' });
    await waitFor(() => {
      expect(input).toHaveAttribute('aria-activedescendant', rename.id);
    });

    await act(async () => {
      rename.focus();
    });
    await act(async () => {
      input.focus();
    });

    expect(input).toHaveAttribute('aria-activedescendant', rename.id);
  });

  it('keeps virtual focus on the input without making the list tabbable', async () => {
    const { user } = await render(
      <Menu.FilterProvider>
        <Menu.Root open>
          <Menu.Trigger>Fruit</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.Input aria-label="Filter fruit" />
                <Menu.List data-testid="list">
                  <Menu.Item>Apple</Menu.Item>
                  <Menu.Item>Banana</Menu.Item>
                </Menu.List>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      </Menu.FilterProvider>,
    );

    const input = screen.getByRole('searchbox', { name: 'Filter fruit' });
    const list = screen.getByTestId('list');
    const apple = screen.getByRole('menuitem', { name: 'Apple' });

    await waitFor(() => {
      expect(input).toHaveFocus();
    });
    expect(list).not.toHaveAttribute('aria-hidden');
    expect(list).toHaveAttribute('tabindex', '-1');
    expect(apple).toHaveAttribute('tabindex', '-1');
    expect(apple).not.toHaveAttribute('aria-expanded');

    await user.keyboard('[ArrowDown]');
    await waitFor(() => {
      expect(input).toHaveAttribute('aria-activedescendant', apple.id);
    });
    expect(input).toHaveFocus();
  });

  describe('keys on a focused list', () => {
    function App(props: { onPress?: (() => void) | undefined }) {
      return (
        <Menu.FilterProvider>
          <Menu.Root defaultOpen>
            <Menu.Trigger>Fruit</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.Input aria-label="Filter fruit" />
                  <Menu.List data-testid="list">
                    <Menu.Item onClick={props.onPress}>Apple</Menu.Item>
                    <Menu.Item>Banana</Menu.Item>
                  </Menu.List>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menu.FilterProvider>
      );
    }

    it('replays navigation keys on the input instead of scrolling', async () => {
      await render(<App />);

      const input = screen.getByRole('searchbox', { name: 'Filter fruit' });
      const list = screen.getByTestId('list');
      const apple = screen.getByRole('menuitem', { name: 'Apple' });

      await waitFor(() => {
        expect(input).toHaveFocus();
      });
      await act(async () => {
        list.focus();
      });
      expect(list).toHaveFocus();

      const scrolls = fireEvent.keyDown(list, { key: 'ArrowDown' });

      expect(scrolls).toBe(false);
      await waitFor(() => {
        expect(input).toHaveAttribute('aria-activedescendant', apple.id);
      });
      expect(input).toHaveFocus();
    });

    it('commits the highlighted item when Enter lands on the list', async () => {
      const onPress = vi.fn();
      const { user } = await render(<App onPress={onPress} />);

      const input = screen.getByRole('searchbox', { name: 'Filter fruit' });
      const list = screen.getByTestId('list');
      const apple = screen.getByRole('menuitem', { name: 'Apple' });

      await waitFor(() => {
        expect(input).toHaveFocus();
      });
      await user.keyboard('[ArrowDown]');
      await waitFor(() => {
        expect(input).toHaveAttribute('aria-activedescendant', apple.id);
      });

      await act(async () => {
        list.focus();
      });
      fireEvent.keyDown(list, { key: 'Enter' });

      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('still closes the menu with Escape', async () => {
      await render(<App />);

      const list = screen.getByTestId('list');

      await waitFor(() => {
        expect(screen.getByRole('searchbox', { name: 'Filter fruit' })).toHaveFocus();
      });
      await act(async () => {
        list.focus();
      });
      fireEvent.keyDown(list, { key: 'Escape' });

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).toBe(null);
      });
    });

    it('hands typing keys back to the input', async () => {
      await render(<App />);

      const input = screen.getByRole('searchbox', { name: 'Filter fruit' });
      const list = screen.getByTestId('list');

      await waitFor(() => {
        expect(input).toHaveFocus();
      });
      await act(async () => {
        list.focus();
      });

      const types = fireEvent.keyDown(list, { key: 'z' });

      // Not canceled, so the native default action types into the refocused input.
      expect(types).toBe(true);
      expect(input).toHaveFocus();
    });
  });
});

describe('filterable menu list semantics', () => {
  const { render } = createRenderer();

  function TestMenu(props: { secondId?: string; orientation?: Menu.Root.Orientation }) {
    return (
      <Menu.FilterProvider autoHighlight="always">
        <Menu.Root defaultOpen orientation={props.orientation}>
          <Menu.Trigger>Actions</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.Input aria-label="Filter actions" />
                <Menu.List>
                  <Menu.Item id="first-item">First</Menu.Item>
                  <Menu.Item id={props.secondId}>Second</Menu.Item>
                </Menu.List>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      </Menu.FilterProvider>
    );
  }

  it('reads an item id when navigating to it', async () => {
    const { user, setProps } = await render(<TestMenu secondId="old-id" />);
    const input = screen.getByRole('searchbox');
    await waitFor(() => expect(input).toHaveAttribute('aria-activedescendant', 'first-item'));
    await setProps({ secondId: 'new-id' });
    await user.keyboard('[ArrowDown]');
    expect(input).toHaveAttribute('aria-activedescendant', 'new-id');
  });

  it('exposes horizontal navigation on the menu instead of the dialog', async () => {
    const { user } = await render(<TestMenu orientation="horizontal" secondId="second-item" />);
    const input = screen.getByRole('searchbox');
    expect(screen.getByRole('menu')).toHaveAttribute('aria-orientation', 'horizontal');
    expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-orientation');
    await waitFor(() => expect(input).toHaveAttribute('aria-activedescendant', 'first-item'));
    await user.keyboard('[ArrowRight]');
    expect(input).toHaveAttribute('aria-activedescendant', 'second-item');
  });

  describe('horizontal list without autoHighlight', () => {
    function HorizontalMenu(props: { defaultOpen?: boolean }) {
      return (
        <Menu.FilterProvider>
          <Menu.Root defaultOpen={props.defaultOpen} orientation="horizontal">
            <Menu.Trigger>Actions</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.Input aria-label="Filter actions" />
                  <Menu.List>
                    <Menu.Item id="alpha">Alpha</Menu.Item>
                    <Menu.Item id="apple">Apple</Menu.Item>
                    <Menu.Item id="beta">Beta</Menu.Item>
                  </Menu.List>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menu.FilterProvider>
      );
    }

    it('enters the results with the vertical arrows after typing', async () => {
      const { user } = await render(<HorizontalMenu defaultOpen />);
      const input = screen.getByRole('searchbox', { name: 'Filter actions' });
      await waitFor(() => expect(input).toHaveFocus());

      await user.type(input, 'p');
      await waitFor(() => expect(screen.queryByText('Beta')).toBe(null));

      // Left and Right keep moving the caret while nothing is highlighted.
      await user.keyboard('[ArrowLeft]');
      expect(input).not.toHaveAttribute('aria-activedescendant');

      await user.keyboard('[ArrowDown]');
      expect(input).toHaveAttribute('aria-activedescendant', 'alpha');
      await user.keyboard('[ArrowRight]');
      expect(input).toHaveAttribute('aria-activedescendant', 'apple');
      await user.keyboard('[ArrowLeft]');
      expect(input).toHaveAttribute('aria-activedescendant', 'alpha');
    });

    it('enters the results from the end with ArrowUp', async () => {
      const { user } = await render(<HorizontalMenu defaultOpen />);
      const input = screen.getByRole('searchbox', { name: 'Filter actions' });
      await waitFor(() => expect(input).toHaveFocus());

      await user.keyboard('[ArrowUp]');
      expect(input).toHaveAttribute('aria-activedescendant', 'beta');
    });

    it('highlights the first item when opened from the trigger with ArrowDown', async () => {
      const { user } = await render(<HorizontalMenu />);
      const trigger = screen.getByRole('button', { name: 'Actions' });
      await act(async () => {
        trigger.focus();
      });

      await user.keyboard('[ArrowDown]');

      const input = await screen.findByRole('searchbox', { name: 'Filter actions' });
      await waitFor(() => expect(input).toHaveAttribute('aria-activedescendant', 'alpha'));
    });
  });
});

describe('<Menu.List /> in a plain menu', () => {
  const { render } = createRenderer();

  function PlainMenu(props: { orientation?: Menu.Root.Props['orientation'] }) {
    return (
      <Menu.Root orientation={props.orientation}>
        <Menu.Trigger>Actions</Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner>
            <Menu.Popup data-testid="popup">
              <div>Header</div>
              <Menu.List data-testid="list">
                <Menu.Item data-testid="item-1">Rename</Menu.Item>
                <Menu.Item data-testid="item-2">Delete</Menu.Item>
              </Menu.List>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    );
  }

  describeConformance(<Menu.List />, () => ({
    refInstanceof: window.HTMLDivElement,
    render: (node) =>
      render(
        <Menu.Root open>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>{node}</Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>,
      ),
  }));

  it('takes the menu role and label from the popup', async () => {
    const { user } = await render(<PlainMenu />);
    const trigger = screen.getByRole('button', { name: 'Actions' });

    await user.click(trigger);

    const list = await screen.findByTestId('list');
    expect(list).toHaveAttribute('role', 'menu');
    expect(list).toHaveAttribute('aria-labelledby', trigger.id);
    expect(screen.getByTestId('popup')).toHaveAttribute('role', 'presentation');
    expect(screen.getByTestId('popup')).not.toHaveAttribute('aria-labelledby');
    expect(trigger).toHaveAttribute('aria-controls', list.id);
  });

  it('renders the orientation on the list', async () => {
    const { user } = await render(<PlainMenu orientation="horizontal" />);

    await user.click(screen.getByRole('button', { name: 'Actions' }));

    const list = await screen.findByTestId('list');
    expect(list).toHaveAttribute('aria-orientation', 'horizontal');
    expect(screen.getByTestId('popup')).not.toHaveAttribute('aria-orientation');
  });

  it('navigates the items with the keyboard', async () => {
    const { user } = await render(<PlainMenu />);
    const trigger = screen.getByRole('button', { name: 'Actions' });

    await act(async () => {
      trigger.focus();
    });
    await user.keyboard('[Enter]');

    await waitFor(() => {
      expect(screen.getByTestId('item-1')).toHaveFocus();
    });

    await user.keyboard('[ArrowDown]');

    await waitFor(() => {
      expect(screen.getByTestId('item-2')).toHaveFocus();
    });
  });

  it('focuses the list rather than the presentational popup on a pointer open', async () => {
    const { user } = await render(<PlainMenu />);
    const trigger = screen.getByRole('button', { name: 'Actions' });

    fireEvent.mouseDown(trigger, { detail: 1 });
    fireEvent.click(trigger, { detail: 1 });

    const list = await screen.findByTestId('list');
    await waitFor(() => {
      expect(list).toHaveFocus();
    });

    await user.keyboard('[ArrowDown]');

    await waitFor(() => {
      expect(screen.getByTestId('item-1')).toHaveFocus();
    });
  });

  it('does not point an inactive trigger at the list', async () => {
    function TwoTriggers() {
      const handle = useRefWithInit(() => Menu.createHandle()).current;
      return (
        <React.Fragment>
          <Menu.Trigger handle={handle}>First</Menu.Trigger>
          <Menu.Trigger handle={handle}>Second</Menu.Trigger>
          <Menu.Root handle={handle}>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.List data-testid="list">
                    <Menu.Item>Rename</Menu.Item>
                  </Menu.List>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </React.Fragment>
      );
    }

    const { user } = await render(<TwoTriggers />);
    const first = screen.getByRole('button', { name: 'First' });
    const second = screen.getByRole('button', { name: 'Second' });

    await user.click(first);

    const list = await screen.findByTestId('list');
    expect(first).toHaveAttribute('aria-controls', list.id);
    expect(second).not.toHaveAttribute('aria-controls');
  });
});
