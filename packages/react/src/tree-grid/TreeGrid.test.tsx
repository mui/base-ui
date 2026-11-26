import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer, isJSDOM, waitSingleFrame } from '#test-utils';
import { DirectionProvider } from '../direction-provider';
import { Field } from '../field';
import { Menu } from '../menu';
import { Select } from '../select';
import { Switch } from '../switch';
import { TreeGrid } from '.';
import { Tree } from '../tree';
import type { TreeDefaultItem } from '../tree/store/types';

const { render } = createRenderer();

interface Item {
  id: string;
  label: string;
  children?: Item[];
}

const ITEMS: Item[] = [
  {
    id: 'documents',
    label: 'Documents',
    children: [
      { id: 'resume', label: 'Resume' },
      { id: 'cover-letter', label: 'Cover Letter' },
    ],
  },
  { id: 'music', label: 'Music' },
];

function TestTree(props: {
  defaultExpandedItems?: string[] | undefined;
  direction?: 'ltr' | 'rtl' | undefined;
  onItemHighlighted?: TreeGrid.Root.Props['onItemHighlighted'];
}) {
  const grid = (
    <TreeGrid.Root
      items={ITEMS}
      multiple="opt-in"
      defaultExpandedItems={props.defaultExpandedItems}
      onItemHighlighted={props.onItemHighlighted}
    >
      <TreeGrid.Table aria-label="Files">
        {(item: Item) => (
          <TreeGrid.Row itemId={item.id} data-testid={`row-${item.id}`}>
            <TreeGrid.Cell>
              <TreeGrid.RowExpansionTrigger />
              <TreeGrid.RowCheckbox data-testid={`checkbox-${item.id}`}>
                <TreeGrid.RowCheckboxIndicator />
              </TreeGrid.RowCheckbox>
              {item.label}
              <TreeGrid.CellButton style={{ display: 'none' }}>Hidden action</TreeGrid.CellButton>
              <TreeGrid.CellButton data-testid={`action-${item.id}`}>Info</TreeGrid.CellButton>
            </TreeGrid.Cell>
          </TreeGrid.Row>
        )}
      </TreeGrid.Table>
    </TreeGrid.Root>
  );

  return props.direction ? (
    <DirectionProvider direction={props.direction}>{grid}</DirectionProvider>
  ) : (
    grid
  );
}

const FLAT_ITEMS: Item[] = [
  { id: 'documents', label: 'Documents' },
  { id: 'music', label: 'Music' },
];

// Renders `children` as the controls of the first of two leaf rows.
function SingleRowTree(props: {
  children: React.ReactNode;
  direction?: 'ltr' | 'rtl' | undefined;
}) {
  return (
    <DirectionProvider direction={props.direction ?? 'ltr'}>
      <TreeGrid.Root items={FLAT_ITEMS}>
        <TreeGrid.Table aria-label="Files">
          {(item: Item) => (
            <TreeGrid.Row itemId={item.id} data-testid={`row-${item.id}`}>
              <TreeGrid.Cell>
                {item.label}
                {item.id === 'documents' ? props.children : null}
              </TreeGrid.Cell>
            </TreeGrid.Row>
          )}
        </TreeGrid.Table>
      </TreeGrid.Root>
    </DirectionProvider>
  );
}

function press(element: HTMLElement, key: string) {
  fireEvent.keyDown(element, { key });
}

describe('Tree', () => {
  it('exposes the expansion trigger without adding it to the controls', async () => {
    await render(<TestTree />);

    const trigger = screen.getByRole('button', { name: 'Expand Documents' });
    expect(trigger).toHaveAttribute('tabindex', '-1');

    fireEvent.click(trigger);

    expect(trigger).toHaveAccessibleName('Collapse Documents');
    // The row carries the state; the trigger's label already names the action.
    expect(trigger).not.toHaveAttribute('aria-expanded');
    expect(screen.getByTestId('row-documents')).toHaveAttribute('aria-expanded', 'true');
  });

  it('lets aria-label replace the built-in control names', async () => {
    await render(
      <TreeGrid.Root items={ITEMS} multiple="opt-in">
        <TreeGrid.Table aria-label="Files">
          {(item) => (
            <TreeGrid.Row itemId={item.id}>
              <TreeGrid.Cell>
                <TreeGrid.RowCheckbox aria-label={`Sélectionner ${item.label}`} />
                <TreeGrid.RowExpansionTrigger
                  render={(props, state) => (
                    <button
                      {...props}
                      aria-label={`${state.expanded ? 'Réduire' : 'Développer'} ${item.label}`}
                    />
                  )}
                />
                {item.label}
              </TreeGrid.Cell>
            </TreeGrid.Row>
          )}
        </TreeGrid.Table>
      </TreeGrid.Root>,
    );

    const trigger = screen.getByRole('button', { name: 'Développer Documents' });
    expect(screen.getByRole('checkbox', { name: 'Sélectionner Documents' })).toBeInTheDocument();

    fireEvent.click(trigger);
    expect(trigger).toHaveAccessibleName('Réduire Documents');
  });

  it('reports pointer focus on an item control as an item press', async () => {
    const onItemHighlighted = vi.fn();
    await render(<TestTree onItemHighlighted={onItemHighlighted} />);

    const documents = screen.getByTestId('row-documents');
    const musicCheckbox = screen.getByTestId('checkbox-music');
    act(() => documents.focus());
    onItemHighlighted.mockClear();

    fireEvent.mouseDown(musicCheckbox);
    act(() => musicCheckbox.focus());

    expect(onItemHighlighted).toHaveBeenCalledWith(
      'music',
      expect.objectContaining({ reason: 'item-press' }),
    );
  });

  it('does not leak an item-press reason after pointer focus returns to the same row', async () => {
    const onItemHighlighted = vi.fn();
    await render(
      <TestTree onItemHighlighted={onItemHighlighted} defaultExpandedItems={['documents']} />,
    );

    const checkbox = screen.getByTestId('checkbox-documents');
    const trigger = screen.getByRole('button', { name: 'Collapse Documents' });
    act(() => checkbox.focus());
    onItemHighlighted.mockClear();

    fireEvent.mouseDown(trigger);
    act(() => screen.getByTestId('row-documents').focus());
    press(screen.getByTestId('row-documents'), 'ArrowDown');

    expect(onItemHighlighted).toHaveBeenLastCalledWith(
      'resume',
      expect.objectContaining({ reason: 'keyboard' }),
    );
  });

  it('prevents native scrolling at vertical navigation boundaries', async () => {
    await render(<TestTree />);

    const firstRow = screen.getByTestId('row-documents');
    const lastAction = screen.getByTestId('action-music');
    act(() => firstRow.focus());
    expect(fireEvent.keyDown(firstRow, { key: 'ArrowUp' })).toBe(false);

    act(() => lastAction.focus());
    expect(fireEvent.keyDown(lastAction, { key: 'ArrowDown' })).toBe(false);
    expect(lastAction).toHaveFocus();
  });

  it('expands, then moves through the controls without wrapping', async () => {
    await render(<TestTree />);

    const row = screen.getByTestId('row-documents');
    const checkbox = screen.getByTestId('checkbox-documents');
    const action = screen.getByTestId('action-documents');

    act(() => row.focus());
    press(row, 'ArrowRight');
    expect(row).toHaveAttribute('aria-expanded', 'true');
    expect(row).toHaveFocus();

    press(row, 'ArrowRight');
    expect(checkbox).toHaveFocus();

    press(checkbox, 'ArrowRight');
    expect(action).toHaveFocus();

    expect(fireEvent.keyDown(action, { key: 'ArrowRight' })).toBe(false);
    expect(action).toHaveFocus();

    press(action, 'ArrowLeft');
    expect(checkbox).toHaveFocus();

    press(checkbox, 'ArrowLeft');
    expect(row).toHaveFocus();

    press(row, 'ArrowLeft');
    expect(row).toHaveAttribute('aria-expanded', 'false');
    expect(row).toHaveFocus();
  });

  it('does not enter the controls with the backward arrow on a root row', async () => {
    await render(<TestTree />);

    const row = screen.getByTestId('row-music');
    act(() => row.focus());
    press(row, 'ArrowLeft');

    expect(row).toHaveFocus();
  });

  it('leaves modified horizontal arrows untouched', async () => {
    await render(<TestTree />);

    const row = screen.getByTestId('row-documents');
    act(() => row.focus());
    expect(fireEvent.keyDown(row, { key: 'ArrowRight', ctrlKey: true })).toBe(true);
    expect(row).toHaveAttribute('aria-expanded', 'false');
    expect(row).toHaveFocus();

    const checkbox = screen.getByTestId('checkbox-documents');
    act(() => checkbox.focus());
    expect(fireEvent.keyDown(checkbox, { key: 'ArrowRight', metaKey: true })).toBe(true);
    expect(fireEvent.keyDown(checkbox, { key: 'ArrowDown', shiftKey: true })).toBe(true);
    expect(checkbox).toHaveFocus();
  });

  it('moves to the parent with the backward arrow on a nested row', async () => {
    await render(<TestTree defaultExpandedItems={['documents']} />);

    const child = screen.getByTestId('row-resume');
    act(() => child.focus());
    press(child, 'ArrowLeft');

    expect(screen.getByTestId('row-documents')).toHaveFocus();
  });

  it('moves to another row with vertical arrows from a control', async () => {
    await render(<TestTree />);

    const action = screen.getByTestId('action-documents');
    act(() => action.focus());
    press(action, 'ArrowDown');

    expect(screen.getByTestId('row-music')).toHaveFocus();
  });

  it('moves to the first and last control with Home and End', async () => {
    await render(<TestTree />);

    const checkbox = screen.getByTestId('checkbox-music');
    const action = screen.getByTestId('action-music');
    act(() => action.focus());
    press(action, 'Home');
    expect(checkbox).toHaveFocus();

    press(checkbox, 'End');
    expect(action).toHaveFocus();
  });

  it('keeps typeahead and selection on the row', async () => {
    await render(<TestTree />);

    const action = screen.getByTestId('action-documents');
    act(() => action.focus());
    expect(fireEvent.keyDown(action, { key: 'm' })).toBe(true);
    expect(fireEvent.keyDown(action, { key: ' ' })).toBe(true);

    expect(action).toHaveFocus();
    expect(screen.getByTestId('row-documents')).toHaveAttribute('aria-selected', 'false');
  });

  it('returns to the row with Escape', async () => {
    await render(<TestTree />);

    const action = screen.getByTestId('action-music');
    act(() => action.focus());
    expect(fireEvent.keyDown(action, { key: 'Escape' })).toBe(false);

    expect(screen.getByTestId('row-music')).toHaveFocus();
  });

  it('navigates away from a focused checkbox whose item becomes disabled', async () => {
    function Example({ disabled }: { disabled: boolean }) {
      return (
        <TreeGrid.Root
          items={[
            { id: 'documents', label: 'Documents', disabled },
            { id: 'music', label: 'Music' },
          ]}
          multiple="opt-in"
        >
          <TreeGrid.Table>
            {(item: TreeDefaultItem) => (
              <TreeGrid.Row itemId={item.id} data-testid={`row-${item.id}`}>
                <TreeGrid.Cell>
                  <TreeGrid.RowCheckbox data-testid={`checkbox-${item.id}`} />
                  {item.label}
                </TreeGrid.Cell>
              </TreeGrid.Row>
            )}
          </TreeGrid.Table>
        </TreeGrid.Root>
      );
    }

    const { setProps } = await render(<Example disabled={false} />);
    const checkbox = screen.getByTestId('checkbox-documents');
    act(() => checkbox.focus());
    await setProps({ disabled: true });
    expect(checkbox).toHaveFocus();

    press(checkbox, 'Escape');
    expect(screen.getByTestId('row-documents')).toHaveFocus();

    act(() => checkbox.focus());
    press(checkbox, 'Home');
    expect(screen.getByTestId('row-documents')).toHaveFocus();

    act(() => checkbox.focus());
    press(checkbox, 'ArrowDown');
    expect(screen.getByTestId('row-music')).toHaveFocus();
  });

  it('leaves Escape to a control that handles it', async () => {
    await render(
      <SingleRowTree>
        <TreeGrid.CellButton
          data-testid="action"
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault();
            }
          }}
        >
          Close
        </TreeGrid.CellButton>
      </SingleRowTree>,
    );

    const action = screen.getByTestId('action');
    act(() => action.focus());
    press(action, 'Escape');

    expect(action).toHaveFocus();
  });

  it('skips disabled and hidden controls', async () => {
    await render(
      <SingleRowTree>
        <fieldset disabled>
          <TreeGrid.CellButton data-testid="fieldset-disabled">Disabled</TreeGrid.CellButton>
        </fieldset>
        <span hidden>
          <TreeGrid.CellButton>Hidden</TreeGrid.CellButton>
        </span>
        <span aria-hidden="true">
          <TreeGrid.CellButton>ARIA hidden</TreeGrid.CellButton>
        </span>
        <span ref={(element) => element?.setAttribute('inert', '')}>
          <TreeGrid.CellButton>Inert</TreeGrid.CellButton>
        </span>
        <Field.Root disabled>
          <TreeGrid.RowCheckbox />
        </Field.Root>
        <TreeGrid.CellButton data-testid="action">Action</TreeGrid.CellButton>
      </SingleRowTree>,
    );

    const row = screen.getByTestId('row-documents');
    act(() => row.focus());
    press(row, 'ArrowRight');

    expect(screen.getByTestId('action')).toHaveFocus();
  });

  it('keeps a disabled button that remains focusable in the navigation', async () => {
    const onClick = vi.fn();
    await render(
      <SingleRowTree>
        <TreeGrid.CellButton disabled onClick={onClick} data-testid="disabled">
          Disabled
        </TreeGrid.CellButton>
      </SingleRowTree>,
    );

    const row = screen.getByTestId('row-documents');
    const button = screen.getByTestId('disabled');
    act(() => row.focus());
    press(row, 'ArrowRight');
    expect(button).toHaveFocus();
    expect(button).toHaveAttribute('aria-disabled', 'true');

    press(button, 'Enter');
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();

    press(button, 'ArrowLeft');
    expect(row).toHaveFocus();

    act(() => button.focus());
    press(button, 'ArrowDown');
    expect(screen.getByTestId('row-music')).toHaveFocus();
  });

  it('keeps a disabled button focusable through the render prop', async () => {
    await render(
      <SingleRowTree>
        <TreeGrid.CellButton disabled render={<button type="button" />} data-testid="focusable">
          Focusable
        </TreeGrid.CellButton>
        <TreeGrid.CellButton
          disabled
          focusableWhenDisabled={false}
          render={<button type="button" />}
          data-testid="unfocusable"
        >
          Unfocusable
        </TreeGrid.CellButton>
      </SingleRowTree>,
    );

    const focusable = screen.getByTestId<HTMLButtonElement>('focusable');
    const unfocusable = screen.getByTestId<HTMLButtonElement>('unfocusable');
    expect(focusable.disabled).toBe(false);
    expect(unfocusable.disabled).toBe(true);

    act(() => focusable.focus());
    expect(fireEvent.keyDown(focusable, { key: 'ArrowRight' })).toBe(false);
    expect(focusable).toHaveFocus();
  });

  it('updates the native disabled state of a rendered button', async () => {
    function DisabledTrigger(props: { focusableWhenDisabled: boolean }) {
      return (
        <SingleRowTree>
          <TreeGrid.CellButton
            disabled
            focusableWhenDisabled={props.focusableWhenDisabled}
            render={<button type="button" />}
            data-testid="native"
          >
            Native
          </TreeGrid.CellButton>
          <Menu.Root>
            <TreeGrid.CellButton
              disabled
              focusableWhenDisabled={props.focusableWhenDisabled}
              render={<Menu.Trigger />}
              data-testid="trigger"
            >
              Actions
            </TreeGrid.CellButton>
          </Menu.Root>
        </SingleRowTree>
      );
    }

    const { setProps } = await render(<DisabledTrigger focusableWhenDisabled />);
    const native = screen.getByTestId<HTMLButtonElement>('native');
    const trigger = screen.getByTestId<HTMLButtonElement>('trigger');
    expect(native.disabled).toBe(false);
    expect(trigger.disabled).toBe(false);
    expect(trigger).toHaveAttribute('aria-disabled', 'true');

    await setProps({ focusableWhenDisabled: false });
    expect(native.disabled).toBe(true);
    expect(trigger.disabled).toBe(true);

    await setProps({ focusableWhenDisabled: true });
    expect(native.disabled).toBe(false);
    expect(trigger.disabled).toBe(false);
  });

  it('keeps the native disabled state of an enabled rendered button', async () => {
    await render(
      <SingleRowTree>
        <TreeGrid.CellButton render={<button type="button" disabled />} data-testid="action">
          Action
        </TreeGrid.CellButton>
      </SingleRowTree>,
    );

    expect(screen.getByTestId<HTMLButtonElement>('action').disabled).toBe(true);
  });

  it.each([
    { source: 'tree', disabled: true, items: FLAT_ITEMS },
    {
      source: 'item',
      disabled: false,
      items: [{ ...FLAT_ITEMS[0], disabled: true }, FLAT_ITEMS[1]],
    },
  ])(
    'disables the built-in controls while the $source is disabled',
    async ({ disabled, items }) => {
      const onClick = vi.fn();
      await render(
        <TreeGrid.Root items={items} disabled={disabled}>
          <TreeGrid.Table>
            {(item: TreeDefaultItem) => (
              <TreeGrid.Row itemId={item.id}>
                <TreeGrid.Cell>
                  {item.label}
                  {item.id === 'documents' ? (
                    <React.Fragment>
                      <TreeGrid.CellButton onClick={onClick} data-testid="action">
                        Action
                      </TreeGrid.CellButton>
                      <TreeGrid.CellInput aria-label="Name" data-testid="input" />
                      <TreeGrid.CellControl
                        render={<Switch.Root aria-label="Notify" data-testid="switch" />}
                      />
                    </React.Fragment>
                  ) : null}
                </TreeGrid.Cell>
              </TreeGrid.Row>
            )}
          </TreeGrid.Table>
        </TreeGrid.Root>,
      );

      const action = screen.getByTestId('action');
      fireEvent.click(action);
      expect(onClick).not.toHaveBeenCalled();
      expect(action).toHaveAttribute('aria-disabled', 'true');
      expect(action).toHaveAttribute('data-disabled');
      expect(screen.getByTestId('input')).toHaveAttribute('aria-disabled', 'true');
      expect(screen.getByTestId('input')).toHaveAttribute('data-disabled');

      const control = screen.getByTestId('switch');
      expect(control).toHaveAttribute('data-disabled');
      fireEvent.click(control);
      expect(control).toHaveAttribute('aria-checked', 'false');
    },
  );

  it('skips a disabled checkbox, with the arrows and with Tab', async () => {
    const unselectableItems = TreeGrid.createItems(FLAT_ITEMS, {
      getId: (item) => item.id,
      getLabel: (item) => item.label,
      isSelectionDisabled: () => true,
    });
    await render(
      <TreeGrid.Root items={unselectableItems}>
        <TreeGrid.Table>
          {(item: Item) => (
            <TreeGrid.Row itemId={item.id} data-testid={`row-${item.id}`}>
              <TreeGrid.Cell>
                <TreeGrid.RowCheckbox data-testid={`checkbox-${item.id}`} />
                <TreeGrid.CellButton data-testid={`action-${item.id}`}>Info</TreeGrid.CellButton>
              </TreeGrid.Cell>
            </TreeGrid.Row>
          )}
        </TreeGrid.Table>
      </TreeGrid.Root>,
    );

    const row = screen.getByTestId('row-documents');
    act(() => row.focus());
    press(row, 'ArrowRight');

    expect(screen.getByTestId('action-documents')).toHaveFocus();
    expect(screen.getByTestId('checkbox-documents')).toHaveAttribute('tabindex', '-1');
  });

  it('follows slot assignment to order controls in a shadow root', async () => {
    function ReversedSlots(props: { children: React.ReactNode }) {
      const setHost = React.useCallback((host: HTMLSpanElement | null) => {
        if (host == null || host.shadowRoot != null) {
          return;
        }
        const shadowRoot = host.attachShadow({ mode: 'open' });
        for (const name of ['second', 'first']) {
          const slot = host.ownerDocument.createElement('slot');
          slot.name = name;
          shadowRoot.append(slot);
        }
      }, []);
      return <span ref={setHost}>{props.children}</span>;
    }

    await render(
      <SingleRowTree>
        <ReversedSlots>
          <TreeGrid.CellButton slot="first" data-testid="first">
            First
          </TreeGrid.CellButton>
          <TreeGrid.CellButton slot="second" data-testid="second">
            Second
          </TreeGrid.CellButton>
        </ReversedSlots>
      </SingleRowTree>,
    );

    const row = screen.getByTestId('row-documents');
    act(() => row.focus());
    press(row, 'ArrowRight');
    expect(screen.getByTestId('second')).toHaveFocus();

    press(screen.getByTestId('second'), 'ArrowRight');
    expect(screen.getByTestId('first')).toHaveFocus();
  });

  it('leaves unregistered focusable elements out of the navigation', async () => {
    await render(
      <SingleRowTree>
        <button type="button" data-testid="plain">
          Plain
        </button>
        <TreeGrid.CellButton data-testid="action">Action</TreeGrid.CellButton>
      </SingleRowTree>,
    );

    const row = screen.getByTestId('row-documents');
    act(() => row.focus());
    press(row, 'ArrowRight');
    expect(screen.getByTestId('action')).toHaveFocus();

    const plain = screen.getByTestId('plain');
    act(() => plain.focus());
    expect(fireEvent.keyDown(plain, { key: 'ArrowDown' })).toBe(true);
    expect(fireEvent.keyDown(plain, { key: 'Escape' })).toBe(true);
    expect(plain).toHaveFocus();
  });

  it('lets a popup trigger keep the vertical arrows', async () => {
    await render(
      <SingleRowTree>
        <TreeGrid.CellButton aria-haspopup="menu" data-testid="trigger">
          Actions
        </TreeGrid.CellButton>
      </SingleRowTree>,
    );

    const trigger = screen.getByTestId('trigger');
    act(() => trigger.focus());
    expect(fireEvent.keyDown(trigger, { key: 'ArrowDown' })).toBe(true);
    expect(trigger).toHaveFocus();
  });

  it('moves between rows from a button with aria-haspopup="false"', async () => {
    await render(
      <SingleRowTree>
        <TreeGrid.CellButton aria-haspopup="false" data-testid="action">
          Action
        </TreeGrid.CellButton>
      </SingleRowTree>,
    );

    const action = screen.getByTestId('action');
    act(() => action.focus());
    press(action, 'ArrowDown');

    expect(screen.getByTestId('row-music')).toHaveFocus();
  });

  it('moves between rows from a disabled popup trigger', async () => {
    await render(
      <SingleRowTree>
        <TreeGrid.CellButton aria-haspopup="menu" disabled data-testid="trigger">
          Actions
        </TreeGrid.CellButton>
      </SingleRowTree>,
    );

    const trigger = screen.getByTestId('trigger');
    act(() => trigger.focus());
    press(trigger, 'ArrowDown');

    expect(screen.getByTestId('row-music')).toHaveFocus();
  });

  it('reverses horizontal traversal in RTL', async () => {
    await render(<TestTree direction="rtl" />);

    const row = screen.getByTestId('row-music');
    act(() => row.focus());
    press(row, 'ArrowLeft');

    expect(screen.getByTestId('checkbox-music')).toHaveFocus();
  });

  it.skipIf(isJSDOM).each(['ltr', 'rtl'] as const)(
    'scrolls a control reached with the arrows into view horizontally (%s)',
    async (direction) => {
      function renderRow(item: Item) {
        return (
          <TreeGrid.Row itemId={item.id} data-testid={`row-${item.id}`} style={{ width: 600 }}>
            <TreeGrid.Cell style={{ display: 'flex', height: 28 }}>
              {item.label}
              <TreeGrid.CellButton
                data-testid={`action-${item.id}`}
                style={{ marginInlineStart: 'auto' }}
              >
                Info
              </TreeGrid.CellButton>
            </TreeGrid.Cell>
          </TreeGrid.Row>
        );
      }
      await render(
        <DirectionProvider direction={direction}>
          <div dir={direction}>
            <TreeGrid.Root items={FLAT_ITEMS}>
              <div data-testid="scroller" style={{ width: 200, height: 40, overflow: 'auto' }}>
                <TreeGrid.Table aria-label="Files">{renderRow}</TreeGrid.Table>
              </div>
            </TreeGrid.Root>
          </div>
        </DirectionProvider>,
      );

      const scroller = screen.getByTestId('scroller');
      const row = screen.getByTestId('row-documents');
      const action = screen.getByTestId('action-documents');
      act(() => row.focus());
      const scrollTop = scroller.scrollTop;
      press(row, direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight');

      expect(action).toHaveFocus();
      const scrollerRect = scroller.getBoundingClientRect();
      const actionRect = action.getBoundingClientRect();
      expect(actionRect.left).toBeGreaterThanOrEqual(scrollerRect.left);
      expect(actionRect.right).toBeLessThanOrEqual(scrollerRect.left + scroller.clientWidth + 1);
      expect(scroller.scrollTop).toBe(scrollTop);
    },
  );

  it.skipIf(isJSDOM)(
    'scrolls a control into view in a container that only scrolls horizontally',
    async () => {
      await render(
        <TreeGrid.Root items={FLAT_ITEMS}>
          <div
            data-testid="scroller"
            style={{ width: 200, overflowX: 'auto', overflowY: 'hidden' }}
          >
            <TreeGrid.Table aria-label="Files">
              {(item: Item) => (
                <TreeGrid.Row
                  itemId={item.id}
                  data-testid={`row-${item.id}`}
                  style={{ width: 600 }}
                >
                  <TreeGrid.Cell style={{ display: 'flex', height: 28 }}>
                    {item.label}
                    <TreeGrid.CellButton
                      data-testid={`action-${item.id}`}
                      style={{ marginInlineStart: 'auto' }}
                    >
                      Info
                    </TreeGrid.CellButton>
                  </TreeGrid.Cell>
                </TreeGrid.Row>
              )}
            </TreeGrid.Table>
          </div>
        </TreeGrid.Root>,
      );

      const scroller = screen.getByTestId('scroller');
      const row = screen.getByTestId('row-documents');
      act(() => row.focus());
      expect(scroller.scrollLeft).toBe(0);
      press(row, 'ArrowRight');

      const action = screen.getByTestId('action-documents');
      expect(action).toHaveFocus();
      const scrollerRect = scroller.getBoundingClientRect();
      expect(action.getBoundingClientRect().right).toBeLessThanOrEqual(
        scrollerRect.left + scroller.clientWidth + 1,
      );
    },
  );

  describe('TreeGrid.CellInput', () => {
    it.each([
      ['ltr', 'ArrowRight', 'ArrowLeft'],
      ['rtl', 'ArrowLeft', 'ArrowRight'],
    ] as const)(
      'keeps the horizontal arrows in %s until the caret reaches the edge of the text',
      async (direction, nextKey, previousKey) => {
        await render(
          <SingleRowTree direction={direction}>
            <TreeGrid.CellInput
              aria-label="Name"
              data-testid="input"
              defaultValue="Notes"
              dir={direction}
            />
            <TreeGrid.CellButton data-testid="action">Action</TreeGrid.CellButton>
          </SingleRowTree>,
        );

        const input = screen.getByTestId('input') as HTMLInputElement;
        act(() => input.focus());
        input.setSelectionRange(2, 2);
        for (const key of [nextKey, previousKey, 'Home', 'End', 'm', ' ']) {
          expect(fireEvent.keyDown(input, { key })).toBe(true);
        }
        input.setSelectionRange(5, 5);
        expect(fireEvent.keyDown(input, { key: nextKey, shiftKey: true })).toBe(true);
        input.setSelectionRange(0, 5);
        expect(fireEvent.keyDown(input, { key: nextKey })).toBe(true);
        expect(input).toHaveFocus();

        input.setSelectionRange(5, 5);
        press(input, nextKey);
        expect(screen.getByTestId('action')).toHaveFocus();

        act(() => input.focus());
        input.setSelectionRange(0, 0);
        press(input, previousKey);
        expect(screen.getByTestId('row-documents')).toHaveFocus();
      },
    );

    it('follows the text direction of an input whose direction differs from the tree', async () => {
      await render(
        <SingleRowTree direction="rtl">
          <TreeGrid.CellInput aria-label="Name" data-testid="input" defaultValue="abc" dir="ltr" />
          <TreeGrid.CellButton data-testid="action">Action</TreeGrid.CellButton>
        </SingleRowTree>,
      );

      const input = screen.getByTestId('input') as HTMLInputElement;
      act(() => input.focus());
      input.setSelectionRange(0, 0);
      expect(fireEvent.keyDown(input, { key: 'ArrowRight' })).toBe(true);
      input.setSelectionRange(3, 3);
      expect(fireEvent.keyDown(input, { key: 'ArrowLeft' })).toBe(true);
      expect(input).toHaveFocus();

      press(input, 'ArrowRight');
      expect(screen.getByTestId('row-documents')).toHaveFocus();

      act(() => input.focus());
      input.setSelectionRange(0, 0);
      press(input, 'ArrowLeft');
      expect(screen.getByTestId('action')).toHaveFocus();
    });

    // Email and number inputs hide their caret, so the arrows always move it.
    it.each([{ type: 'email' }, { type: 'number' }, { type: 'range' }])(
      'keeps the horizontal arrows in a $type input',
      async ({ type }) => {
        await render(
          <SingleRowTree>
            <TreeGrid.CellInput type={type} aria-label="Value" data-testid="input" />
            <TreeGrid.CellButton data-testid="action">Action</TreeGrid.CellButton>
          </SingleRowTree>,
        );

        const input = screen.getByTestId('input');
        act(() => input.focus());

        expect(fireEvent.keyDown(input, { key: 'ArrowRight' })).toBe(true);
        expect(fireEvent.keyDown(input, { key: 'ArrowLeft' })).toBe(true);
        expect(input).toHaveFocus();
      },
    );

    it('moves between items with the vertical arrows from a single-line input', async () => {
      await render(
        <SingleRowTree>
          <TreeGrid.CellInput aria-label="Name" data-testid="input" />
        </SingleRowTree>,
      );

      const input = screen.getByTestId('input');
      act(() => input.focus());
      press(input, 'ArrowDown');

      expect(screen.getByTestId('row-music')).toHaveFocus();
    });

    it('keeps the vertical arrows in an input with suggestions', async () => {
      await render(
        <SingleRowTree>
          <TreeGrid.CellInput list="suggestions" aria-label="Name" data-testid="input" />
          <datalist id="suggestions">
            <option value="Notes" />
          </datalist>
        </SingleRowTree>,
      );

      const input = screen.getByTestId('input');
      act(() => input.focus());
      expect(fireEvent.keyDown(input, { key: 'ArrowDown' })).toBe(true);
      expect(input).toHaveFocus();
    });

    it('keeps the vertical arrows in a number input', async () => {
      await render(
        <SingleRowTree>
          <TreeGrid.CellInput type="number" aria-label="Count" data-testid="input" />
        </SingleRowTree>,
      );

      const input = screen.getByTestId('input');
      act(() => input.focus());
      expect(fireEvent.keyDown(input, { key: 'ArrowDown' })).toBe(true);
      expect(input).toHaveFocus();
    });

    it('keeps a disabled input focusable and in the navigation by default', async () => {
      await render(
        <SingleRowTree>
          <TreeGrid.CellInput
            disabled
            required
            readOnly={false}
            aria-label="Name"
            data-testid="input"
            defaultValue="Notes"
          />
          <TreeGrid.CellButton data-testid="action">Action</TreeGrid.CellButton>
        </SingleRowTree>,
      );

      const row = screen.getByTestId('row-documents');
      const input = screen.getByTestId<HTMLInputElement>('input');
      expect(input.disabled).toBe(false);
      expect(input.readOnly).toBe(true);
      expect(input.willValidate).toBe(false);
      expect(input).toHaveAttribute('aria-disabled', 'true');
      expect(input).toHaveAttribute('data-disabled');
      expect(input).toHaveAttribute('data-focusable');

      act(() => row.focus());
      press(row, 'ArrowRight');
      expect(input).toHaveFocus();
      expect(fireEvent.keyDown(input, { key: 'm' })).toBe(false);
      expect(fireEvent.pointerDown(input)).toBe(false);
      expect(fireEvent.drop(input)).toBe(false);

      // An enabled input keeps End to move its caret.
      press(input, 'End');
      expect(screen.getByTestId('action')).toHaveFocus();
    });

    it.each([
      { name: 'disabled', disabled: true, expected: false },
      { name: 'enabled', disabled: false, expected: true },
    ])('calls the handlers of a $name checkbox input', async ({ disabled, expected }) => {
      const onClick = vi.fn();
      function Example() {
        const [checked, setChecked] = React.useState(false);
        return (
          <SingleRowTree>
            <TreeGrid.CellInput
              type="checkbox"
              disabled={disabled}
              checked={checked}
              onChange={(event) => setChecked(event.currentTarget.checked)}
              onClick={onClick}
              aria-label="Done"
              data-testid="input"
            />
            <output data-testid="state">{String(checked)}</output>
          </SingleRowTree>
        );
      }
      const { user } = await render(<Example />);

      expect(screen.getByTestId('state').textContent).toBe('false');
      await user.click(screen.getByTestId('input'));

      expect(screen.getByTestId('state').textContent).toBe(String(expected));
      expect(onClick).toHaveBeenCalledTimes(expected ? 1 : 0);
    });

    it.each([
      { name: 'disabled', disabled: true, valid: true },
      { name: 'enabled', disabled: false, valid: false },
    ])('validates a required checkbox input only while $name', async ({ disabled, valid }) => {
      await render(
        <form data-testid="form">
          <SingleRowTree>
            <TreeGrid.CellInput type="checkbox" required disabled={disabled} aria-label="Done" />
          </SingleRowTree>
        </form>,
      );

      expect(screen.getByTestId<HTMLFormElement>('form').checkValidity()).toBe(valid);
    });

    it('skips a disabled input that is not focusable', async () => {
      await render(
        <SingleRowTree>
          <TreeGrid.CellInput
            disabled
            focusableWhenDisabled={false}
            aria-label="Name"
            data-testid="input"
          />
          <TreeGrid.CellButton data-testid="action">Action</TreeGrid.CellButton>
        </SingleRowTree>,
      );

      const row = screen.getByTestId('row-documents');
      const input = screen.getByTestId<HTMLInputElement>('input');
      expect(input.disabled).toBe(true);
      expect(input).not.toHaveAttribute('aria-disabled');
      expect(input).not.toHaveAttribute('data-focusable');

      act(() => row.focus());
      press(row, 'ArrowRight');
      expect(screen.getByTestId('action')).toHaveFocus();
    });

    it('returns to the row with Escape unless a search field has a value', async () => {
      await render(
        <SingleRowTree>
          <TreeGrid.CellInput type="search" aria-label="Search" data-testid="input" />
        </SingleRowTree>,
      );

      const input = screen.getByTestId('input');
      act(() => input.focus());
      fireEvent.change(input, { target: { value: 'notes' } });
      expect(fireEvent.keyDown(input, { key: 'Escape' })).toBe(true);
      expect(input).toHaveFocus();

      fireEvent.change(input, { target: { value: '' } });
      press(input, 'Escape');
      expect(screen.getByTestId('row-documents')).toHaveFocus();
    });
  });

  describe('TreeGrid.CellControl', () => {
    it('keeps every key by default', async () => {
      await render(
        <SingleRowTree>
          <TreeGrid.CellControl
            render={<span role="slider" aria-valuenow={1} aria-label="Level" />}
            data-testid="slider"
          />
        </SingleRowTree>,
      );

      const row = screen.getByTestId('row-documents');
      act(() => row.focus());
      press(row, 'ArrowRight');
      const slider = screen.getByTestId('slider');
      expect(slider).toHaveFocus();

      for (const key of ['ArrowLeft', 'ArrowRight', 'ArrowDown', 'Home', 'Escape']) {
        expect(fireEvent.keyDown(slider, { key })).toBe(true);
      }
      expect(slider).toHaveFocus();
    });

    it('keeps clicks away from the item', async () => {
      await render(
        <TreeGrid.Root items={FLAT_ITEMS}>
          <TreeGrid.Table>
            {(item: Item) => (
              <TreeGrid.Row itemId={item.id} data-testid={`row-${item.id}`}>
                <TreeGrid.Cell>
                  {item.label}
                  <TreeGrid.CellControl data-testid={`control-${item.id}`}>
                    <span>Widget</span>
                  </TreeGrid.CellControl>
                </TreeGrid.Cell>
              </TreeGrid.Row>
            )}
          </TreeGrid.Table>
        </TreeGrid.Root>,
      );

      const control = screen.getByTestId('control-music');
      fireEvent.click(control.querySelector('span')!);
      expect(screen.getByTestId('row-music')).toHaveAttribute('aria-selected', 'false');
    });

    it('hands key groups to the tree with controlKeys', async () => {
      await render(
        <SingleRowTree>
          <TreeGrid.CellControl
            render={<span role="slider" aria-valuenow={1} aria-label="Level" />}
            controlKeys={{ vertical: 'tree', escape: 'tree' }}
            data-testid="slider"
          />
        </SingleRowTree>,
      );

      const slider = screen.getByTestId('slider');
      act(() => slider.focus());
      expect(fireEvent.keyDown(slider, { key: 'ArrowRight' })).toBe(true);
      press(slider, 'Escape');
      expect(screen.getByTestId('row-documents')).toHaveFocus();

      act(() => slider.focus());
      press(slider, 'ArrowDown');
      expect(screen.getByTestId('row-music')).toHaveFocus();
    });
  });

  describe('tab sequence', () => {
    function TabTree(props: { children?: React.ReactNode }) {
      return (
        <React.Fragment>
          <button type="button">Before</button>
          <TreeGrid.Root items={ITEMS} multiple="opt-in">
            <TreeGrid.Table aria-label="Files">
              {(item: Item) => (
                <TreeGrid.Row itemId={item.id} data-testid={`tab-row-${item.id}`}>
                  <TreeGrid.Cell>
                    <TreeGrid.RowCheckbox data-testid={`tab-checkbox-${item.id}`} />
                    <TreeGrid.CellButton data-testid={`tab-action-${item.id}`}>
                      Info
                    </TreeGrid.CellButton>
                    {props.children}
                  </TreeGrid.Cell>
                </TreeGrid.Row>
              )}
            </TreeGrid.Table>
          </TreeGrid.Root>
          <button type="button">After</button>
        </React.Fragment>
      );
    }

    it('walks the controls of the tab stop row, then leaves the tree', async () => {
      const { user } = await render(<TabTree />);

      expect(screen.getByTestId('tab-checkbox-music')).toHaveAttribute('tabindex', '-1');
      expect(screen.getByTestId('tab-action-music')).toHaveAttribute('tabindex', '-1');

      await user.tab();
      expect(screen.getByRole('button', { name: 'Before' })).toHaveFocus();
      await user.tab();
      expect(screen.getByTestId('tab-row-documents')).toHaveFocus();
      await user.tab();
      expect(screen.getByTestId('tab-checkbox-documents')).toHaveFocus();
      await user.tab();
      expect(screen.getByTestId('tab-action-documents')).toHaveFocus();
      await user.tab();
      expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();

      await user.tab({ shift: true });
      expect(screen.getByTestId('tab-action-documents')).toHaveFocus();
    });

    it('moves the tab stop controls with the focused row', async () => {
      const { user } = await render(<TabTree />);

      act(() => screen.getByTestId('tab-row-documents').focus());
      press(screen.getByTestId('tab-row-documents'), 'ArrowDown');

      expect(screen.getByTestId('tab-action-music')).toHaveAttribute('tabindex', '0');
      expect(screen.getByTestId('tab-action-documents')).toHaveAttribute('tabindex', '-1');

      await user.tab();
      expect(screen.getByTestId('tab-checkbox-music')).toHaveFocus();
    });

    it('keeps the tab stop on the last focused row after focus leaves the tree', async () => {
      const { user } = await render(<TabTree />);

      act(() => screen.getByTestId('tab-action-music').focus());
      act(() => screen.getByRole('button', { name: 'After' }).focus());

      expect(screen.getByTestId('tab-row-music')).toHaveAttribute('tabindex', '0');
      expect(screen.getByTestId('tab-row-documents')).toHaveAttribute('tabindex', '-1');

      act(() => screen.getByRole('button', { name: 'Before' }).focus());
      await user.tab();
      expect(screen.getByTestId('tab-row-music')).toHaveFocus();
    });

    it('lets a control leave the tab sequence with tabIndex={-1}', async () => {
      await render(
        <SingleRowTree>
          <TreeGrid.CellButton tabIndex={-1} data-testid="action">
            Action
          </TreeGrid.CellButton>
        </SingleRowTree>,
      );

      const action = screen.getByTestId('action');
      expect(action).toHaveAttribute('tabindex', '-1');

      const row = screen.getByTestId('row-documents');
      act(() => row.focus());
      press(row, 'ArrowRight');
      expect(action).toHaveFocus();
    });

    it('updates controls added after mount', async () => {
      function DynamicControls() {
        const [showAction, setShowAction] = React.useState(false);
        return (
          <React.Fragment>
            <button type="button" onClick={() => setShowAction(true)}>
              Add action
            </button>
            <TreeGrid.Root items={ITEMS}>
              <TreeGrid.Table aria-label="Files">
                {(item: Item) => (
                  <TreeGrid.Row itemId={item.id} data-testid={`dynamic-row-${item.id}`}>
                    <TreeGrid.Cell>
                      {item.label}
                      {showAction && item.id === 'music' ? (
                        <TreeGrid.CellButton data-testid="dynamic-action">Info</TreeGrid.CellButton>
                      ) : null}
                    </TreeGrid.Cell>
                  </TreeGrid.Row>
                )}
              </TreeGrid.Table>
            </TreeGrid.Root>
          </React.Fragment>
        );
      }

      await render(<DynamicControls />);
      fireEvent.click(screen.getByRole('button', { name: 'Add action' }));
      const action = screen.getByTestId('dynamic-action');
      expect(action).toHaveAttribute('tabindex', '-1');

      const row = screen.getByTestId('dynamic-row-music');
      act(() => row.focus());
      expect(action).toHaveAttribute('tabindex', '0');
      press(row, 'ArrowRight');
      expect(action).toHaveFocus();
    });
  });

  it('returns focus to the row when a focused control unmounts', async () => {
    function RetryTree() {
      const [failed, setFailed] = React.useState(true);
      return (
        <SingleRowTree>
          {failed ? (
            <TreeGrid.CellButton data-testid="retry" onClick={() => setFailed(false)}>
              Retry
            </TreeGrid.CellButton>
          ) : null}
        </SingleRowTree>
      );
    }

    await render(<RetryTree />);
    const retry = screen.getByTestId('retry');
    act(() => retry.focus());
    fireEvent.click(retry);
    await waitSingleFrame();

    expect(screen.queryByTestId('retry')).toBeNull();
    expect(screen.getByTestId('row-documents')).toHaveFocus();
  });

  it('returns focus to the row when a focused control swaps its element', async () => {
    function SwapTree() {
      const [swapped, setSwapped] = React.useState(false);
      return (
        <SingleRowTree>
          <TreeGrid.CellControl
            data-testid="swap"
            render={
              swapped ? (
                <span />
              ) : (
                <button type="button" onClick={() => setSwapped(true)}>
                  Swap
                </button>
              )
            }
          />
        </SingleRowTree>
      );
    }

    await render(<SwapTree />);
    const button = screen.getByTestId('swap');
    act(() => button.focus());
    fireEvent.click(button);
    await waitSingleFrame();

    expect(screen.getByTestId('swap').localName).toBe('span');
    expect(screen.getByTestId('row-documents')).toHaveFocus();
  });

  it('leaves focus where it moved before the recovery frame', async () => {
    function RetryTree() {
      const [failed, setFailed] = React.useState(true);
      return (
        <React.Fragment>
          <SingleRowTree>
            {failed ? (
              <TreeGrid.CellButton data-testid="retry" onClick={() => setFailed(false)}>
                Retry
              </TreeGrid.CellButton>
            ) : null}
          </SingleRowTree>
          <button type="button">Status</button>
        </React.Fragment>
      );
    }

    await render(<RetryTree />);
    const retry = screen.getByTestId('retry');
    act(() => retry.focus());
    fireEvent.click(retry);
    expect(screen.queryByTestId('retry')).toBeNull();

    const status = screen.getByRole('button', { name: 'Status' });
    act(() => status.focus());
    await waitSingleFrame();

    expect(status).toHaveFocus();
  });

  it.skipIf(isJSDOM)('moves Tab from a popup to the next control of its row', async () => {
    const { userEvent: browserUser } = await import('vitest/browser');
    await render(
      <React.Fragment>
        <SingleRowTree>
          <Select.Root multiple defaultValue={['a']}>
            <TreeGrid.CellButton render={<Select.Trigger />} data-testid="trigger">
              <Select.Value />
            </TreeGrid.CellButton>
            <Select.Portal>
              <Select.Positioner>
                <Select.Popup>
                  <Select.List>
                    <Select.Item value="a">A</Select.Item>
                    <Select.Item value="b">B</Select.Item>
                  </Select.List>
                </Select.Popup>
              </Select.Positioner>
            </Select.Portal>
          </Select.Root>
          <TreeGrid.CellButton data-testid="next">Add</TreeGrid.CellButton>
        </SingleRowTree>
        <button type="button">After</button>
      </React.Fragment>,
    );

    const trigger = screen.getByTestId('trigger');
    act(() => trigger.focus());
    await act(async () => {
      await browserUser.keyboard('{ArrowDown}');
    });
    await vi.waitFor(() => expect(screen.getByRole('listbox')).toBeInTheDocument());
    await act(async () => {
      await browserUser.keyboard('{Tab}');
    });

    await vi.waitFor(() => expect(screen.getByTestId('next')).toHaveFocus());
  });

  it('ignores presses and focus in content a row portals elsewhere', async () => {
    const onItemHighlighted = vi.fn();
    await render(
      <TreeGrid.Root items={FLAT_ITEMS} multiple="opt-in" onItemHighlighted={onItemHighlighted}>
        <TreeGrid.Table>
          {(item: Item) => (
            <TreeGrid.Row itemId={item.id} data-testid={`row-${item.id}`}>
              <TreeGrid.Cell>
                {item.label}
                {item.id === 'documents'
                  ? ReactDOM.createPortal(
                      <div data-testid="popup">
                        Details
                        <button type="button">Close</button>
                      </div>,
                      document.body,
                    )
                  : null}
              </TreeGrid.Cell>
            </TreeGrid.Row>
          )}
        </TreeGrid.Table>
      </TreeGrid.Root>,
    );

    fireEvent.click(screen.getByTestId('popup'));
    act(() => screen.getByRole('button', { name: 'Close' }).focus());

    expect(screen.getByTestId('row-documents')).toHaveAttribute('aria-selected', 'false');
    expect(onItemHighlighted).not.toHaveBeenCalled();
  });

  it('does not select a row when a nested label or disabled control is pressed', async () => {
    const onSelectedItemsChange = vi.fn();
    await render(
      <TreeGrid.Root
        items={[{ id: 'music', label: 'Music' }]}
        multiple="opt-in"
        onSelectedItemsChange={onSelectedItemsChange}
      >
        <TreeGrid.Table>
          {(item: Item) => (
            <TreeGrid.Row itemId={item.id}>
              <TreeGrid.Cell>
                <label>
                  <input type="checkbox" /> Native option
                </label>
                <button type="button" disabled>
                  Disabled action
                </button>
              </TreeGrid.Cell>
            </TreeGrid.Row>
          )}
        </TreeGrid.Table>
      </TreeGrid.Root>,
    );

    fireEvent.click(screen.getByText('Native option'));
    fireEvent.mouseDown(screen.getByRole('button', { name: 'Disabled action' }));
    fireEvent.click(screen.getByRole('button', { name: 'Disabled action' }));

    expect(onSelectedItemsChange).not.toHaveBeenCalled();
  });

  it('clears the pointer focus reason when a nested control does not take focus', async () => {
    vi.useFakeTimers();
    const onItemHighlighted = vi.fn();

    try {
      await render(
        <TreeGrid.Root items={ITEMS} onItemHighlighted={onItemHighlighted}>
          <TreeGrid.Table>
            {(item: Item) => (
              <TreeGrid.Row itemId={item.id} data-testid={`reason-row-${item.id}`}>
                <TreeGrid.Cell>
                  {item.label}
                  <button type="button" disabled data-testid={`disabled-${item.id}`}>
                    Disabled action
                  </button>
                </TreeGrid.Cell>
              </TreeGrid.Row>
            )}
          </TreeGrid.Table>
        </TreeGrid.Root>,
      );

      act(() => screen.getByTestId('reason-row-documents').focus());
      onItemHighlighted.mockClear();
      fireEvent.mouseDown(screen.getByTestId('disabled-documents'));
      act(() => vi.runAllTimers());
      act(() => screen.getByTestId('reason-row-music').focus());

      expect(onItemHighlighted).toHaveBeenLastCalledWith(
        'music',
        expect.objectContaining({ reason: 'none' }),
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it('exposes selection as a real checkbox', async () => {
    await render(<TestTree />);

    const row = screen.getByTestId('row-music');
    const checkbox = screen.getByRole('checkbox', { name: 'Select Music' });
    expect(row).toHaveAttribute('aria-selected', 'false');
    expect(checkbox).toHaveAttribute('aria-checked', 'false');

    fireEvent.click(checkbox);

    expect(row).toHaveAttribute('aria-selected', 'true');
    expect(checkbox).toHaveAttribute('aria-checked', 'true');
  });

  // Collapsed descendants render no input, so a per-row form field could never
  // submit the whole selection.
  it('keeps row checkboxes out of form submission', async () => {
    const inputRef = React.createRef<HTMLInputElement>();
    await render(
      <form data-testid="file-form">
        <TreeGrid.Root items={[{ id: 'music', label: 'Music' }]} multiple="opt-in">
          <TreeGrid.Table>
            {(item: Item) => (
              <TreeGrid.Row itemId={item.id}>
                <TreeGrid.Cell>
                  <TreeGrid.RowCheckbox inputRef={inputRef} />
                </TreeGrid.Cell>
              </TreeGrid.Row>
            )}
          </TreeGrid.Table>
        </TreeGrid.Root>
      </form>,
    );

    fireEvent.click(screen.getByRole('checkbox', { name: 'Select Music' }));

    expect(inputRef.current).toBeInstanceOf(HTMLInputElement);
    expect(inputRef.current).not.toHaveAttribute('name');
    expect([...new FormData(screen.getByTestId('file-form') as HTMLFormElement).keys()]).toEqual(
      [],
    );
  });

  it('keeps row checkboxes from registering as the control of an enclosing field', async () => {
    await render(
      <form data-testid="file-form">
        <Field.Root name="files">
          <TreeGrid.Root
            items={[
              { id: 'music', label: 'Music' },
              { id: 'photos', label: 'Photos' },
            ]}
            multiple="opt-in"
          >
            <TreeGrid.Table>
              {(item: Item) => (
                <TreeGrid.Row itemId={item.id}>
                  <TreeGrid.Cell>
                    <TreeGrid.RowCheckbox />
                  </TreeGrid.Cell>
                </TreeGrid.Row>
              )}
            </TreeGrid.Table>
          </TreeGrid.Root>
        </Field.Root>
      </form>,
    );

    fireEvent.click(screen.getByRole('checkbox', { name: 'Select Music' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select Photos' }));

    const form = screen.getByTestId('file-form') as HTMLFormElement;
    const [first, second] = Array.from(form.querySelectorAll('input[type="checkbox"]'));
    expect(first.id).not.toBe(second.id);
    expect([...new FormData(form).keys()]).toEqual([]);
  });

  it('disables checkboxes when selection is unavailable', async () => {
    const onSelectedItemsChange = vi.fn();
    const selectionLockedItems = TreeGrid.createItems([{ id: 'locked', label: 'Locked' }], {
      getId: (item) => item.id,
      getLabel: (item) => item.label,
      isSelectionDisabled: () => true,
    });

    const { rerender } = await render(
      <TreeGrid.Root
        items={selectionLockedItems}
        multiple="opt-in"
        onSelectedItemsChange={onSelectedItemsChange}
      >
        <TreeGrid.Table>
          {(item) => (
            <TreeGrid.Row itemId={item.id}>
              <TreeGrid.Cell>
                <TreeGrid.RowCheckbox />
              </TreeGrid.Cell>
            </TreeGrid.Row>
          )}
        </TreeGrid.Table>
      </TreeGrid.Root>,
    );

    expect(screen.getByRole('checkbox', { name: 'Select Locked' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select Locked' }));
    expect(onSelectedItemsChange).not.toHaveBeenCalled();

    await rerender(
      <TreeGrid.Root items={[{ id: 'music', label: 'Music' }]} multiple="opt-in" disabled>
        <TreeGrid.Table>
          {(item: Item) => (
            <TreeGrid.Row itemId={item.id}>
              <TreeGrid.Cell>
                <TreeGrid.RowCheckbox />
              </TreeGrid.Cell>
            </TreeGrid.Row>
          )}
        </TreeGrid.Table>
      </TreeGrid.Root>,
    );
    expect(screen.getByRole('checkbox', { name: 'Select Music' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('updates row and control names when an item label changes', async () => {
    function Example({ label }: { label: string }) {
      return (
        <TreeGrid.Root
          items={[
            {
              id: 'documents',
              label,
              children: [{ id: 'child', label: 'Child' }],
            },
          ]}
          multiple="opt-in"
        >
          <TreeGrid.Table>
            {(item: Item) =>
              item.id === 'documents' ? (
                <TreeGrid.Row itemId="documents">
                  <TreeGrid.Cell>
                    <TreeGrid.RowExpansionTrigger />
                    <TreeGrid.RowCheckbox />
                    {item.label}
                  </TreeGrid.Cell>
                </TreeGrid.Row>
              ) : null
            }
          </TreeGrid.Table>
        </TreeGrid.Root>
      );
    }

    const { rerender } = await render(<Example label="Documents" />);
    expect(screen.getByRole('row')).toHaveAccessibleName('Documents');
    expect(screen.getByRole('button')).toHaveAccessibleName('Expand Documents');
    expect(screen.getByRole('checkbox')).toHaveAccessibleName('Select Documents');

    await rerender(<Example label="Docs" />);
    expect(screen.getByRole('row')).toHaveAccessibleName('Docs');
    expect(screen.getByRole('button')).toHaveAccessibleName('Expand Docs');
    expect(screen.getByRole('checkbox')).toHaveAccessibleName('Select Docs');
  });

  it('reflects propagated selection with native checkbox states', async () => {
    await render(<TestTree defaultExpandedItems={['documents']} />);

    const parent = screen.getByRole('checkbox', { name: 'Select Documents' });
    const child = screen.getByRole('checkbox', { name: 'Select Resume' });

    fireEvent.click(child);

    expect(child).toHaveAttribute('aria-checked', 'true');
    expect(parent).toHaveAttribute('aria-checked', 'mixed');

    fireEvent.click(parent);

    expect(parent).toHaveAttribute('aria-checked', 'true');
    expect(child).toHaveAttribute('aria-checked', 'true');
  });

  it('walks hierarchies deeper than the call stack', async () => {
    const depth = 20000;
    let root: Item = { id: `n${depth - 1}`, label: 'Needle' };
    for (let index = depth - 2; index >= 0; index -= 1) {
      root = { id: `n${index}`, label: `Node ${index}`, children: [root] };
    }
    const actionsRef = React.createRef<TreeGrid.Root.Actions | null>();
    const onSelectedItemsChange = vi.fn();
    const renderTree = (filterValue: string) => (
      <TreeGrid.FilterProvider value={filterValue}>
        <TreeGrid.Root
          items={[root]}
          multiple="opt-in"
          actionsRef={actionsRef}
          onSelectedItemsChange={onSelectedItemsChange}
        >
          {null}
        </TreeGrid.Root>
      </TreeGrid.FilterProvider>
    );
    const view = await render(renderTree(''));

    act(() => actionsRef.current!.setItemSelection('n0', true));
    expect(onSelectedItemsChange.mock.calls.at(-1)![0]).toHaveLength(depth);

    await view.rerender(renderTree('needle'));
    expect(actionsRef.current!.isItemExpanded('n0')).toBe(true);
    expect(actionsRef.current!.isItemExpanded(`n${depth - 2}`)).toBe(true);
  });
});

describe('checkbox keyboard selection', () => {
  const branch = ['documents', 'resume', 'cover-letter', 'music'];
  const cases = [
    { descendants: true, initial: ['music'], first: branch, second: ['music'] },
    { descendants: false, initial: ['music'], first: ['documents', 'music'], second: ['music'] },
    {
      descendants: true,
      initial: ['resume', 'cover-letter', 'music'],
      first: ['music'],
      second: branch,
    },
    { descendants: true, initial: ['resume', 'music'], first: branch, second: ['music'] },
  ].flatMap((scenario) => ['row', 'checkbox'].map((role) => ({ ...scenario, role })));
  it.each(cases)(
    'uses checkbox propagation for Space on $role (descendants: $descendants, initial: $initial)',
    async ({ role, descendants, initial, first, second }) => {
      const onSelectedItemsChange = vi.fn();
      const { user } = await render(
        <TreeGrid.Root
          items={ITEMS}
          multiple
          defaultSelectedItems={initial}
          checkboxSelectionPropagation={{ parents: true, descendants }}
          onSelectedItemsChange={onSelectedItemsChange}
        >
          <TreeGrid.Table>
            {(item) => (
              <TreeGrid.Row itemId={item.id}>
                <TreeGrid.Cell>
                  <TreeGrid.RowCheckbox />
                  {item.label}
                </TreeGrid.Cell>
              </TreeGrid.Row>
            )}
          </TreeGrid.Table>
        </TreeGrid.Root>,
      );
      const target = screen.getByRole(role, {
        name: role === 'row' ? 'Documents' : 'Select Documents',
      });
      act(() => target.focus());
      await user.keyboard(' ');
      expect(new Set(onSelectedItemsChange.mock.lastCall?.[0])).toEqual(new Set(first));
      expect(target).toHaveFocus();
      await user.keyboard(' ');
      expect(new Set(onSelectedItemsChange.mock.lastCall?.[0])).toEqual(new Set(second));
    },
  );
});

describe('checkbox click selection', () => {
  it.each([
    { target: 'row', multiple: true },
    { target: 'checkbox', multiple: true },
    { target: 'row', multiple: 'opt-in' },
    { target: 'checkbox', multiple: 'opt-in' },
  ] as const)(
    'toggles the item with checkbox propagation on a click on its $target with multiple=$multiple',
    async ({ target, multiple }) => {
      const onSelectedItemsChange = vi.fn();
      const { user } = await render(
        <TreeGrid.Root
          items={ITEMS}
          multiple={multiple}
          defaultSelectedItems={['music']}
          onSelectedItemsChange={onSelectedItemsChange}
        >
          <TreeGrid.Table>
            {(item) => (
              <TreeGrid.Row itemId={item.id}>
                <TreeGrid.Cell>
                  <TreeGrid.RowCheckbox />
                  {item.label}
                </TreeGrid.Cell>
              </TreeGrid.Row>
            )}
          </TreeGrid.Table>
        </TreeGrid.Root>,
      );
      const element =
        target === 'row'
          ? screen.getByRole('row', { name: 'Documents' })
          : screen.getByRole('checkbox', { name: 'Select Documents' });

      await user.click(element);
      expect(new Set(onSelectedItemsChange.mock.lastCall?.[0])).toEqual(
        new Set(['documents', 'resume', 'cover-letter', 'music']),
      );
      await user.click(element);
      expect(onSelectedItemsChange.mock.lastCall?.[0]).toEqual(['music']);
    },
  );

  it('replaces the selection on a click on a row without a checkbox with multiple="opt-in"', async () => {
    const onSelectedItemsChange = vi.fn();
    const { user } = await render(
      <TreeGrid.Root
        items={ITEMS}
        multiple="opt-in"
        defaultSelectedItems={['music']}
        onSelectedItemsChange={onSelectedItemsChange}
      >
        <TreeGrid.Table>
          {(item) => (
            <TreeGrid.Row itemId={item.id}>
              <TreeGrid.Cell>{item.label}</TreeGrid.Cell>
            </TreeGrid.Row>
          )}
        </TreeGrid.Table>
      </TreeGrid.Root>,
    );

    await user.click(screen.getByRole('row', { name: 'Documents' }));
    expect(onSelectedItemsChange.mock.lastCall?.[0]).toEqual(['documents']);
  });

  it('toggles a row with a checkbox on Space with multiple="opt-in"', async () => {
    const onSelectedItemsChange = vi.fn();
    await render(
      <TreeGrid.Root
        items={FLAT_ITEMS}
        multiple="opt-in"
        defaultSelectedItems={['music']}
        onSelectedItemsChange={onSelectedItemsChange}
      >
        <TreeGrid.Table>
          {(item) => (
            <TreeGrid.Row itemId={item.id}>
              <TreeGrid.Cell>
                <TreeGrid.RowCheckbox />
                {item.label}
              </TreeGrid.Cell>
            </TreeGrid.Row>
          )}
        </TreeGrid.Table>
      </TreeGrid.Root>,
    );
    const row = screen.getByRole('row', { name: 'Documents' });
    act(() => row.focus());

    fireEvent.keyDown(row, { key: ' ' });
    expect(onSelectedItemsChange.mock.lastCall?.[0]).toEqual(['documents', 'music']);
  });

  it('keeps the selection when the arrow keys move focus to a row with a checkbox with multiple="opt-in"', async () => {
    const onSelectedItemsChange = vi.fn();
    await render(
      <TreeGrid.Root
        items={FLAT_ITEMS}
        multiple="opt-in"
        defaultSelectedItems={['documents']}
        onSelectedItemsChange={onSelectedItemsChange}
      >
        <TreeGrid.Table>
          {(item) => (
            <TreeGrid.Row itemId={item.id}>
              <TreeGrid.Cell>
                <TreeGrid.RowCheckbox />
                {item.label}
              </TreeGrid.Cell>
            </TreeGrid.Row>
          )}
        </TreeGrid.Table>
      </TreeGrid.Root>,
    );
    const row = screen.getByRole('row', { name: 'Documents' });
    act(() => row.focus());

    fireEvent.keyDown(row, { key: 'ArrowDown' });
    expect(screen.getByRole('row', { name: 'Music' })).toHaveFocus();
    expect(onSelectedItemsChange).not.toHaveBeenCalled();
  });
});

describe('TreeGrid.RowCheckbox', () => {
  it('passes the selection state of its item, without field state, to its state callbacks', async () => {
    const checkboxStates: TreeGrid.RowCheckbox.State[] = [];
    const indicatorStates: TreeGrid.RowCheckboxIndicator.State[] = [];
    await render(
      <TreeGrid.Root
        items={[{ id: 'a', label: 'A' }]}
        multiple="opt-in"
        defaultSelectedItems={['a']}
      >
        <TreeGrid.Table>
          {(item) => (
            <TreeGrid.Row itemId={item.id}>
              <TreeGrid.Cell>
                <TreeGrid.RowCheckbox
                  className={(state) => {
                    checkboxStates.push(state);
                    return undefined;
                  }}
                >
                  <TreeGrid.RowCheckboxIndicator
                    className={(state) => {
                      indicatorStates.push(state);
                      return undefined;
                    }}
                  />
                </TreeGrid.RowCheckbox>
              </TreeGrid.Cell>
            </TreeGrid.Row>
          )}
        </TreeGrid.Table>
      </TreeGrid.Root>,
    );

    expect(checkboxStates.at(-1)).toEqual({ checked: true, indeterminate: false, disabled: false });
    expect(indicatorStates.at(-1)).toEqual({
      checked: true,
      indeterminate: false,
      disabled: false,
      transitionStatus: undefined,
    });
  });
});

describe('TreeGrid roles', () => {
  const items: TreeGrid.DefaultItem[] = [
    { id: 'documents', label: 'Documents', children: [{ id: 'resume', label: 'Resume' }] },
    { id: 'music', label: 'Music' },
  ];

  it('renders a treegrid whose rows have a cell named from its content', async () => {
    await render(
      <TreeGrid.Root items={items} multiple="opt-in">
        <TreeGrid.Table aria-label="Files">
          {(item) => (
            <TreeGrid.Row itemId={item.id}>
              <TreeGrid.Cell>
                <TreeGrid.RowCheckbox />
                {item.label}
                <TreeGrid.CellButton>Info</TreeGrid.CellButton>
              </TreeGrid.Cell>
            </TreeGrid.Row>
          )}
        </TreeGrid.Table>
      </TreeGrid.Root>,
    );

    expect(screen.getByRole('treegrid', { name: 'Files' })).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(2);
    expect(screen.getByRole('row', { name: 'Documents' })).toBeInTheDocument();
    expect(screen.getAllByRole('gridcell')).toHaveLength(2);
    // Keeps the visible text of its controls in its name (label in name).
    expect(screen.getByRole('gridcell', { name: /Documents.*Info/ })).toBeInTheDocument();
    // A single column that is always rendered needs no column metadata.
    expect(screen.getAllByRole('gridcell')[0]).not.toHaveAttribute('aria-colindex');
    expect(screen.queryByRole('treeitem')).toBeNull();
  });

  it.each([
    { name: 'Cell', part: <TreeGrid.Cell />, fix: /Replace <Tree\.Root> with/ },
    { name: 'CellButton', part: <TreeGrid.CellButton />, fix: /Replace <Tree\.Root> with/ },
    { name: 'CellInput', part: <TreeGrid.CellInput />, fix: /Replace <Tree\.Root> with/ },
    { name: 'CellControl', part: <TreeGrid.CellControl />, fix: /Replace <Tree\.Root> with/ },
    {
      name: 'RowCheckbox',
      part: <TreeGrid.RowCheckbox />,
      fix: /Render <Tree\.CheckboxItem> instead/,
    },
    { name: 'CellLink', part: <TreeGrid.CellLink />, fix: /Render <Tree\.LinkItem> instead/ },
  ])('throws when TreeGrid.$name renders in a Tree.Root', async ({ name, part, fix }) => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const view = render(
      <Tree.Root items={items}>
        <Tree.List>
          {(item) => (
            <Tree.Item itemId={item.id}>
              {part}
              {item.label}
            </Tree.Item>
          )}
        </Tree.List>
      </Tree.Root>,
    );
    await expect(view).rejects.toThrow(
      new RegExp(`<TreeGrid\\.${name}> must be placed in <TreeGrid\\.Root>`),
    );
    await expect(view).rejects.toThrow(fix);
  });
});

describe('TreeGrid.RowCheckbox interaction', () => {
  it('selects a range when shift-clicking a checkbox', async () => {
    const onSelectedItemsChange = vi.fn();
    await render(
      <TreeGrid.Root
        items={[
          { id: '1', label: '1' },
          { id: '2', label: '2' },
          { id: '3', label: '3' },
          { id: '4', label: '4' },
        ]}
        multiple="opt-in"
        onSelectedItemsChange={onSelectedItemsChange}
      >
        <TreeGrid.Table>
          {(item) => (
            <TreeGrid.Row itemId={item.id}>
              <TreeGrid.Cell>
                <TreeGrid.RowCheckbox data-testid={`checkbox-${item.id}`} />
                {item.label}
              </TreeGrid.Cell>
            </TreeGrid.Row>
          )}
        </TreeGrid.Table>
      </TreeGrid.Root>,
    );

    fireEvent.click(screen.getByTestId('checkbox-2'));
    expect(onSelectedItemsChange.mock.lastCall?.[0]).toEqual(['2']);
    fireEvent.click(screen.getByTestId('checkbox-4'), { shiftKey: true });

    expect(onSelectedItemsChange.mock.lastCall?.[0]).toEqual(['2', '3', '4']);
  });
});

describe('TreeGrid keyboard (consumer handlers)', () => {
  it.each(['row', 'button'] as const)(
    'does not navigate when a %s keydown handler prevents the Base UI handler',
    async (part) => {
      const preventArrowDown = (
        event: React.KeyboardEvent & { preventBaseUIHandler: () => void },
      ) => {
        if (event.key === 'ArrowDown') {
          event.preventBaseUIHandler();
        }
      };
      await render(
        <TreeGrid.Root
          items={[
            { id: 'a', label: 'A' },
            { id: 'b', label: 'B' },
          ]}
        >
          <TreeGrid.Table>
            {(item: TreeDefaultItem) => (
              <TreeGrid.Row
                itemId={item.id}
                onKeyDown={part === 'row' ? preventArrowDown : undefined}
              >
                <TreeGrid.Cell>
                  {item.label}
                  <TreeGrid.CellButton onKeyDown={part === 'button' ? preventArrowDown : undefined}>
                    Open {item.label}
                  </TreeGrid.CellButton>
                </TreeGrid.Cell>
              </TreeGrid.Row>
            )}
          </TreeGrid.Table>
        </TreeGrid.Root>,
      );

      const focused =
        part === 'row'
          ? screen.getByRole('row', { name: 'A' })
          : screen.getByRole('button', { name: 'Open A' });
      act(() => focused.focus());
      fireEvent.keyDown(focused, { key: 'ArrowDown' });

      expect(focused).toHaveFocus();
    },
  );
});

interface NestedItem {
  id: string;
  label: string;
  children?: NestedItem[];
}

const NESTED_ITEMS: NestedItem[] = [
  { id: '1', label: 'One' },
  { id: '2', label: 'Two' },
];

function nestedRow(itemId: string): HTMLElement {
  return screen.getByTestId(`item-${itemId}`);
}

describe('TreeGrid controls nested in item content', () => {
  function TreeWithButtons(props: { onAction?: (() => void) | undefined }) {
    return (
      <TreeGrid.Root items={NESTED_ITEMS} multiple="opt-in">
        <TreeGrid.Table>
          {(item: NestedItem) => (
            <TreeGrid.Row itemId={item.id} data-testid={`item-${item.id}`}>
              <TreeGrid.Cell>
                {item.label}
                <button type="button" data-testid={`action-${item.id}`} onClick={props.onAction}>
                  Actions
                </button>
              </TreeGrid.Cell>
            </TreeGrid.Row>
          )}
        </TreeGrid.Table>
      </TreeGrid.Root>
    );
  }

  it('leaves Space to a nested button instead of toggling the row', async () => {
    await render(<TreeWithButtons />);

    const button = screen.getByTestId('action-1');
    act(() => {
      nestedRow('1').focus();
      button.focus();
    });

    const event = fireEvent.keyDown(button, { key: ' ' });

    // Not `preventDefault`ed, so the browser still activates the button…
    expect(event).toBe(true);
    // …and the row's selection is untouched.
    expect(nestedRow('1')).toHaveAttribute('aria-selected', 'false');
  });

  it('leaves click activation to a nested button', async () => {
    const onAction = vi.fn();
    await render(<TreeWithButtons onAction={onAction} />);

    fireEvent.click(screen.getByTestId('action-1'));

    expect(onAction).toHaveBeenCalledOnce();
    expect(nestedRow('1')).toHaveAttribute('aria-selected', 'false');
  });

  it('does not expand a row when clicking a nested button', async () => {
    await render(
      <TreeGrid.Root
        items={[{ id: 'parent', label: 'Parent', children: [{ id: 'child', label: 'Child' }] }]}
        expandOnClick
      >
        <TreeGrid.Table>
          {(item: NestedItem) => (
            <TreeGrid.Row itemId={item.id} data-testid={`item-${item.id}`}>
              <TreeGrid.Cell>
                {item.label}
                <button type="button" data-testid={`action-${item.id}`}>
                  Actions
                </button>
              </TreeGrid.Cell>
            </TreeGrid.Row>
          )}
        </TreeGrid.Table>
      </TreeGrid.Root>,
    );

    fireEvent.click(screen.getByTestId('action-parent'));

    expect(nestedRow('parent')).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByTestId('item-child')).toBeNull();
  });

  it('still handles keys pressed on the row itself', async () => {
    await render(<TreeWithButtons />);

    act(() => {
      nestedRow('1').focus();
    });
    fireEvent.keyDown(nestedRow('1'), { key: ' ' });

    expect(nestedRow('1')).toHaveAttribute('aria-selected', 'true');
  });
});

const SIZES: Record<string, string> = {
  documents: '2 items',
  resume: '4 KB',
  'cover-letter': '2 KB',
  music: '9 MB',
};

describe('TreeGrid columns', () => {
  function ColumnsTree(props: {
    header?: boolean | undefined;
    multiple?: boolean | 'opt-in' | undefined;
    onItemHighlighted?: TreeGrid.Root.Props['onItemHighlighted'];
    renderRow?: ((item: Item, cells: React.ReactNode[]) => React.ReactNode[]) | undefined;
  }) {
    const { header = true, renderRow = (_item, cells) => cells } = props;
    return (
      <TreeGrid.Root
        items={ITEMS}
        defaultExpandedItems={['documents']}
        multiple={props.multiple}
        onItemHighlighted={props.onItemHighlighted}
      >
        <TreeGrid.Table aria-label="Files">
          {header ? (
            <TreeGrid.HeaderRow>
              <TreeGrid.HeaderCell>Name</TreeGrid.HeaderCell>
              <TreeGrid.HeaderCell>Size</TreeGrid.HeaderCell>
              <TreeGrid.HeaderCell>Actions</TreeGrid.HeaderCell>
            </TreeGrid.HeaderRow>
          ) : null}
          <TreeGrid.Collection>
            {(item: Item) => (
              <TreeGrid.Row itemId={item.id} data-testid={`row-${item.id}`}>
                {renderRow(item, [
                  <TreeGrid.Cell key="name" data-testid={`name-${item.id}`}>
                    {item.label}
                  </TreeGrid.Cell>,
                  <TreeGrid.Cell key="size" data-testid={`size-${item.id}`}>
                    {SIZES[item.id]}
                  </TreeGrid.Cell>,
                  <TreeGrid.Cell key="actions" data-testid={`actions-${item.id}`}>
                    <TreeGrid.CellButton data-testid={`rename-${item.id}`}>
                      Rename
                    </TreeGrid.CellButton>
                    {item.id === 'music' ? null : (
                      <TreeGrid.CellButton data-testid={`delete-${item.id}`}>
                        Delete
                      </TreeGrid.CellButton>
                    )}
                  </TreeGrid.Cell>,
                ])}
              </TreeGrid.Row>
            )}
          </TreeGrid.Collection>
        </TreeGrid.Table>
      </TreeGrid.Root>
    );
  }

  it('renders the header row before the rows, inside the treegrid', async () => {
    await render(<ColumnsTree />);

    const treegrid = screen.getByRole('treegrid', { name: 'Files' });
    expect(
      Array.from(treegrid.children, (child) => child.getAttribute('data-testid') ?? child.role),
    ).toEqual(['row', 'row-documents', 'row-resume', 'row-cover-letter', 'row-music']);
    expect(screen.getAllByRole('columnheader').map((cell) => cell.textContent)).toEqual([
      'Name',
      'Size',
      'Actions',
    ]);
  });

  it('stops at the cells without a control, then at the controls', async () => {
    await render(<ColumnsTree />);

    const row = screen.getByTestId('row-resume');
    act(() => row.focus());
    let current = row;
    for (const stop of ['name-resume', 'size-resume', 'rename-resume', 'delete-resume']) {
      press(current, 'ArrowRight');
      current = screen.getByTestId(stop);
      expect(current).toHaveFocus();
    }
    press(screen.getByTestId('delete-resume'), 'ArrowRight');
    expect(screen.getByTestId('delete-resume')).toHaveFocus();

    press(screen.getByTestId('delete-resume'), 'Home');
    expect(screen.getByTestId('name-resume')).toHaveFocus();
    press(screen.getByTestId('name-resume'), 'ArrowLeft');
    expect(row).toHaveFocus();
  });

  it('skips a hidden cell', async () => {
    await render(
      <ColumnsTree
        renderRow={(_item, [name, size, actions]) => [
          name,
          <span key="size" style={{ display: 'none' }}>
            {size}
          </span>,
          actions,
        ]}
      />,
    );

    const row = screen.getByTestId('row-resume');
    act(() => row.focus());
    press(row, 'ArrowRight');
    const name = screen.getByTestId('name-resume');
    expect(name).toHaveFocus();
    press(name, 'ArrowRight');

    expect(screen.getByTestId('rename-resume')).toHaveFocus();
  });

  it('does not stop at the cell of a row with a single cell', async () => {
    await render(<SingleRowTree>{null}</SingleRowTree>);

    const row = screen.getByTestId('row-documents');
    act(() => row.focus());
    press(row, 'ArrowRight');

    expect(row).toHaveFocus();
  });

  it('only makes a cell focusable while the keyboard is on it', async () => {
    const { user } = await render(<ColumnsTree />);

    const size = screen.getByTestId('size-resume');
    expect(size).not.toHaveAttribute('tabindex');
    await user.click(size);
    expect(screen.getByTestId('row-resume')).toHaveFocus();

    press(screen.getByTestId('row-resume'), 'ArrowRight');
    press(screen.getByTestId('name-resume'), 'ArrowRight');
    expect(size).toHaveFocus();
    expect(size).toHaveAttribute('tabindex', '-1');

    press(size, 'ArrowRight');
    expect(screen.getByTestId('rename-resume')).toHaveFocus();
    expect(size).not.toHaveAttribute('tabindex');
  });

  it('stays in the column with ArrowUp and ArrowDown', async () => {
    const onItemHighlighted = vi.fn();
    await render(<ColumnsTree onItemHighlighted={onItemHighlighted} />);

    const row = screen.getByTestId('row-documents');
    act(() => row.focus());
    press(row, 'ArrowRight');
    press(screen.getByTestId('name-documents'), 'ArrowRight');
    expect(screen.getByTestId('size-documents')).toHaveFocus();
    onItemHighlighted.mockClear();

    press(screen.getByTestId('size-documents'), 'ArrowDown');
    expect(screen.getByTestId('size-resume')).toHaveFocus();
    expect(screen.getByTestId('row-resume')).toHaveAttribute('data-highlighted');
    expect(onItemHighlighted).toHaveBeenCalledWith(
      'resume',
      expect.objectContaining({ reason: 'keyboard' }),
    );

    press(screen.getByTestId('size-resume'), 'ArrowDown');
    expect(screen.getByTestId('size-cover-letter')).toHaveFocus();
    press(screen.getByTestId('size-cover-letter'), 'ArrowUp');
    expect(screen.getByTestId('size-resume')).toHaveFocus();
  });

  it('moves the selection with ArrowUp and ArrowDown on a cell with multiple="opt-in"', async () => {
    await render(<ColumnsTree multiple="opt-in" />);

    const row = screen.getByTestId('row-resume');
    act(() => row.focus());
    press(row, ' ');
    press(row, 'ArrowRight');
    press(screen.getByTestId('name-resume'), 'ArrowRight');
    expect(screen.getByTestId('size-resume')).toHaveFocus();
    expect(row).toHaveAttribute('aria-selected', 'true');

    press(screen.getByTestId('size-resume'), 'ArrowDown');
    expect(screen.getByTestId('size-cover-letter')).toHaveFocus();
    expect(row).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByTestId('row-cover-letter')).toHaveAttribute('aria-selected', 'true');

    press(screen.getByTestId('size-cover-letter'), 'ArrowUp');
    expect(screen.getByTestId('size-resume')).toHaveFocus();
    expect(row).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('row-cover-letter')).toHaveAttribute('aria-selected', 'false');
  });

  it('moves to the control at the same position, or the last one before it', async () => {
    await render(<ColumnsTree />);

    const deleteResume = screen.getByTestId('delete-resume');
    act(() => deleteResume.focus());
    press(deleteResume, 'ArrowDown');
    expect(screen.getByTestId('delete-cover-letter')).toHaveFocus();

    // The row of Music has no Delete button.
    press(screen.getByTestId('delete-cover-letter'), 'ArrowDown');
    expect(screen.getByTestId('rename-music')).toHaveFocus();
  });

  it('moves to the row when its cell in the column is hidden', async () => {
    await render(
      <ColumnsTree
        renderRow={(item, [name, size, actions]) => [
          name,
          item.id === 'music' ? (
            <span key="size" style={{ display: 'none' }}>
              {size}
            </span>
          ) : (
            size
          ),
          actions,
        ]}
      />,
    );

    const row = screen.getByTestId('row-cover-letter');
    act(() => row.focus());
    press(row, 'ArrowRight');
    press(screen.getByTestId('name-cover-letter'), 'ArrowRight');
    const size = screen.getByTestId('size-cover-letter');
    expect(size).toHaveFocus();
    press(size, 'ArrowDown');

    expect(screen.getByTestId('row-music')).toHaveFocus();
  });

  it('moves to the first and last row of the column with Ctrl+Home and Ctrl+End', async () => {
    await render(<ColumnsTree />);

    const renameResume = screen.getByTestId('rename-resume');
    act(() => renameResume.focus());
    expect(fireEvent.keyDown(renameResume, { key: 'End', ctrlKey: true })).toBe(false);
    expect(screen.getByTestId('rename-music')).toHaveFocus();

    fireEvent.keyDown(screen.getByTestId('rename-music'), { key: 'Home', ctrlKey: true });
    expect(screen.getByTestId('rename-documents')).toHaveFocus();
  });

  it('selects the row with Space on a cell', async () => {
    await render(<ColumnsTree />);

    const row = screen.getByTestId('row-resume');
    act(() => row.focus());
    press(row, 'ArrowRight');
    const name = screen.getByTestId('name-resume');
    expect(name).toHaveFocus();
    expect(row).toHaveAttribute('aria-selected', 'false');

    expect(fireEvent.keyDown(name, { key: ' ' })).toBe(false);

    expect(row).toHaveAttribute('aria-selected', 'true');
    expect(name).toHaveFocus();
  });

  it('returns to the row with Escape on a cell', async () => {
    await render(<ColumnsTree />);

    const row = screen.getByTestId('row-resume');
    act(() => row.focus());
    press(row, 'ArrowRight');
    press(screen.getByTestId('name-resume'), 'Escape');

    expect(row).toHaveFocus();
  });

  it('warns when a row renders a different number of cells than the header row', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await render(
      <ColumnsTree
        renderRow={(item, cells) => (item.id === 'music' ? cells.slice(0, 1) : cells)}
      />,
    );

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('renders 1 cells, but the header row has 3'),
    );
  });

  it('warns when rows of several cells have no column headers', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await render(<ColumnsTree header={false} />);

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('has no column headers'));
  });
});

describe('TreeGrid controls in a disabled row', () => {
  it.each([
    { name: 'can be focused', rowFocusable: true },
    { name: 'cannot be focused', rowFocusable: false },
  ])(
    'lets a press focus a control of a disabled row only when the row $name',
    async ({ rowFocusable }) => {
      const { user } = await render(
        <TreeGrid.Root
          items={[
            { id: 'docs', label: 'Docs' },
            { id: 'about', label: 'About', disabled: true },
          ]}
          itemFocusableWhenDisabled={rowFocusable}
        >
          <TreeGrid.Table aria-label="Pages">
            {(item: TreeDefaultItem) => (
              <TreeGrid.Row itemId={item.id}>
                <TreeGrid.Cell>
                  {item.label}
                  <TreeGrid.CellControl
                    role="slider"
                    aria-label={`Priority of ${item.label}`}
                    aria-valuenow={1}
                  />
                </TreeGrid.Cell>
              </TreeGrid.Row>
            )}
          </TreeGrid.Table>
        </TreeGrid.Root>,
      );
      const control = screen.getByRole('slider', { name: 'Priority of About' });
      expect(control).not.toHaveFocus();

      await user.click(control);

      expect(control.ownerDocument.activeElement === control).toBe(rowFocusable);
    },
  );
});

describe('focus recovery from a popup opened on a row', () => {
  interface MenuItem extends TreeDefaultItem {
    children?: MenuItem[];
  }

  const MENU_ITEMS: MenuItem[] = [
    { id: 'documents', label: 'Documents' },
    { id: 'music', label: 'Music' },
    { id: 'archive', label: 'Archive', children: [{ id: 'old', label: 'Old' }] },
  ];

  // Each row has an actions menu whose items remove the row or move it into the
  // collapsed Archive folder, and the page has a menu outside the tree that removes
  // the first row.
  function MenuTree() {
    const actionsRef = React.useRef<TreeGrid.Root.Actions<MenuItem>>(null);
    return (
      <React.Fragment>
        <button type="button" data-testid="before">
          Before
        </button>
        <TreeGrid.Root defaultItems={MENU_ITEMS} actionsRef={actionsRef}>
          <Menu.Root>
            <Menu.Trigger data-testid="page-menu">Page actions</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.Item
                    onClick={() =>
                      actionsRef.current?.applyTransaction((transaction) =>
                        transaction.remove('documents'),
                      )
                    }
                  >
                    Delete Documents
                  </Menu.Item>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
          <TreeGrid.Table aria-label="Files">
            {(item: MenuItem) => (
              <TreeGrid.Row itemId={item.id} data-testid={`row-${item.id}`}>
                <TreeGrid.Cell>
                  {item.label}
                  <Menu.Root>
                    <TreeGrid.CellButton render={<Menu.Trigger />} data-testid={`menu-${item.id}`}>
                      Actions
                    </TreeGrid.CellButton>
                    <Menu.Portal>
                      <Menu.Positioner>
                        <Menu.Popup>
                          <Menu.Item
                            onClick={() =>
                              actionsRef.current?.applyTransaction((transaction) =>
                                transaction.remove(item.id),
                              )
                            }
                          >
                            Delete
                          </Menu.Item>
                          <Menu.Item
                            onClick={() =>
                              actionsRef.current?.applyTransaction((transaction) =>
                                transaction.move(item.id, { parentId: 'archive' }),
                              )
                            }
                          >
                            Archive
                          </Menu.Item>
                        </Menu.Popup>
                      </Menu.Positioner>
                    </Menu.Portal>
                  </Menu.Root>
                </TreeGrid.Cell>
              </TreeGrid.Row>
            )}
          </TreeGrid.Table>
        </TreeGrid.Root>
      </React.Fragment>
    );
  }

  it.each([
    { name: 'Delete', target: 'row-music' },
    { name: 'Archive', target: 'row-archive' },
  ])(
    'focuses $target when $name in the menu of a row takes the row out of view',
    async ({ name, target }) => {
      const { user } = await render(<MenuTree />);
      act(() => screen.getByTestId('row-documents').focus());
      await user.keyboard('{ArrowRight}{Enter}');
      const menuItem = await screen.findByRole('menuitem', { name });
      act(() => menuItem.focus());
      expect(menuItem).toHaveFocus();

      await user.keyboard('{Enter}');

      expect(screen.queryByTestId('row-documents')).toBe(null);
      await waitFor(() => {
        expect(screen.getByTestId(target)).toHaveFocus();
      });
    },
  );

  it('leaves focus with a menu outside the tree that removes the row focused last', async () => {
    const { user } = await render(<MenuTree />);
    act(() => screen.getByTestId('row-documents').focus());
    const pageMenu = screen.getByTestId('page-menu');
    act(() => pageMenu.focus());
    await user.keyboard('{Enter}');
    const menuItem = await screen.findByRole('menuitem', { name: 'Delete Documents' });
    act(() => menuItem.focus());

    await user.keyboard('{Enter}');

    expect(screen.queryByTestId('row-documents')).toBe(null);
    await waitFor(() => {
      expect(pageMenu).toHaveFocus();
    });
    await act(async () => {
      await waitSingleFrame();
      await waitSingleFrame();
    });
    expect(pageMenu).toHaveFocus();
  });

  it('leaves focus on the body when the row focused last is removed after focus was lost', async () => {
    const actionsRef = React.createRef<TreeGrid.Root.Actions<MenuItem>>();
    await render(
      <TreeGrid.Root defaultItems={MENU_ITEMS} actionsRef={actionsRef}>
        <TreeGrid.Table aria-label="Files">
          {(item: MenuItem) => (
            <TreeGrid.Row itemId={item.id} data-testid={`row-${item.id}`}>
              <TreeGrid.Cell>{item.label}</TreeGrid.Cell>
            </TreeGrid.Row>
          )}
        </TreeGrid.Table>
      </TreeGrid.Root>,
    );
    const row = screen.getByTestId('row-documents');
    act(() => row.focus());
    act(() => row.blur());
    expect(document.body).toHaveFocus();

    // A background update, such as new data, removes the row.
    await act(async () => {
      await actionsRef.current?.applyTransaction((transaction) => transaction.remove('documents'));
      await waitSingleFrame();
      await waitSingleFrame();
    });

    expect(screen.queryByTestId('row-documents')).toBe(null);
    expect(document.body).toHaveFocus();
  });
});
