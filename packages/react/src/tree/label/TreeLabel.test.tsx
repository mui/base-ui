import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@mui/internal-test-utils';
import { createRenderer } from '#test-utils';
import { Field } from '@base-ui/react/field';
import { Tree } from '..';

const items: Tree.DefaultItem[] = [
  { id: 'a', label: 'A' },
  { id: 'b', label: 'B' },
];

function Example(props: {
  label?: React.ReactNode;
  list?: Omit<Tree.List.Props, 'children'>;
  onItemHighlighted?: Tree.Root.Props['onItemHighlighted'];
}) {
  const { label = <Tree.Label>Files</Tree.Label>, list, onItemHighlighted } = props;
  return (
    <Tree.Root items={items} defaultSelectedItems="b" onItemHighlighted={onItemHighlighted}>
      {label}
      <Tree.List {...list}>
        {(item) => <Tree.Item itemId={item.id}>{item.label}</Tree.Item>}
      </Tree.List>
    </Tree.Root>
  );
}

function EmptyTree(props: { disabled?: boolean }) {
  return (
    <Tree.Root items={[]} disabled={props.disabled}>
      <Tree.Label>Files</Tree.Label>
      <Tree.List>{(item) => <Tree.Item itemId={item.id}>{item.label}</Tree.Item>}</Tree.List>
    </Tree.Root>
  );
}

describe('<Tree.Label />', () => {
  const { render } = createRenderer();

  it('names the tree', async () => {
    await render(<Example />);
    expect(screen.getByRole('tree', { name: 'Files' })).toBeVisible();
  });

  it('references the id of the render element', async () => {
    await render(
      <Example label={<Tree.Label render={<h2 id="files-heading" />}>Files</Tree.Label>} />,
    );
    expect(screen.getByRole('tree', { name: 'Files' })).toHaveAttribute(
      'aria-labelledby',
      'files-heading',
    );
  });

  it('drops the reference when the render element clears the id', async () => {
    await render(<Example label={<Tree.Label render={<h2 id="" />}>Files</Tree.Label>} />);
    expect(screen.getByRole('tree')).not.toHaveAttribute('aria-labelledby');
  });

  it('lets the list override the reference', async () => {
    await render(<Example list={{ 'aria-labelledby': 'heading' }} />);
    expect(screen.getByRole('tree')).toHaveAttribute('aria-labelledby', 'heading');
  });

  it('leaves the label of an enclosing Field to the Field control', async () => {
    await render(
      <Field.Root>
        <Field.Label>Name</Field.Label>
        <Field.Control />
        <Example />
      </Field.Root>,
    );

    expect(screen.getByRole('textbox')).toHaveAccessibleName('Name');
    expect(screen.getByRole('tree')).toHaveAccessibleName('Files');
  });

  it('removes the reference when it unmounts', async () => {
    const { setProps } = await render(<Example />);
    await setProps({ label: null });
    expect(screen.getByRole('tree')).not.toHaveAttribute('aria-labelledby');
  });

  it('focuses the tree on click', async () => {
    await render(<Example />);
    const label = screen.getByText('Files');
    const pointerDown = fireEvent.pointerDown(label);
    expect(pointerDown).toBe(false);
    fireEvent.click(label);
    // The selected item holds the tab stop.
    expect(screen.getByRole('treeitem', { name: 'B' })).toHaveFocus();
  });

  it('focuses the tree on click when it has no row to focus', async () => {
    const { user } = await render(<EmptyTree />);
    const tree = screen.getByRole('tree', { name: 'Files' });
    expect(tree).not.toHaveFocus();

    await user.click(screen.getByText('Files'));

    expect(tree).toHaveFocus();
  });

  it('leaves focus where it is on click while the tree is disabled', async () => {
    const { user } = await render(<EmptyTree disabled />);

    await user.click(screen.getByText('Files'));

    expect(screen.getByRole('tree', { name: 'Files' })).not.toHaveFocus();
  });

  it('reports the focus a press moves with the pointer reason', async () => {
    const onItemHighlighted = vi.fn();
    const { user } = await render(<Example onItemHighlighted={onItemHighlighted} />);
    await user.click(screen.getByText('Files'));
    expect(onItemHighlighted).toHaveBeenCalledWith(
      'b',
      expect.objectContaining({
        reason: 'pointer',
        event: expect.objectContaining({ type: 'pointerdown' }),
      }),
    );
  });

  it('reports the focus a click without a press moves with the none reason', async () => {
    const onItemHighlighted = vi.fn();
    await render(<Example onItemHighlighted={onItemHighlighted} />);
    const label = screen.getByText('Files');
    // A press that ended outside the label, then a click from assistive technology.
    fireEvent.pointerDown(label);
    fireEvent.click(label);
    expect(onItemHighlighted).toHaveBeenCalledWith(
      'b',
      expect.objectContaining({
        reason: 'none',
        event: expect.objectContaining({ type: 'click' }),
      }),
    );
  });
});
