import { vi, expect, describe, it, beforeEach, afterEach, onTestFinished } from 'vitest';
import { act, fireEvent, flushMicrotasks, render, screen } from '@mui/internal-test-utils';
import * as React from 'react';
import { isJSDOM } from '#test-utils';
import { useFloating } from '../../../../test/floating-ui-tests/useFloating';
import { PopupTreeContext, PopupTreeNode } from '../tree/PopupTree';
import { PopupTreeRegistry } from '../tree/PopupTreeRegistry';
import { useHoverPopupInteraction } from './useHoverPopupInteraction';
import { useHoverTriggerInteraction } from './useHoverTriggerInteraction';

describe.skipIf(!isJSDOM)('useHoverPopupInteraction', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function App(props: { closeDelay?: number; nodeId?: string }) {
    const [open, setOpen] = React.useState(false);
    const triggerElementRef = React.useRef<Element | null>(null);
    const { refs, context } = useFloating({ open, onOpenChange: setOpen, nodeId: props.nodeId });
    const referenceProps = useHoverTriggerInteraction(context.rootStore, {
      triggerElementRef,
      delay: { close: props.closeDelay },
    });
    useHoverPopupInteraction(context.rootStore, { closeDelay: props.closeDelay });

    return (
      <React.Fragment>
        <button
          {...referenceProps}
          ref={(node) => {
            refs.setReference(node);
            triggerElementRef.current = node;
          }}
        />
        {open && <div role="tooltip" ref={refs.setFloating} />}
      </React.Fragment>
    );
  }

  it('closes after the close delay when the pointer leaves the floating element', async () => {
    render(<App closeDelay={100} />);

    const button = screen.getByRole('button');
    fireEvent.mouseEnter(button);
    await flushMicrotasks();

    const tooltip = screen.getByRole('tooltip');
    fireEvent(button, new MouseEvent('mouseleave', { relatedTarget: tooltip }));
    fireEvent.mouseEnter(tooltip);
    fireEvent.mouseLeave(tooltip);

    await act(async () => {
      vi.advanceTimersByTime(99);
    });

    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(1);
    });

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('keeps the popup open when the floating element is entered before closeDelay elapses', async () => {
    render(<App closeDelay={500} />);

    const button = screen.getByRole('button');
    fireEvent.mouseEnter(button);
    await flushMicrotasks();

    const tooltip = screen.getByRole('tooltip');
    fireEvent(button, new MouseEvent('mouseleave', { relatedTarget: tooltip }));

    await act(async () => {
      vi.advanceTimersByTime(499);
    });

    fireEvent.mouseEnter(tooltip);

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    fireEvent.mouseLeave(tooltip);

    await act(async () => {
      vi.advanceTimersByTime(499);
    });

    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(1);
    });

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it.each([
    { childState: 'open', childOpen: true },
    { childState: 'closed', childOpen: false },
  ])(
    'keeps the popup open when the pointer leaves it for the floating element of a $childState descendant',
    async ({ childOpen }) => {
      const tree = new PopupTreeRegistry();
      const childFloating = document.createElement('div');
      document.body.appendChild(childFloating);
      onTestFinished(() => childFloating.remove());
      tree.addNode({
        id: 'child',
        parentId: 'root',
        context: {
          open: childOpen,
          elements: { floating: childFloating, domReference: null },
          rootStore: { context: {} },
        },
      });

      render(
        <PopupTreeContext.Provider value={tree}>
          <App closeDelay={100} nodeId="root" />
        </PopupTreeContext.Provider>,
      );

      const button = screen.getByRole('button');
      fireEvent.mouseEnter(button);
      await flushMicrotasks();

      const tooltip = screen.getByRole('tooltip');
      fireEvent(button, new MouseEvent('mouseleave', { relatedTarget: tooltip }));
      fireEvent.mouseEnter(tooltip);
      fireEvent.mouseLeave(tooltip, { relatedTarget: childFloating });

      await act(async () => {
        vi.advanceTimersByTime(200);
      });

      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    },
  );

  it.each([
    { name: 'stays open', childOpen: true },
    { name: 'closes', childOpen: false },
  ])(
    'uses the node it renders in for a popup without its own node, and $name on leave',
    async ({ childOpen }) => {
      const tree = new PopupTreeRegistry();
      tree.addNode({
        id: 'child',
        parentId: 'root',
        context: {
          open: childOpen,
          elements: { floating: null, domReference: null },
          rootStore: { context: {} },
        },
      });

      render(
        <PopupTreeContext.Provider value={tree}>
          <PopupTreeNode id="root">
            <App closeDelay={100} />
          </PopupTreeNode>
        </PopupTreeContext.Provider>,
      );

      const button = screen.getByRole('button');
      fireEvent.mouseEnter(button);
      await flushMicrotasks();

      const tooltip = screen.getByRole('tooltip');
      fireEvent(button, new MouseEvent('mouseleave', { relatedTarget: tooltip }));
      fireEvent.mouseEnter(tooltip);
      fireEvent.mouseLeave(tooltip, { relatedTarget: document.body });

      await act(async () => {
        vi.advanceTimersByTime(200);
      });

      expect(screen.queryByRole('tooltip') != null).toBe(childOpen);
    },
  );
});
