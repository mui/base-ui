import { expect } from 'vitest';
import * as React from 'react';
import { act, screen, waitFor } from '@mui/internal-test-utils';
import { FilterMenu } from '@base-ui/react/filter-menu';
import { DirectionProvider } from '@base-ui/react/direction-provider';
import { createRenderer, describeConformance, waitSingleFrame } from '#test-utils';

describe('<FilterMenu.Row />', () => {
  const { render } = createRenderer();

  describeConformance(<FilterMenu.Row />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <FilterMenu.Root grid inline open>
          <FilterMenu.List>{node}</FilterMenu.List>
        </FilterMenu.Root>,
      );
    },
  }));

  it('renders a row in a grid filter menu', async () => {
    await render(
      <FilterMenu.Root grid inline open>
        <FilterMenu.List>
          <FilterMenu.Row />
        </FilterMenu.List>
      </FilterMenu.Root>,
    );

    expect(screen.getByRole('row')).toBeVisible();
  });

  it('takes no row role outside grid mode', async () => {
    await render(
      <FilterMenu.Root inline open>
        <FilterMenu.List>
          <FilterMenu.Row data-testid="row">
            <FilterMenu.Item>Rename</FilterMenu.Item>
          </FilterMenu.Row>
        </FilterMenu.List>
      </FilterMenu.Root>,
    );

    // A `row` inside a `menu` would break the menu's ownership of its items.
    expect(screen.getByTestId('row')).not.toHaveAttribute('role');
    expect(screen.getByRole('menuitem', { name: 'Rename' })).toBeVisible();
  });

  it('hides a row once the query filters out every cell', async () => {
    const { user } = await render(
      <FilterMenu.Root grid inline open>
        <FilterMenu.Input aria-label="Search" />
        <FilterMenu.List>
          <FilterMenu.Row data-testid="row-apple">
            <FilterMenu.Item>Apple</FilterMenu.Item>
          </FilterMenu.Row>
          <FilterMenu.Row data-testid="row-banana">
            <FilterMenu.Item>Banana</FilterMenu.Item>
          </FilterMenu.Row>
        </FilterMenu.List>
      </FilterMenu.Root>,
    );

    await user.type(screen.getByRole('searchbox', { name: 'Search' }), 'ban');

    // An empty `row` owns no cell, and its layout styles would leave a blank band behind.
    await waitFor(() => {
      expect(screen.getByTestId('row-apple')).toHaveAttribute('hidden');
    });
    expect(screen.getByTestId('row-banana')).not.toHaveAttribute('hidden');
    expect(screen.getAllByRole('row')).toHaveLength(1);
  });

  it('hides a group once every row inside it is filtered out', async () => {
    const { user } = await render(
      <FilterMenu.Root grid inline open>
        <FilterMenu.Input aria-label="Search" />
        <FilterMenu.List>
          <FilterMenu.Group data-testid="fruit">
            <FilterMenu.GroupLabel>Fruit</FilterMenu.GroupLabel>
            <FilterMenu.Row>
              <FilterMenu.Item>Apple</FilterMenu.Item>
            </FilterMenu.Row>
          </FilterMenu.Group>
          <FilterMenu.Group data-testid="veg">
            <FilterMenu.GroupLabel>Vegetables</FilterMenu.GroupLabel>
            <FilterMenu.Row>
              <FilterMenu.Item>Leek</FilterMenu.Item>
            </FilterMenu.Row>
          </FilterMenu.Group>
        </FilterMenu.List>
      </FilterMenu.Root>,
    );

    await user.type(screen.getByRole('searchbox', { name: 'Search' }), 'lee');

    // Rows collect the items, so a group only learns it is empty through its rows.
    await waitFor(() => {
      expect(screen.getByTestId('fruit')).toHaveAttribute('hidden');
    });
    expect(screen.getByTestId('veg')).not.toHaveAttribute('hidden');
  });

  describe('prop: grid', () => {
    function GridMenu(props: {
      defaultOpen?: boolean | undefined;
      inputless?: boolean | undefined;
      onPress?: (() => void) | undefined;
    }) {
      return (
        <FilterMenu.Root grid defaultOpen={props.defaultOpen ?? true}>
          <FilterMenu.Trigger>Emoji</FilterMenu.Trigger>
          <FilterMenu.Portal>
            <FilterMenu.Positioner>
              <FilterMenu.Popup>
                {!props.inputless && <FilterMenu.Input aria-label="Search emoji" />}
                <FilterMenu.List>
                  <FilterMenu.Row>
                    <FilterMenu.Item>One</FilterMenu.Item>
                    <FilterMenu.Item>Two</FilterMenu.Item>
                    <FilterMenu.Item>Three</FilterMenu.Item>
                  </FilterMenu.Row>
                  <FilterMenu.Row>
                    <FilterMenu.Item>Four</FilterMenu.Item>
                    <FilterMenu.Item onClick={props.onPress}>Five</FilterMenu.Item>
                  </FilterMenu.Row>
                </FilterMenu.List>
              </FilterMenu.Popup>
            </FilterMenu.Positioner>
          </FilterMenu.Portal>
        </FilterMenu.Root>
      );
    }

    it('opens with vertical trigger arrows, not horizontal grid arrows', async () => {
      const { user } = await render(<GridMenu defaultOpen={false} />);
      const trigger = screen.getByRole('button', { name: 'Emoji' });

      await act(async () => {
        trigger.focus();
      });
      await user.keyboard('[ArrowRight]');

      expect(screen.queryByRole('grid')).toBe(null);

      await user.keyboard('[ArrowDown]');

      expect(await screen.findByRole('grid')).toBeVisible();
      await waitFor(() => {
        expect(screen.getByRole('searchbox', { name: 'Search emoji' })).toHaveFocus();
      });
    });

    it.each([
      ['ArrowDown', 'One'],
      ['ArrowUp', 'Five'],
    ])('enters a pointer-opened inputless grid with %s', async (key, itemName) => {
      const { user } = await render(<GridMenu defaultOpen={false} inputless />);
      const trigger = screen.getByRole('button', { name: 'Emoji' });

      await user.click(trigger);
      const grid = await screen.findByRole('grid');
      await act(async () => {
        await waitSingleFrame();
      });
      expect(trigger).toHaveFocus();

      await user.keyboard(`[${key}]`);

      const item = screen.getByRole('gridcell', { name: itemName });
      expect(grid).toHaveFocus();
      expect(grid).toHaveAttribute('aria-activedescendant', item.id);
    });

    it.each(['ArrowLeft', 'ArrowRight'])(
      'keeps focus on the trigger when pressing %s in a pointer-opened inputless grid',
      async (key) => {
        const { user } = await render(<GridMenu defaultOpen={false} inputless />);
        const trigger = screen.getByRole('button', { name: 'Emoji' });

        await user.click(trigger);
        const grid = await screen.findByRole('grid');
        await act(async () => {
          await waitSingleFrame();
        });

        await user.keyboard(`[${key}]`);

        expect(trigger).toHaveFocus();
        expect(grid).not.toHaveAttribute('aria-activedescendant');
      },
    );

    it('uses grid semantics and navigates across rows and columns', async () => {
      const { user } = await render(<GridMenu />);
      const input = screen.getByRole('searchbox', { name: 'Search emoji' });
      const cells = screen.getAllByRole('gridcell');

      expect(screen.getByRole('grid')).toBeVisible();
      expect(screen.queryByRole('menu')).toBe(null);
      expect(screen.getAllByRole('row')).toHaveLength(2);
      expect(cells).toHaveLength(5);
      await waitFor(() => {
        expect(input).toHaveFocus();
      });

      await user.keyboard('[ArrowDown]');
      expect(input).toHaveAttribute('aria-activedescendant', cells[0].id);

      await user.keyboard('[ArrowRight]');
      expect(input).toHaveAttribute('aria-activedescendant', cells[1].id);

      await user.keyboard('[ArrowDown]');
      expect(input).toHaveAttribute('aria-activedescendant', cells[4].id);

      await user.keyboard('[ArrowLeft]');
      expect(input).toHaveAttribute('aria-activedescendant', cells[3].id);

      await user.keyboard('[ArrowUp]');
      expect(input).toHaveAttribute('aria-activedescendant', cells[0].id);
    });

    it('runs the highlighted grid action with Enter', async () => {
      const onPress = vi.fn();
      const { user } = await render(<GridMenu onPress={onPress} />);
      const input = screen.getByRole('searchbox', { name: 'Search emoji' });
      const cells = screen.getAllByRole('gridcell');
      await waitFor(() => {
        expect(input).toHaveFocus();
      });

      await user.keyboard('[ArrowDown]');
      expect(input).toHaveAttribute('aria-activedescendant', cells[0].id);

      await user.keyboard('[ArrowRight]');
      expect(input).toHaveAttribute('aria-activedescendant', cells[1].id);

      await user.keyboard('[ArrowDown]');
      expect(input).toHaveAttribute('aria-activedescendant', cells[4].id);

      await user.keyboard('[Enter]');

      expect(onPress).toHaveBeenCalledOnce();
    });

    it('navigates between rows after filtering removes other cells', async () => {
      const { user } = await render(
        <FilterMenu.Root grid inline open>
          <FilterMenu.Input aria-label="Search fruit" />
          <FilterMenu.List aria-label="Fruit">
            <FilterMenu.Row>
              <FilterMenu.Item>Apple</FilterMenu.Item>
              <FilterMenu.Item>Banana</FilterMenu.Item>
            </FilterMenu.Row>
            <FilterMenu.Row>
              <FilterMenu.Item>Blueberry</FilterMenu.Item>
              <FilterMenu.Item>Cherry</FilterMenu.Item>
            </FilterMenu.Row>
          </FilterMenu.List>
        </FilterMenu.Root>,
      );
      const input = screen.getByRole('searchbox', { name: 'Search fruit' });

      await user.type(input, 'b');
      await waitFor(() => {
        expect(screen.getAllByRole('gridcell')).toHaveLength(2);
      });
      const cells = screen.getAllByRole('gridcell');

      await user.keyboard('[ArrowDown]');
      expect(input).toHaveAttribute('aria-activedescendant', cells[0].id);

      await user.keyboard('[ArrowDown]');
      expect(input).toHaveAttribute('aria-activedescendant', cells[1].id);
    });

    it.each([
      ['ArrowLeft', 1],
      ['ArrowRight', 3],
    ])('keeps %s on the input when no cell is highlighted', async (key, expectedCaretPosition) => {
      const { user } = await render(<GridMenu />);
      const input = screen.getByRole<HTMLInputElement>('searchbox', { name: 'Search emoji' });

      await user.type(input, 'abc');
      input.setSelectionRange(2, 2);
      await user.keyboard(`[${key}]`);

      expect(input.selectionStart).toBe(expectedCaretPosition);
      expect(input.selectionEnd).toBe(expectedCaretPosition);
      expect(input).not.toHaveAttribute('aria-activedescendant');
    });

    it('steps a full row in a grid whose rows are not two cells wide', async () => {
      // A uniform two-column grid cannot tell DOM row inference apart from the navigator's
      // own two-column fallback, so this fixture uses three.
      const { user } = await render(
        <FilterMenu.Root grid inline open>
          <FilterMenu.Input aria-label="Search actions" />
          <FilterMenu.List aria-label="Actions">
            <FilterMenu.Row>
              <FilterMenu.Item>One</FilterMenu.Item>
              <FilterMenu.Item>Two</FilterMenu.Item>
              <FilterMenu.Item>Three</FilterMenu.Item>
            </FilterMenu.Row>
            <FilterMenu.Row>
              <FilterMenu.Item>Four</FilterMenu.Item>
              <FilterMenu.Item>Five</FilterMenu.Item>
              <FilterMenu.Item>Six</FilterMenu.Item>
            </FilterMenu.Row>
          </FilterMenu.List>
        </FilterMenu.Root>,
      );
      const input = screen.getByRole('searchbox', { name: 'Search actions' });
      const cells = screen.getAllByRole('gridcell');

      await act(async () => {
        input.focus();
      });

      await user.keyboard('[ArrowDown]');
      expect(input).toHaveAttribute('aria-activedescendant', cells[0].id);

      await user.keyboard('[ArrowRight]');
      expect(input).toHaveAttribute('aria-activedescendant', cells[1].id);

      await user.keyboard('[ArrowDown]');
      expect(input).toHaveAttribute('aria-activedescendant', cells[4].id);

      await user.keyboard('[ArrowUp]');
      expect(input).toHaveAttribute('aria-activedescendant', cells[1].id);
    });

    it('wraps within the row instead of stranding the highlight at the first cell', async () => {
      const { user } = await render(<GridMenu />);
      const input = screen.getByRole('searchbox', { name: 'Search emoji' });
      const cells = screen.getAllByRole('gridcell');
      await waitFor(() => {
        expect(input).toHaveFocus();
      });

      await user.keyboard('[ArrowDown]');
      expect(input).toHaveAttribute('aria-activedescendant', cells[0].id);

      // A grid navigates on the horizontal axis, so moving back past the first cell must wrap
      // rather than clear the highlight the way escaping out of a vertical list does.
      await user.keyboard('[ArrowLeft]');
      expect(input).toHaveAttribute('aria-activedescendant', cells[4].id);

      await user.keyboard('[ArrowRight]');
      expect(input).toHaveAttribute('aria-activedescendant', cells[0].id);
    });

    it('navigates a right-to-left grid with the inline-direction arrows', async () => {
      const { user } = await render(
        <DirectionProvider direction="rtl">
          <FilterMenu.Root grid inline open>
            <FilterMenu.Input aria-label="Search actions" />
            <FilterMenu.List aria-label="Actions">
              <FilterMenu.Row>
                <FilterMenu.Item>One</FilterMenu.Item>
                <FilterMenu.Item>Two</FilterMenu.Item>
                <FilterMenu.Item>Three</FilterMenu.Item>
              </FilterMenu.Row>
            </FilterMenu.List>
          </FilterMenu.Root>
        </DirectionProvider>,
      );
      const input = screen.getByRole('searchbox', { name: 'Search actions' });
      const cells = screen.getAllByRole('gridcell');

      await act(async () => {
        input.focus();
      });

      await user.keyboard('[ArrowDown]');
      expect(input).toHaveAttribute('aria-activedescendant', cells[0].id);

      // In RTL the inline-forward key is ArrowLeft.
      await user.keyboard('[ArrowLeft]');
      expect(input).toHaveAttribute('aria-activedescendant', cells[1].id);

      await user.keyboard('[ArrowRight]');
      expect(input).toHaveAttribute('aria-activedescendant', cells[0].id);

      // Moving back past the first cell wraps; it must not strand the highlight.
      await user.keyboard('[ArrowRight]');
      expect(input).toHaveAttribute('aria-activedescendant', cells[2].id);
    });

    it('leaves an item outside a row as a plain menu item', async () => {
      await render(
        <FilterMenu.Root grid inline open>
          <FilterMenu.List aria-label="Actions">
            <FilterMenu.Row>
              <FilterMenu.Item>One</FilterMenu.Item>
            </FilterMenu.Row>
            <FilterMenu.Item>Loose</FilterMenu.Item>
          </FilterMenu.List>
        </FilterMenu.Root>,
      );

      // A `gridcell` has to be owned by a row, so an item outside one must not claim the role.
      expect(screen.getByRole('gridcell', { name: 'One' })).toBeVisible();
      expect(screen.getByRole('menuitem', { name: 'Loose' })).toBeVisible();
    });

    it('ignores arrow keys that bubble out of a control inside the grid', async () => {
      const { user } = await render(
        <FilterMenu.Root grid inline open>
          <FilterMenu.Input aria-label="Search actions" />
          <FilterMenu.List aria-label="Actions">
            <FilterMenu.Row>
              <FilterMenu.Item>One</FilterMenu.Item>
            </FilterMenu.Row>
            <FilterMenu.Row>
              <FilterMenu.Item>Two</FilterMenu.Item>
            </FilterMenu.Row>
            <input aria-label="Nested" data-testid="nested" />
          </FilterMenu.List>
        </FilterMenu.Root>,
      );
      const input = screen.getByRole('searchbox', { name: 'Search actions' });
      const cells = screen.getAllByRole('gridcell');

      await act(async () => {
        input.focus();
      });
      await user.keyboard('[ArrowDown]');
      expect(input).toHaveAttribute('aria-activedescendant', cells[0].id);

      // The key belongs to the nested control, exactly as it does outside grid mode.
      await user.click(screen.getByTestId('nested'));
      await user.keyboard('[ArrowDown]');

      expect(input).toHaveAttribute('aria-activedescendant', cells[0].id);
    });

    it('keeps disabled cells reachable during vertical grid navigation', async () => {
      const { user } = await render(
        <FilterMenu.Root grid inline open>
          <FilterMenu.Input aria-label="Search actions" />
          <FilterMenu.List aria-label="Actions">
            <FilterMenu.Row>
              <FilterMenu.Item>One</FilterMenu.Item>
            </FilterMenu.Row>
            <FilterMenu.Row>
              <FilterMenu.Item disabled>Two</FilterMenu.Item>
            </FilterMenu.Row>
          </FilterMenu.List>
        </FilterMenu.Root>,
      );
      const input = screen.getByRole('searchbox', { name: 'Search actions' });
      const cells = screen.getAllByRole('gridcell');

      await act(async () => {
        input.focus();
      });
      await user.keyboard('[ArrowDown]');
      expect(input).toHaveAttribute('aria-activedescendant', cells[0].id);

      await user.keyboard('[ArrowDown]');
      expect(input).toHaveAttribute('aria-activedescendant', cells[1].id);
    });
  });
});
