import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen } from '@mui/internal-test-utils';
import { createRenderer, isJSDOM, waitSingleFrame } from '#test-utils';
import { DirectionProvider } from '../direction-provider';
import { Field } from '../field';
import { Menu } from '../menu';
import { Select } from '../select';
import { Tree } from '.';
import type { TreeDefaultItem } from './store/types';

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
  onItemHighlighted?: Tree.Root.Props['onItemHighlighted'];
}) {
  const grid = (
    <Tree.Root
      items={ITEMS}
      selectionMode="multiple"
      defaultExpandedItems={props.defaultExpandedItems}
      onItemHighlighted={props.onItemHighlighted}
    >
      <Tree.List aria-label="Files">
        {(item: Item) => (
          <Tree.Item itemId={item.id} data-testid={`row-${item.id}`}>
            <Tree.ItemContent>
              <Tree.ItemExpansionTrigger />
              <Tree.ItemCheckbox data-testid={`checkbox-${item.id}`}>
                <Tree.ItemCheckboxIndicator />
              </Tree.ItemCheckbox>
              {item.label}
              <Tree.ItemButton style={{ display: 'none' }}>Hidden action</Tree.ItemButton>
              <Tree.ItemButton data-testid={`action-${item.id}`}>Info</Tree.ItemButton>
            </Tree.ItemContent>
          </Tree.Item>
        )}
      </Tree.List>
    </Tree.Root>
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
      <Tree.Root items={FLAT_ITEMS}>
        <Tree.List aria-label="Files">
          {(item: Item) => (
            <Tree.Item itemId={item.id} data-testid={`row-${item.id}`}>
              <Tree.ItemContent>
                {item.label}
                {item.id === 'documents' ? props.children : null}
              </Tree.ItemContent>
            </Tree.Item>
          )}
        </Tree.List>
      </Tree.Root>
    </DirectionProvider>
  );
}

function press(element: HTMLElement, key: string) {
  fireEvent.keyDown(element, { key });
}

describe('Tree', () => {
  it('uses treegrid, row, and gridcell roles', async () => {
    await render(<TestTree />);

    expect(screen.getByRole('treegrid', { name: 'Files' })).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(2);
    expect(screen.getByRole('row', { name: 'Documents' })).toBeInTheDocument();
    expect(screen.getAllByRole('gridcell')).toHaveLength(2);
    // Named after the item, not after every control label inside it.
    expect(screen.getAllByRole('gridcell')[0]).toHaveAccessibleName('Documents');
    // A single column that is always rendered needs no column metadata.
    expect(screen.getAllByRole('gridcell')[0]).not.toHaveAttribute('aria-colindex');
    expect(screen.queryByRole('treeitem')).toBeNull();
  });

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
      <Tree.Root items={ITEMS} selectionMode="multiple">
        <Tree.List aria-label="Files">
          {(item) => (
            <Tree.Item itemId={item.id}>
              <Tree.ItemContent>
                <Tree.ItemCheckbox aria-label={`Sélectionner ${item.label}`} />
                <Tree.ItemExpansionTrigger
                  render={(props, state) => (
                    <button
                      {...props}
                      aria-label={`${state.expanded ? 'Réduire' : 'Développer'} ${item.label}`}
                    />
                  )}
                />
                {item.label}
              </Tree.ItemContent>
            </Tree.Item>
          )}
        </Tree.List>
      </Tree.Root>,
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
        <Tree.Root
          items={[
            { id: 'documents', label: 'Documents', disabled },
            { id: 'music', label: 'Music' },
          ]}
          selectionMode="multiple"
        >
          <Tree.List>
            {(item: TreeDefaultItem) => (
              <Tree.Item itemId={item.id} data-testid={`row-${item.id}`}>
                <Tree.ItemContent>
                  <Tree.ItemCheckbox data-testid={`checkbox-${item.id}`} />
                  {item.label}
                </Tree.ItemContent>
              </Tree.Item>
            )}
          </Tree.List>
        </Tree.Root>
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
        <Tree.ItemButton
          data-testid="action"
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault();
            }
          }}
        >
          Close
        </Tree.ItemButton>
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
          <Tree.ItemButton data-testid="fieldset-disabled">Disabled</Tree.ItemButton>
        </fieldset>
        <span hidden>
          <Tree.ItemButton>Hidden</Tree.ItemButton>
        </span>
        <span aria-hidden="true">
          <Tree.ItemButton>ARIA hidden</Tree.ItemButton>
        </span>
        <span ref={(element) => element?.setAttribute('inert', '')}>
          <Tree.ItemButton>Inert</Tree.ItemButton>
        </span>
        <Field.Root disabled>
          <Tree.ItemCheckbox />
        </Field.Root>
        <Tree.ItemButton data-testid="action">Action</Tree.ItemButton>
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
        <Tree.ItemButton disabled onClick={onClick} data-testid="disabled">
          Disabled
        </Tree.ItemButton>
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
        <Tree.ItemButton disabled render={<button type="button" />} data-testid="focusable">
          Focusable
        </Tree.ItemButton>
        <Tree.ItemButton
          disabled
          focusableWhenDisabled={false}
          render={<button type="button" />}
          data-testid="unfocusable"
        >
          Unfocusable
        </Tree.ItemButton>
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
          <Tree.ItemButton
            disabled
            focusableWhenDisabled={props.focusableWhenDisabled}
            render={<button type="button" />}
            data-testid="native"
          >
            Native
          </Tree.ItemButton>
          <Menu.Root>
            <Tree.ItemButton
              disabled
              focusableWhenDisabled={props.focusableWhenDisabled}
              render={<Menu.Trigger />}
              data-testid="trigger"
            >
              Actions
            </Tree.ItemButton>
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
        <Tree.Root items={items} disabled={disabled}>
          <Tree.List>
            {(item: TreeDefaultItem) => (
              <Tree.Item itemId={item.id}>
                <Tree.ItemContent>
                  {item.label}
                  {item.id === 'documents' ? (
                    <React.Fragment>
                      <Tree.ItemButton onClick={onClick} data-testid="action">
                        Action
                      </Tree.ItemButton>
                      <Tree.ItemInput aria-label="Name" data-testid="input" />
                    </React.Fragment>
                  ) : null}
                </Tree.ItemContent>
              </Tree.Item>
            )}
          </Tree.List>
        </Tree.Root>,
      );

      const action = screen.getByTestId('action');
      fireEvent.click(action);
      expect(onClick).not.toHaveBeenCalled();
      expect(action).toHaveAttribute('aria-disabled', 'true');
      expect(action).toHaveAttribute('data-disabled');
      expect(screen.getByTestId('input')).toHaveAttribute('aria-disabled', 'true');
      expect(screen.getByTestId('input')).toHaveAttribute('data-disabled');
    },
  );

  it('skips a disabled checkbox, with the arrows and with Tab', async () => {
    await render(
      <Tree.Root items={FLAT_ITEMS} selectionMode="none">
        <Tree.List>
          {(item: Item) => (
            <Tree.Item itemId={item.id} data-testid={`row-${item.id}`}>
              <Tree.ItemContent>
                <Tree.ItemCheckbox data-testid={`checkbox-${item.id}`} />
                <Tree.ItemButton data-testid={`action-${item.id}`}>Info</Tree.ItemButton>
              </Tree.ItemContent>
            </Tree.Item>
          )}
        </Tree.List>
      </Tree.Root>,
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
          <Tree.ItemButton slot="first" data-testid="first">
            First
          </Tree.ItemButton>
          <Tree.ItemButton slot="second" data-testid="second">
            Second
          </Tree.ItemButton>
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
        <Tree.ItemButton data-testid="action">Action</Tree.ItemButton>
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
        <Tree.ItemButton aria-haspopup="menu" data-testid="trigger">
          Actions
        </Tree.ItemButton>
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
        <Tree.ItemButton aria-haspopup="false" data-testid="action">
          Action
        </Tree.ItemButton>
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
        <Tree.ItemButton aria-haspopup="menu" disabled data-testid="trigger">
          Actions
        </Tree.ItemButton>
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
          <Tree.Item itemId={item.id} data-testid={`row-${item.id}`} style={{ width: 600 }}>
            <Tree.ItemContent style={{ display: 'flex', height: 28 }}>
              {item.label}
              <Tree.ItemButton
                data-testid={`action-${item.id}`}
                style={{ marginInlineStart: 'auto' }}
              >
                Info
              </Tree.ItemButton>
            </Tree.ItemContent>
          </Tree.Item>
        );
      }
      await render(
        <DirectionProvider direction={direction}>
          <div dir={direction}>
            <Tree.Root items={FLAT_ITEMS}>
              <div data-testid="scroller" style={{ width: 200, height: 40, overflow: 'auto' }}>
                <Tree.List aria-label="Files">{renderRow}</Tree.List>
              </div>
            </Tree.Root>
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

  describe('Tree.ItemInput', () => {
    it.each([
      ['ltr', 'ArrowRight', 'ArrowLeft'],
      ['rtl', 'ArrowLeft', 'ArrowRight'],
    ] as const)(
      'keeps the horizontal arrows in %s until the caret reaches the edge of the text',
      async (direction, nextKey, previousKey) => {
        await render(
          <SingleRowTree direction={direction}>
            <Tree.ItemInput
              aria-label="Name"
              data-testid="input"
              defaultValue="Notes"
              dir={direction}
            />
            <Tree.ItemButton data-testid="action">Action</Tree.ItemButton>
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
          <Tree.ItemInput aria-label="Name" data-testid="input" defaultValue="abc" dir="ltr" />
          <Tree.ItemButton data-testid="action">Action</Tree.ItemButton>
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

    it.each([
      ['email', 'action'],
      ['number', 'action'],
      ['range', 'input'],
    ])('moves Right Arrow focus from a %s input to the %s', async (type, expected) => {
      await render(
        <SingleRowTree>
          <Tree.ItemInput type={type} aria-label="Value" data-testid="input" />
          <Tree.ItemButton data-testid="action">Action</Tree.ItemButton>
        </SingleRowTree>,
      );

      const input = screen.getByTestId('input');
      act(() => input.focus());
      fireEvent.keyDown(input, { key: 'ArrowRight' });

      expect(screen.getByTestId(expected)).toHaveFocus();
    });

    it('moves between items with the vertical arrows from a single-line input', async () => {
      await render(
        <SingleRowTree>
          <Tree.ItemInput aria-label="Name" data-testid="input" />
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
          <Tree.ItemInput list="suggestions" aria-label="Name" data-testid="input" />
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
          <Tree.ItemInput type="number" aria-label="Count" data-testid="input" />
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
          <Tree.ItemInput
            disabled
            required
            readOnly={false}
            aria-label="Name"
            data-testid="input"
            defaultValue="Notes"
          />
          <Tree.ItemButton data-testid="action">Action</Tree.ItemButton>
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

    it('skips a disabled input that is not focusable', async () => {
      await render(
        <SingleRowTree>
          <Tree.ItemInput
            disabled
            focusableWhenDisabled={false}
            aria-label="Name"
            data-testid="input"
          />
          <Tree.ItemButton data-testid="action">Action</Tree.ItemButton>
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
          <Tree.ItemInput type="search" aria-label="Search" data-testid="input" />
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

  describe('Tree.ItemControl', () => {
    it('keeps every key by default', async () => {
      await render(
        <SingleRowTree>
          <Tree.ItemControl
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
        <Tree.Root items={FLAT_ITEMS}>
          <Tree.List>
            {(item: Item) => (
              <Tree.Item itemId={item.id} data-testid={`row-${item.id}`}>
                <Tree.ItemContent>
                  {item.label}
                  <Tree.ItemControl data-testid={`control-${item.id}`}>
                    <span>Widget</span>
                  </Tree.ItemControl>
                </Tree.ItemContent>
              </Tree.Item>
            )}
          </Tree.List>
        </Tree.Root>,
      );

      const control = screen.getByTestId('control-music');
      fireEvent.click(control.querySelector('span')!);
      expect(screen.getByTestId('row-music')).toHaveAttribute('aria-selected', 'false');
    });

    it('hands key groups to the tree with controlKeys', async () => {
      await render(
        <SingleRowTree>
          <Tree.ItemControl
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
          <Tree.Root items={ITEMS} selectionMode="multiple">
            <Tree.List aria-label="Files">
              {(item: Item) => (
                <Tree.Item itemId={item.id} data-testid={`tab-row-${item.id}`}>
                  <Tree.ItemContent>
                    <Tree.ItemCheckbox data-testid={`tab-checkbox-${item.id}`} />
                    <Tree.ItemButton data-testid={`tab-action-${item.id}`}>Info</Tree.ItemButton>
                    {props.children}
                  </Tree.ItemContent>
                </Tree.Item>
              )}
            </Tree.List>
          </Tree.Root>
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
          <Tree.ItemButton tabIndex={-1} data-testid="action">
            Action
          </Tree.ItemButton>
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
            <Tree.Root items={ITEMS}>
              <Tree.List aria-label="Files">
                {(item: Item) => (
                  <Tree.Item itemId={item.id} data-testid={`dynamic-row-${item.id}`}>
                    <Tree.ItemContent>
                      {item.label}
                      {showAction && item.id === 'music' ? (
                        <Tree.ItemButton data-testid="dynamic-action">Info</Tree.ItemButton>
                      ) : null}
                    </Tree.ItemContent>
                  </Tree.Item>
                )}
              </Tree.List>
            </Tree.Root>
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
            <Tree.ItemButton data-testid="retry" onClick={() => setFailed(false)}>
              Retry
            </Tree.ItemButton>
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
          <Tree.ItemControl
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
              <Tree.ItemButton data-testid="retry" onClick={() => setFailed(false)}>
                Retry
              </Tree.ItemButton>
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
            <Tree.ItemButton render={<Select.Trigger />} data-testid="trigger">
              <Select.Value />
            </Tree.ItemButton>
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
          <Tree.ItemButton data-testid="next">Add</Tree.ItemButton>
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
      <Tree.Root items={FLAT_ITEMS} selectionMode="multiple" onItemHighlighted={onItemHighlighted}>
        <Tree.List>
          {(item: Item) => (
            <Tree.Item itemId={item.id} data-testid={`row-${item.id}`}>
              <Tree.ItemContent>
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
              </Tree.ItemContent>
            </Tree.Item>
          )}
        </Tree.List>
      </Tree.Root>,
    );

    fireEvent.click(screen.getByTestId('popup'));
    act(() => screen.getByRole('button', { name: 'Close' }).focus());

    expect(screen.getByTestId('row-documents')).toHaveAttribute('aria-selected', 'false');
    expect(onItemHighlighted).not.toHaveBeenCalled();
  });

  it('does not select a row when a nested label or disabled control is pressed', async () => {
    const onSelectedItemsChange = vi.fn();
    await render(
      <Tree.Root
        items={[{ id: 'music', label: 'Music' }]}
        selectionMode="multiple"
        onSelectedItemsChange={onSelectedItemsChange}
      >
        <Tree.List>
          {(item: Item) => (
            <Tree.Item itemId={item.id}>
              <Tree.ItemContent>
                <label>
                  <input type="checkbox" /> Native option
                </label>
                <button type="button" disabled>
                  Disabled action
                </button>
              </Tree.ItemContent>
            </Tree.Item>
          )}
        </Tree.List>
      </Tree.Root>,
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
        <Tree.Root items={ITEMS} onItemHighlighted={onItemHighlighted}>
          <Tree.List>
            {(item: Item) => (
              <Tree.Item itemId={item.id} data-testid={`reason-row-${item.id}`}>
                <Tree.ItemContent>
                  {item.label}
                  <button type="button" disabled data-testid={`disabled-${item.id}`}>
                    Disabled action
                  </button>
                </Tree.ItemContent>
              </Tree.Item>
            )}
          </Tree.List>
        </Tree.Root>,
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
        <Tree.Root items={[{ id: 'music', label: 'Music' }]} selectionMode="multiple">
          <Tree.List>
            {(item: Item) => (
              <Tree.Item itemId={item.id}>
                <Tree.ItemContent>
                  <Tree.ItemCheckbox inputRef={inputRef} />
                </Tree.ItemContent>
              </Tree.Item>
            )}
          </Tree.List>
        </Tree.Root>
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
          <Tree.Root
            items={[
              { id: 'music', label: 'Music' },
              { id: 'photos', label: 'Photos' },
            ]}
            selectionMode="multiple"
          >
            <Tree.List>
              {(item: Item) => (
                <Tree.Item itemId={item.id}>
                  <Tree.ItemContent>
                    <Tree.ItemCheckbox />
                  </Tree.ItemContent>
                </Tree.Item>
              )}
            </Tree.List>
          </Tree.Root>
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
    const selectionLockedItems = Tree.createItems([{ id: 'locked', label: 'Locked' }], {
      getId: (item) => item.id,
      getLabel: (item) => item.label,
      isSelectionDisabled: () => true,
    });

    const { rerender } = await render(
      <Tree.Root
        items={selectionLockedItems}
        selectionMode="multiple"
        onSelectedItemsChange={onSelectedItemsChange}
      >
        <Tree.List>
          {(item) => (
            <Tree.Item itemId={item.id}>
              <Tree.ItemContent>
                <Tree.ItemCheckbox />
              </Tree.ItemContent>
            </Tree.Item>
          )}
        </Tree.List>
      </Tree.Root>,
    );

    expect(screen.getByRole('checkbox', { name: 'Select Locked' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select Locked' }));
    expect(onSelectedItemsChange).not.toHaveBeenCalled();

    await rerender(
      <Tree.Root items={[{ id: 'music', label: 'Music' }]} selectionMode="none">
        <Tree.List>
          {(item: Item) => (
            <Tree.Item itemId={item.id}>
              <Tree.ItemContent>
                <Tree.ItemCheckbox />
              </Tree.ItemContent>
            </Tree.Item>
          )}
        </Tree.List>
      </Tree.Root>,
    );
    expect(screen.getByRole('checkbox', { name: 'Select Music' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );

    await rerender(
      <Tree.Root items={[{ id: 'music', label: 'Music' }]} selectionMode="multiple" disabled>
        <Tree.List>
          {(item: Item) => (
            <Tree.Item itemId={item.id}>
              <Tree.ItemContent>
                <Tree.ItemCheckbox />
              </Tree.ItemContent>
            </Tree.Item>
          )}
        </Tree.List>
      </Tree.Root>,
    );
    expect(screen.getByRole('checkbox', { name: 'Select Music' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('updates row and control names when an item label changes', async () => {
    function Example({ label }: { label: string }) {
      return (
        <Tree.Root
          items={[
            {
              id: 'documents',
              label,
              children: [{ id: 'child', label: 'Child' }],
            },
          ]}
          selectionMode="multiple"
        >
          <Tree.List>
            {(item: Item) =>
              item.id === 'documents' ? (
                <Tree.Item itemId="documents">
                  <Tree.ItemContent>
                    <Tree.ItemExpansionTrigger />
                    <Tree.ItemCheckbox />
                    {item.label}
                  </Tree.ItemContent>
                </Tree.Item>
              ) : null
            }
          </Tree.List>
        </Tree.Root>
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
    const actionsRef = React.createRef<Tree.Root.Actions | null>();
    const onSelectedItemsChange = vi.fn();
    const renderTree = (filterValue: string) => (
      <Tree.FilterProvider value={filterValue}>
        <Tree.Root
          items={[root]}
          selectionMode="multiple"
          actionsRef={actionsRef}
          onSelectedItemsChange={onSelectedItemsChange}
        >
          {null}
        </Tree.Root>
      </Tree.FilterProvider>
    );
    const view = await render(renderTree(''));

    act(() => actionsRef.current!.setItemSelection('n0', true));
    expect(onSelectedItemsChange.mock.calls.at(-1)![0]).toHaveLength(depth);

    await view.rerender(renderTree('needle'));
    expect(actionsRef.current!.isItemExpanded('n0')).toBe(true);
    expect(actionsRef.current!.isItemExpanded(`n${depth - 2}`)).toBe(true);
  });
});

const renderSimpleItem = (item: TreeDefaultItem) => (
  <Tree.Item itemId={item.id}>
    <Tree.ItemContent>
      <Tree.ItemExpansionTrigger />
      {item.label}
    </Tree.ItemContent>
  </Tree.Item>
);

describe('nested tree ownership', () => {
  it('isolates a nested tree row click from the enclosing row', async () => {
    const outerChange = vi.fn();
    await render(
      <Tree.Root items={[{ id: 'outer', label: 'outer' }]} onSelectedItemsChange={outerChange}>
        <Tree.List>
          {() => (
            <Tree.Item itemId="outer">
              <Tree.ItemContent>
                outer
                <Tree.Root items={[{ id: 'inner', label: 'inner' }]}>
                  <Tree.List>{renderSimpleItem}</Tree.List>
                </Tree.Root>
              </Tree.ItemContent>
            </Tree.Item>
          )}
        </Tree.List>
      </Tree.Root>,
    );
    fireEvent.click(screen.getByText('inner'));
    expect(outerChange).not.toHaveBeenCalled();
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
        <Tree.Root
          items={ITEMS}
          selectionMode="multiple"
          defaultSelectedItems={initial}
          checkboxSelectionPropagation={{ parents: true, descendants }}
          onSelectedItemsChange={onSelectedItemsChange}
        >
          <Tree.List>
            {(item) => (
              <Tree.Item itemId={item.id}>
                <Tree.ItemContent>
                  <Tree.ItemCheckbox />
                  {item.label}
                </Tree.ItemContent>
              </Tree.Item>
            )}
          </Tree.List>
        </Tree.Root>,
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

describe('Tree.ItemCheckbox', () => {
  it('passes the selection state of its item, without field state, to its state callbacks', async () => {
    const checkboxStates: Tree.ItemCheckbox.State[] = [];
    const indicatorStates: Tree.ItemCheckboxIndicator.State[] = [];
    await render(
      <Tree.Root
        items={[{ id: 'a', label: 'A' }]}
        selectionMode="multiple"
        defaultSelectedItems={['a']}
      >
        <Tree.List>
          {(item) => (
            <Tree.Item itemId={item.id}>
              <Tree.ItemContent>
                <Tree.ItemCheckbox
                  className={(state) => {
                    checkboxStates.push(state);
                    return undefined;
                  }}
                >
                  <Tree.ItemCheckboxIndicator
                    className={(state) => {
                      indicatorStates.push(state);
                      return undefined;
                    }}
                  />
                </Tree.ItemCheckbox>
              </Tree.ItemContent>
            </Tree.Item>
          )}
        </Tree.List>
      </Tree.Root>,
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

describe('Tree.ItemExpansionTrigger', () => {
  it('marks the trigger of a disabled item as disabled', async () => {
    await render(
      <Tree.Root
        items={[
          { id: 'a', label: 'A', disabled: true, children: [{ id: 'a1', label: 'A1' }] },
          { id: 'b', label: 'B', children: [{ id: 'b1', label: 'B1' }] },
        ]}
      >
        <Tree.List>
          {(item) => (
            <Tree.Item itemId={item.id}>
              <Tree.ItemContent>
                <Tree.ItemExpansionTrigger data-testid={`trigger-${item.id}`} />
              </Tree.ItemContent>
            </Tree.Item>
          )}
        </Tree.List>
      </Tree.Root>,
    );

    expect(screen.getByTestId('trigger-a')).toHaveAttribute('data-disabled');
    expect(screen.getByTestId('trigger-b')).not.toHaveAttribute('data-disabled');
  });

  it('toggles the item when rendered as a non-native button', async () => {
    await render(
      <Tree.Root items={[{ id: 'a', label: 'A', children: [{ id: 'a1', label: 'A1' }] }]}>
        <Tree.List>
          {(item) => (
            <Tree.Item itemId={item.id}>
              <Tree.ItemContent>
                <Tree.ItemExpansionTrigger
                  nativeButton={false}
                  render={<span />}
                  data-testid={`trigger-${item.id}`}
                />
                {item.label}
              </Tree.ItemContent>
            </Tree.Item>
          )}
        </Tree.List>
      </Tree.Root>,
    );

    const trigger = screen.getByTestId('trigger-a');
    expect(trigger).toHaveAttribute('role', 'button');
    expect(trigger).toHaveAccessibleName('Expand A');
    fireEvent.click(trigger);
    expect(screen.getByRole('row', { name: 'A1' })).toBeVisible();
    expect(trigger).toHaveAccessibleName('Collapse A');
  });

  describe('Alt-click', () => {
    const items: TreeDefaultItem[] = [
      {
        id: 'a',
        label: 'A',
        children: [
          { id: 'a1', label: 'A1', children: [{ id: 'a1x', label: 'A1X' }] },
          { id: 'a2', label: 'A2', disabled: true, children: [{ id: 'a2x', label: 'A2X' }] },
        ],
      },
      { id: 'b', label: 'B', children: [{ id: 'b1', label: 'B1' }] },
    ];

    function AltClickTree(props: {
      defaultExpandedItems?: string[];
      onExpandedItemsChange: Tree.Root.Props['onExpandedItemsChange'];
    }) {
      return (
        <Tree.Root items={items} {...props}>
          <Tree.List>
            {(item: TreeDefaultItem) => (
              <Tree.Item itemId={item.id}>
                <Tree.ItemContent>
                  <Tree.ItemExpansionTrigger data-testid={`trigger-${item.id}`} />
                  {item.label}
                </Tree.ItemContent>
              </Tree.Item>
            )}
          </Tree.List>
        </Tree.Root>
      );
    }

    it('expands the item and the descendants that can be toggled', async () => {
      const onExpandedItemsChange = vi.fn();
      await render(<AltClickTree onExpandedItemsChange={onExpandedItemsChange} />);

      fireEvent.click(screen.getByTestId('trigger-a'), { altKey: true });

      expect(onExpandedItemsChange).toHaveBeenCalledTimes(1);
      expect([...onExpandedItemsChange.mock.calls[0][0]].sort()).toEqual(['a', 'a1']);
      expect(onExpandedItemsChange.mock.calls[0][1]).toHaveProperty('reason', 'trigger-press');
      expect(screen.getByRole('row', { name: 'A1X' })).toBeVisible();
      expect(screen.queryByRole('row', { name: 'A2X' })).toBeNull();
      expect(screen.queryByRole('row', { name: 'B1' })).toBeNull();
    });

    it('collapses the item with its descendants', async () => {
      const onExpandedItemsChange = vi.fn();
      await render(
        <AltClickTree
          defaultExpandedItems={['a', 'a1', 'b']}
          onExpandedItemsChange={onExpandedItemsChange}
        />,
      );

      fireEvent.click(screen.getByTestId('trigger-a'), { altKey: true });

      expect(onExpandedItemsChange).toHaveBeenCalledTimes(1);
      expect(onExpandedItemsChange.mock.calls[0][0]).toEqual(['b']);
      expect(screen.queryByRole('row', { name: 'A1' })).toBeNull();

      // Expanding it again shows its children collapsed.
      fireEvent.click(screen.getByTestId('trigger-a'));
      expect(screen.getByRole('row', { name: 'A1' })).toBeVisible();
      expect(screen.queryByRole('row', { name: 'A1X' })).toBeNull();
    });
  });

  it('does not toggle the item when the trigger itself is disabled', async () => {
    const onExpandedItemsChange = vi.fn();
    await render(
      <Tree.Root
        items={[{ id: 'a', label: 'A', children: [{ id: 'a1', label: 'A1' }] }]}
        onExpandedItemsChange={onExpandedItemsChange}
      >
        <Tree.List>
          {(item) => (
            <Tree.Item itemId={item.id}>
              <Tree.ItemContent>
                <Tree.ItemExpansionTrigger
                  disabled
                  nativeButton={false}
                  render={<span />}
                  data-testid={`trigger-${item.id}`}
                />
                {item.label}
              </Tree.ItemContent>
            </Tree.Item>
          )}
        </Tree.List>
      </Tree.Root>,
    );

    const trigger = screen.getByTestId('trigger-a');
    expect(trigger).toHaveAttribute('data-disabled');
    fireEvent.click(trigger);
    expect(onExpandedItemsChange).not.toHaveBeenCalled();
  });

  it.each([false, true])(
    'lets the click propagate past the tree only when allowed: %s',
    async (allowPropagation) => {
      const onOuterClick = vi.fn();
      await render(
        <div onClick={onOuterClick}>
          <Tree.Root
            items={[{ id: 'a', label: 'A', children: [{ id: 'a1', label: 'A1' }] }]}
            expandOnClick
            onExpandedItemsChange={(_expandedItems, eventDetails) => {
              if (allowPropagation) {
                eventDetails.allowPropagation();
              }
            }}
          >
            <Tree.List>
              {(item) => (
                <Tree.Item itemId={item.id}>
                  <Tree.ItemContent>
                    <Tree.ItemExpansionTrigger data-testid={`trigger-${item.id}`} />
                    {item.label}
                  </Tree.ItemContent>
                </Tree.Item>
              )}
            </Tree.List>
          </Tree.Root>
        </div>,
      );

      fireEvent.click(screen.getByTestId('trigger-a'));

      expect(onOuterClick).toHaveBeenCalledTimes(allowPropagation ? 1 : 0);
      // The row ignores the click of its trigger, so it doesn't toggle the item back.
      expect(screen.getByRole('row', { name: 'A1' })).toBeVisible();
    },
  );
});
