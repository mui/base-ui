import * as React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { act, screen } from '@mui/internal-test-utils';
import { describeConformance } from '#test-utils';
import { Draggable } from '@base-ui/react/draggable';
import { createDndRenderer, testDragKind } from '../../../test/dndEngine';
import { fireDrag, lift, setupDragEngineTests } from '../../../test/dnd';

setupDragEngineTests();

function getTrigger() {
  return document.querySelector<HTMLElement>('[data-trigger]')!;
}

function getPreview() {
  return document.querySelector<HTMLElement>('[data-drag-preview]');
}

describe('<Draggable.Preview />', () => {
  const { renderDnd, render } = createDndRenderer();

  describeConformance(<Draggable.Preview />, () => ({
    refInstanceof: window.HTMLDivElement,
    async render(node) {
      const view = await renderDnd(
        <Draggable.Root kind={testDragKind}>
          <Draggable.Trigger data-trigger="" />
          <Draggable.Positioner>{node}</Draggable.Positioner>
        </Draggable.Root>,
      );
      fireDrag.dragStart(getTrigger());
      return view;
    },
  }));

  describe('without children', () => {
    it("renders the trigger's element, props and children again", async () => {
      await renderDnd(
        <Draggable.Root kind={testDragKind}>
          <Draggable.Trigger
            data-trigger=""
            render={<li />}
            className="card"
            style={{ color: 'red' }}
            title="Report"
          >
            <strong>Report</strong>
          </Draggable.Trigger>
          <Draggable.Positioner render={<ul />}>
            <Draggable.Preview />
          </Draggable.Positioner>
        </Draggable.Root>,
      );
      await lift(getTrigger());

      const preview = getPreview()!;
      expect(preview.tagName).toBe('LI');
      expect(preview).toHaveClass('card');
      expect(preview).toHaveAttribute('title', 'Report');
      expect(preview.style.color).toBe('red');
      expect(preview.querySelector('strong')).toHaveTextContent('Report');
    });

    it("leaves out the trigger's id and event handlers", async () => {
      const onClick = vi.fn();
      await renderDnd(
        <Draggable.Root kind={testDragKind}>
          <Draggable.Trigger data-trigger="" id="report" onClick={onClick} />
          <Draggable.Positioner>
            <Draggable.Preview />
          </Draggable.Positioner>
        </Draggable.Root>,
      );
      await lift(getTrigger());

      const preview = getPreview()!;
      expect(preview).not.toHaveAttribute('id');
      // Inert in the page, so dispatch the click directly.
      act(() => preview.click());
      expect(onClick).not.toHaveBeenCalled();
    });

    it("leaves the ref of the trigger's render element on the trigger", async () => {
      const ref = React.createRef<HTMLLIElement>();
      await renderDnd(
        <Draggable.Root kind={testDragKind}>
          <Draggable.Trigger data-trigger="" render={<li ref={ref} />} />
          <Draggable.Positioner render={<ul />}>
            <Draggable.Preview />
          </Draggable.Positioner>
        </Draggable.Root>,
      );
      const trigger = getTrigger();
      expect(ref.current).toBe(trigger);
      await lift(trigger);

      expect(getPreview()!.tagName).toBe('LI');
      expect(ref.current).toBe(trigger);
    });

    it('resolves function props with the state the trigger had before the pickup', async () => {
      await renderDnd(
        <Draggable.Root kind={testDragKind}>
          <Draggable.Trigger
            data-trigger=""
            className={(state) => (state.dragging ? 'dragging' : 'idle')}
          />
          <Draggable.Positioner>
            <Draggable.Preview />
          </Draggable.Positioner>
        </Draggable.Root>,
      );
      await lift(getTrigger());

      expect(getTrigger()).toHaveClass('dragging');
      expect(getPreview()).toHaveClass('idle');
    });

    it("lets its own props override the trigger's", async () => {
      await renderDnd(
        <Draggable.Root kind={testDragKind}>
          <Draggable.Trigger data-trigger="" className="card" title="Trigger" />
          <Draggable.Positioner>
            <Draggable.Preview className="preview" title="Preview" />
          </Draggable.Positioner>
        </Draggable.Root>,
      );
      await lift(getTrigger());

      const preview = getPreview()!;
      expect(preview).toHaveClass('preview');
      expect(preview).not.toHaveClass('card');
      expect(preview).toHaveAttribute('title', 'Preview');
    });

    it("takes the trigger's size", async () => {
      await renderDnd(
        <Draggable.Root kind={testDragKind}>
          <Draggable.Trigger data-trigger="" />
          <Draggable.Positioner>
            <Draggable.Preview />
          </Draggable.Positioner>
        </Draggable.Root>,
      );
      await lift(getTrigger());

      const preview = getPreview()!;
      expect(preview.style.width).toBe('var(--drag-source-width)');
      expect(preview.style.height).toBe('var(--drag-source-height)');
    });

    it('renders no preview of its own when the preview parts sit inside the trigger', async () => {
      await renderDnd(
        <Draggable.Root kind={testDragKind}>
          <Draggable.Trigger data-trigger="">
            Report
            <Draggable.Portal>
              <Draggable.Positioner>
                <Draggable.Preview />
              </Draggable.Positioner>
            </Draggable.Portal>
          </Draggable.Trigger>
        </Draggable.Root>,
      );
      await lift(getTrigger());

      expect(document.querySelectorAll('[data-drag-preview]')).toHaveLength(1);
      expect(getPreview()).toHaveTextContent('Report');
    });

    it('does not register the drag parts it renders again', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      await renderDnd(
        <Draggable.Root kind={testDragKind}>
          <Draggable.Trigger data-trigger="">
            <Draggable.Handle data-handle="" />
          </Draggable.Trigger>
          <Draggable.Positioner>
            <Draggable.Preview />
          </Draggable.Positioner>
        </Draggable.Root>,
      );
      await lift(document.querySelector<HTMLElement>('[data-handle]')!);

      // A second registered handle would warn.
      expect(getPreview()!.querySelector('[data-handle]')).not.toBeNull();
      expect(warn).not.toHaveBeenCalled();
    });
  });

  describe('with children', () => {
    it('renders them in a <div>', async () => {
      await renderDnd(
        <Draggable.Root kind={testDragKind}>
          <Draggable.Trigger data-trigger="" className="card">
            Trigger
          </Draggable.Trigger>
          <Draggable.Positioner>
            <Draggable.Preview>Moving 1 item</Draggable.Preview>
          </Draggable.Positioner>
        </Draggable.Root>,
      );
      await lift(getTrigger());

      const preview = getPreview()!;
      expect(preview.tagName).toBe('DIV');
      expect(preview).toHaveTextContent('Moving 1 item');
      expect(preview).not.toHaveClass('card');
      expect(preview.style.width).toBe('');
    });

    it('renders nothing inside it for null children', async () => {
      await renderDnd(
        <Draggable.Root kind={testDragKind}>
          <Draggable.Trigger data-trigger="">Trigger</Draggable.Trigger>
          <Draggable.Positioner>
            <Draggable.Preview>{null}</Draggable.Preview>
          </Draggable.Positioner>
        </Draggable.Root>,
      );
      await lift(getTrigger());

      expect(getPreview()).toBeEmptyDOMElement();
    });

    it('shows state updates while dragging', async () => {
      let increment!: () => void;
      function Counter() {
        const [count, setCount] = React.useState(0);
        increment = () => setCount((value) => value + 1);
        return <span>Count {count}</span>;
      }
      await renderDnd(
        <Draggable.Root kind={testDragKind}>
          <Draggable.Trigger data-trigger="" />
          <Draggable.Positioner>
            <Draggable.Preview>
              <Counter />
            </Draggable.Preview>
          </Draggable.Positioner>
        </Draggable.Root>,
      );
      await lift(getTrigger());
      expect(getPreview()).toHaveTextContent('Count 0');

      act(() => increment());
      expect(getPreview()).toHaveTextContent('Count 1');
    });

    it('reads React context from where it is rendered', async () => {
      const Context = React.createContext('outside');
      function Label() {
        return <span>{React.useContext(Context)}</span>;
      }
      await renderDnd(
        <Context.Provider value="inside">
          <Draggable.Root kind={testDragKind}>
            <Draggable.Trigger data-trigger="" />
            <Draggable.Portal>
              <Draggable.Positioner>
                <Draggable.Preview>
                  <Label />
                </Draggable.Preview>
              </Draggable.Positioner>
            </Draggable.Portal>
          </Draggable.Root>
        </Context.Provider>,
      );
      await lift(getTrigger());

      expect(getPreview()).toHaveTextContent('inside');
    });
  });

  it('throws outside a Draggable.Positioner', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(
      render(
        <Draggable.Provider>
          <Draggable.Root kind={testDragKind}>
            <Draggable.Preview />
          </Draggable.Root>
        </Draggable.Provider>,
      ),
    ).rejects.toThrow(/DraggablePositionerContext is missing/);
    errorSpy.mockRestore();
    expect(screen.queryByText('Preview')).toBeNull();
  });
});
