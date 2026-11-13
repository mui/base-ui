import * as React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen, fireEvent, waitFor, within, act } from '@mui/internal-test-utils';
import { createRenderer, isJSDOM, waitSingleFrame } from '#test-utils';
import { Tree } from '..';
import { useTreeRootContext } from './TreeRootContext';

const { render } = createRenderer();

const ITEMS = [
  {
    id: 'documents',
    label: 'Documents',
    children: [
      { id: 'resume', label: 'Resume.pdf' },
      { id: 'cover-letter', label: 'Cover Letter.docx' },
    ],
  },
  { id: 'photos', label: 'Photos' },
  { id: 'music', label: 'Music' },
];

function AnimatedTree(props: { expandedItems?: readonly string[] | undefined } = {}) {
  return (
    <Tree.Root items={ITEMS} expandedItems={props.expandedItems}>
      <Tree.List aria-label="Files">
        {(item: any) => (
          <React.Fragment>
            <Tree.Item itemId={item.id} data-testid={`item-${item.id}`}>
              <Tree.ItemContent>
                <Tree.ItemExpansionTrigger data-testid={`trigger-${item.id}`} />
                {item.label}
              </Tree.ItemContent>
            </Tree.Item>
            <Tree.GroupTransition className="TestGroupTransition" data-testid={`gt-${item.id}`} />
          </React.Fragment>
        )}
      </Tree.List>
    </Tree.Root>
  );
}

describe('Tree.List group transitions', () => {
  let animationsDisabled: boolean;

  beforeEach(() => {
    // Force `useAnimationsFinished` to call its callback synchronously without
    // waiting for real animations. This isolates the data-attribute lifecycle
    // from whether jsdom or chromium implements `Element.getAnimations`.
    animationsDisabled = globalThis.BASE_UI_ANIMATIONS_DISABLED;
    globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
  });

  afterEach(() => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = animationsDisabled;
  });

  it('creates transition wrappers for bulk expansion and collapse', async () => {
    const actionsRef = React.createRef<Tree.Root.Actions<(typeof ITEMS)[number]>>();
    await render(
      <Tree.Root items={ITEMS} actionsRef={actionsRef}>
        <Tree.List aria-label="Files">
          {(item) => (
            <React.Fragment>
              <Tree.Item itemId={item.id} data-testid={`item-${item.id}`}>
                <Tree.ItemContent>
                  <Tree.ItemExpansionTrigger />
                  {item.label}
                </Tree.ItemContent>
              </Tree.Item>
              <Tree.GroupTransition data-testid={`gt-${item.id}`} />
            </React.Fragment>
          )}
        </Tree.List>
      </Tree.Root>,
    );

    act(() => {
      void actionsRef.current!.expandAll();
    });
    expect(screen.getByTestId('gt-documents')).toHaveAttribute('data-starting-style');
    expect(screen.getByTestId('gt-documents')).toHaveAttribute('data-expanding');

    act(() => actionsRef.current!.collapseAll());
    expect(screen.getByTestId('gt-documents')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByTestId('gt-documents')).toHaveAttribute('data-collapsing');
    expect(screen.getByTestId('gt-documents')).not.toHaveAttribute('data-expanding');
  });

  it('creates only the top-level transition when nested items collapse together', async () => {
    const items = [
      {
        id: 'parent',
        label: 'Parent',
        children: [
          {
            id: 'child',
            label: 'Child',
            children: [{ id: 'grandchild', label: 'Grandchild' }],
          },
        ],
      },
    ];
    const actionsRef = React.createRef<Tree.Root.Actions<(typeof items)[number]>>();
    let store: ReturnType<typeof useTreeRootContext> | null = null;

    function CaptureStore() {
      store = useTreeRootContext();
      return null;
    }

    await render(
      <Tree.Root items={items} actionsRef={actionsRef} defaultExpandedItems={['parent', 'child']}>
        <CaptureStore />
        <Tree.List>
          {(item) => (
            <React.Fragment>
              <Tree.Item itemId={item.id}>
                <Tree.ItemContent>{item.label}</Tree.ItemContent>
              </Tree.Item>
              <Tree.GroupTransition />
            </React.Fragment>
          )}
        </Tree.List>
      </Tree.Root>,
    );

    const completeGroupTransition = store!.expansion.completeGroupTransition;
    store!.expansion.completeGroupTransition = vi.fn();
    act(() => actionsRef.current!.collapseAll());

    expect(Object.values(store!.state.animatingGroups).map((group) => group.parentId)).toEqual([
      'parent',
    ]);
    store!.expansion.completeGroupTransition = completeGroupTransition;
  });

  it('renders a row expanded while its ancestor group is still expanding', async () => {
    const items = [
      {
        id: 'a',
        label: 'A',
        children: [{ id: 'b', label: 'B', children: [{ id: 'c', label: 'C' }] }],
      },
    ];
    const actionsRef = React.createRef<Tree.Root.Actions<(typeof items)[number]>>();
    await render(
      <Tree.Root items={items} actionsRef={actionsRef}>
        <Tree.List aria-label="Files">
          {(item) => (
            <React.Fragment>
              <Tree.Item itemId={item.id}>
                <Tree.ItemContent>{item.label}</Tree.ItemContent>
              </Tree.Item>
              <Tree.GroupTransition data-testid={`gt-${item.id}`} />
            </React.Fragment>
          )}
        </Tree.List>
      </Tree.Root>,
    );

    act(() => actionsRef.current!.setItemExpansion('a', true));
    act(() => actionsRef.current!.setItemExpansion('b', true));

    expect(
      within(screen.getByTestId('gt-a'))
        .getAllByRole('row')
        .map((row) => row.getAttribute('data-item-id')),
    ).toEqual(['b', 'c']);
    expect(screen.getAllByRole('row')).toHaveLength(3);
  });

  function PartiallyAnimatedTree(props: { animatedItemIds: readonly string[] }) {
    return (
      <Tree.Root items={ITEMS}>
        <Tree.List aria-label="Files">
          {(item: any) => (
            <React.Fragment>
              <Tree.Item itemId={item.id} data-testid={`item-${item.id}`}>
                <Tree.ItemContent>
                  <Tree.ItemExpansionTrigger data-testid={`trigger-${item.id}`} />
                  {item.label}
                </Tree.ItemContent>
              </Tree.Item>
              {props.animatedItemIds.includes(item.id) && (
                <Tree.GroupTransition data-testid={`gt-${item.id}`} />
              )}
            </React.Fragment>
          )}
        </Tree.List>
      </Tree.Root>
    );
  }

  it('passes the animation and its transition status to the state', async () => {
    await render(
      <Tree.Root items={ITEMS}>
        <Tree.List aria-label="Files">
          {(item) => (
            <React.Fragment>
              <Tree.Item itemId={item.id}>
                <Tree.ItemContent>
                  <Tree.ItemExpansionTrigger data-testid={`trigger-${item.id}`} />
                </Tree.ItemContent>
              </Tree.Item>
              <Tree.GroupTransition
                className={(state) => `${state.animation}-${state.transitionStatus}`}
                data-testid={`gt-${item.id}`}
              />
            </React.Fragment>
          )}
        </Tree.List>
      </Tree.Root>,
    );

    fireEvent.click(screen.getByTestId('trigger-documents'));

    expect(screen.getByTestId('gt-documents')).toHaveClass('expanding-starting');
  });

  it('shows the children of a row that renders no Tree.GroupTransition', async () => {
    await render(<PartiallyAnimatedTree animatedItemIds={['photos']} />);

    fireEvent.click(screen.getByTestId('trigger-documents'));

    expect(document.querySelector('[data-parent-id]')).toBeNull();
    expect(screen.getByTestId('item-resume')).toBeInTheDocument();
    expect(screen.getByTestId('item-cover-letter')).toBeInTheDocument();
  });

  it('releases the children when a row stops rendering its Tree.GroupTransition mid-transition', async () => {
    const view = await render(<PartiallyAnimatedTree animatedItemIds={['documents']} />);

    fireEvent.click(screen.getByTestId('trigger-documents'));
    expect(screen.getByTestId('gt-documents')).toContainElement(screen.getByTestId('item-resume'));

    await view.rerender(<PartiallyAnimatedTree animatedItemIds={[]} />);

    expect(document.querySelector('[data-parent-id]')).toBeNull();
    expect(screen.getByTestId('item-resume')).toBeInTheDocument();
  });
});

// The transition lifecycle needs a real CSS transition and `Element.getAnimations`,
// so it can only be exercised in Chromium.
describe.skipIf(isJSDOM)('Tree.List group transition lifecycle', () => {
  let style: HTMLStyleElement;
  let animationsDisabled: boolean;

  beforeEach(() => {
    animationsDisabled = globalThis.BASE_UI_ANIMATIONS_DISABLED;
    globalThis.BASE_UI_ANIMATIONS_DISABLED = false;
    style = document.createElement('style');
    style.textContent = `
      .TestGroupTransition {
        overflow: hidden;
        height: var(--tree-group-transition-height);
        transition: height var(--test-duration, 200ms) linear;
      }
      .TestGroupTransition[data-starting-style],
      .TestGroupTransition[data-ending-style] {
        height: 0;
      }
    `;
    document.head.appendChild(style);
  });

  afterEach(() => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = animationsDisabled;
    style.remove();
    document.documentElement.style.removeProperty('--test-duration');
  });

  it('retains children, sequences the transition attributes, and unmounts on completion when expanding', async () => {
    await render(<AnimatedTree />);

    const documentsItem = screen.getByTestId('item-documents');
    expect(documentsItem).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(screen.getByTestId('trigger-documents'));

    // The wrapper mounts with the expanding children retained inside it.
    const wrapper = screen.getByTestId('gt-documents');
    expect(wrapper).toHaveAttribute('data-parent-id', 'documents');
    expect(within(wrapper).getByTestId('item-resume')).toBeInTheDocument();
    expect(within(wrapper).getByTestId('item-cover-letter')).toBeInTheDocument();

    // The `Tree.GroupTransition` rendered by rows inside the wrapper must not
    // consume the ancestor context and render the group again.
    expect(within(wrapper).queryByTestId('gt-resume')).toBeNull();
    expect(within(wrapper).queryByTestId('gt-cover-letter')).toBeNull();

    // `--tree-group-transition-height` is set from the measured height.
    expect(wrapper.style.getPropertyValue('--tree-group-transition-height')).not.toBe('');

    // Expanding starts at `data-starting-style` (height 0)...
    expect(wrapper).toHaveAttribute('data-starting-style');
    // ...which is removed on the next frame to kick off the 0 → height transition.
    await waitFor(() => expect(wrapper).not.toHaveAttribute('data-starting-style'));

    // On completion the wrapper unmounts and the children render as flat siblings.
    await waitFor(() => expect(screen.queryByTestId('gt-documents')).toBeNull());
    expect(screen.getByTestId('item-resume')).toBeInTheDocument();
    expect(documentsItem).toHaveAttribute('aria-expanded', 'true');
  });

  it.each([
    ['removed', null],
    ['moved', '1'],
    ['moved through actionsRef', '1'],
    // Still hidden only by the collapse, below a folder it did not hide before.
    ['moved below a new expanded folder', '3'],
  ] as const)('updates the rows of a collapsing group when one is %s', async (change, level) => {
    document.documentElement.style.setProperty('--test-duration', '10s');
    const actionsRef = React.createRef<Tree.Root.Actions>();
    const b = { id: 'b', label: 'B' };
    const c = { id: 'c', label: 'C' };
    const initial = [{ id: 'a', label: 'A', children: [b, c] }];
    function App(props: { items?: Tree.DefaultItem[] }) {
      const items =
        change === 'moved through actionsRef'
          ? { defaultItems: initial }
          : { items: props.items ?? initial };
      return (
        <Tree.Root {...items} defaultExpandedItems={['a', 'd']} actionsRef={actionsRef}>
          <Tree.List aria-label="Files">
            {(item) => (
              <React.Fragment>
                <Tree.Item itemId={item.id} data-testid={`item-${item.id}`}>
                  <Tree.ItemContent>{item.label}</Tree.ItemContent>
                </Tree.Item>
                <Tree.GroupTransition
                  className="TestGroupTransition"
                  data-testid={`gt-${item.id}`}
                />
              </React.Fragment>
            )}
          </Tree.List>
        </Tree.Root>
      );
    }
    const { setProps } = await render(<App />);

    act(() => actionsRef.current!.setItemExpansion('a', false));
    const wrapper = screen.getByTestId('gt-a');
    if (change === 'removed') {
      await setProps({ items: [{ id: 'a', label: 'A', children: [c] }] });
    } else if (change === 'moved') {
      await setProps({ items: [{ id: 'a', label: 'A', children: [c] }, b] });
    } else if (change === 'moved through actionsRef') {
      await act(() =>
        actionsRef.current!.applyTransaction((transaction) =>
          transaction.move('b', { parentId: null, index: 1 }),
        ),
      );
    } else {
      await setProps({
        items: [{ id: 'a', label: 'A', children: [{ id: 'd', label: 'D', children: [b] }, c] }],
      });
    }

    expect(screen.getByTestId('gt-a')).toBe(wrapper);
    expect(within(wrapper).getByTestId('item-c')).toBeInTheDocument();
    expect(within(wrapper).queryAllByTestId('item-b')).toHaveLength(level === '3' ? 1 : 0);
    expect(screen.queryByTestId('item-b')?.getAttribute('aria-level') ?? null).toBe(level);
    expect(screen.queryByTestId('item-d')).toBeNull();
  });

  it('animates expansion changes driven by the controlled prop', async () => {
    const { rerender } = await render(<AnimatedTree expandedItems={[]} />);

    await rerender(<AnimatedTree expandedItems={['documents']} />);

    const expandingWrapper = screen.getByTestId('gt-documents');
    expect(expandingWrapper).not.toHaveAttribute('aria-hidden');
    expect(within(expandingWrapper).getByTestId('item-resume')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByTestId('gt-documents')).toBeNull());
    expect(screen.getByTestId('item-documents')).toHaveAttribute('aria-expanded', 'true');

    await rerender(<AnimatedTree expandedItems={[]} />);

    const collapsingWrapper = screen.getByTestId('gt-documents');
    expect(collapsingWrapper).toHaveAttribute('aria-hidden', 'true');
    expect(collapsingWrapper).toHaveAttribute('inert');
    expect(within(collapsingWrapper).getByTestId('item-resume')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByTestId('gt-documents')).toBeNull());
    expect(screen.getByTestId('item-documents')).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByTestId('item-resume')).toBeNull();
  });

  it('reverses smoothly instead of snapping when the direction flips mid-transition', async () => {
    await render(<AnimatedTree />);

    const documentsItem = screen.getByTestId('item-documents');
    const trigger = screen.getByTestId('trigger-documents');

    // Expand fully so we start from a settled expanded state.
    fireEvent.click(trigger);
    await waitFor(() => expect(screen.queryByTestId('gt-documents')).toBeNull());
    expect(documentsItem).toHaveAttribute('aria-expanded', 'true');

    // Start collapsing, then flip back to expanding before the transition ends.
    fireEvent.click(trigger);
    const wrapper = screen.getByTestId('gt-documents');

    let rejectCollapse!: () => void;
    const collapseFinished = new Promise<void>((_resolve, reject) => {
      rejectCollapse = reject;
    });
    let resolveExpand!: () => void;
    const expandFinished = new Promise<void>((resolve) => {
      resolveExpand = resolve;
    });
    const getAnimations = vi
      .fn()
      .mockReturnValueOnce([{ finished: collapseFinished, pending: false, playState: 'running' }])
      .mockReturnValue([{ finished: expandFinished, pending: false, playState: 'running' }]);
    Object.defineProperty(wrapper, 'getAnimations', { configurable: true, value: getAnimations });

    await act(async () => {
      await waitSingleFrame();
    });
    await waitFor(() => expect(getAnimations).toHaveBeenCalledOnce());

    fireEvent.click(trigger);
    rejectCollapse();

    // The interrupted collapse animation is cancelled by the flip. With
    // `treatAbortedAsFinished: true` this would fire the completion callback and
    // yank the group out of the DOM (a snap); the wrapper must instead survive
    // and wait for the new expand animation.
    await waitFor(() => expect(getAnimations.mock.calls.length).toBeGreaterThanOrEqual(2));
    expect(screen.getByTestId('gt-documents')).toBe(wrapper);

    resolveExpand();

    // The reversal settles back to the expanded state and unmounts the wrapper.
    await waitFor(() => expect(screen.queryByTestId('gt-documents')).toBeNull());
    expect(documentsItem).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('item-resume')).toBeInTheDocument();
  });
});
