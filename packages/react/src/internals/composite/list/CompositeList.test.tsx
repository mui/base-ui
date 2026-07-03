import { expect, vi } from 'vitest';
import * as React from 'react';
import { act, screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer } from '#test-utils';
import { CompositeList } from './CompositeList';
import { useCompositeListItem } from './useCompositeListItem';

describe('<CompositeList />', () => {
  const { render } = createRenderer();

  describe('prop: elementsRef', () => {
    function Item(props: { label?: string }) {
      const { ref, index } = useCompositeListItem();
      return (
        <div ref={ref} data-testid={props.label} data-index={props.label ? index : undefined}>
          {props.label}
        </div>
      );
    }

    it('cleans up refs on unmount', async () => {
      const elementsRef = {
        current: [] as Array<HTMLElement | null>,
      };
      const labelsRef = {
        current: [] as Array<string | null>,
      };
      const { unmount } = await render(
        <CompositeList elementsRef={elementsRef} labelsRef={labelsRef}>
          <Item />
          <Item />
          <Item />
        </CompositeList>,
      );

      expect(elementsRef.current).toHaveLength(3);
      expect(labelsRef.current).toHaveLength(3);

      unmount();
      expect(elementsRef.current).toHaveLength(0);
      expect(labelsRef.current).toHaveLength(0);
    });

    it('updates indexes when keyed groups reorder', async () => {
      function App() {
        const [reordered, setReordered] = React.useState(false);
        const elementsRef = React.useRef<Array<HTMLElement | null>>([]);
        const labelsRef = React.useRef<Array<string | null>>([]);
        const groups = reordered ? ['b', 'a'] : ['a', 'b'];

        return (
          <CompositeList elementsRef={elementsRef} labelsRef={labelsRef}>
            <button type="button" onClick={() => setReordered(true)}>
              Reorder
            </button>
            <div>
              {groups.map((group) => (
                <section key={group}>
                  <Item label={group} />
                </section>
              ))}
            </div>
          </CompositeList>
        );
      }

      // StrictMode masks the bug: it re-runs the item registration effects when
      // the groups move, which re-sorts the indices even without the fix.
      const { user } = await render(<App />, { strict: false });

      expect(screen.getByTestId('a')).toHaveAttribute('data-index', '0');
      expect(screen.getByTestId('b')).toHaveAttribute('data-index', '1');

      await user.click(screen.getByRole('button', { name: 'Reorder' }));

      await waitFor(() => {
        expect(screen.getByTestId('b')).toHaveAttribute('data-index', '0');
      });
      expect(screen.getByTestId('a')).toHaveAttribute('data-index', '1');
    });

    it('updates indexes when grouped items reorder alongside unrelated mutations', async () => {
      function App() {
        const elementsRef = React.useRef<Array<HTMLElement | null>>([]);
        const labelsRef = React.useRef<Array<string | null>>([]);

        return (
          <CompositeList elementsRef={elementsRef} labelsRef={labelsRef}>
            <div data-testid="list">
              <section data-testid="group-a">
                <Item label="a" />
              </section>
              <section data-testid="group-b">
                <Item label="b" />
              </section>
            </div>
          </CompositeList>
        );
      }

      await render(<App />);

      expect(screen.getByTestId('a')).toHaveAttribute('data-index', '0');
      expect(screen.getByTestId('b')).toHaveAttribute('data-index', '1');

      const list = screen.getByTestId('list');
      const groupA = screen.getByTestId('group-a');
      const groupB = screen.getByTestId('group-b');
      const badge = list.ownerDocument.createElement('span');
      badge.setAttribute('data-testid', 'badge');

      list.insertBefore(groupB, groupA);
      list.appendChild(badge);

      await waitFor(() => {
        expect(screen.getByTestId('b')).toHaveAttribute('data-index', '0');
      });
      expect(screen.getByTestId('a')).toHaveAttribute('data-index', '1');
      expect(screen.getByTestId('badge')).toBeInTheDocument();
    });

    it('ignores mutations for unrelated leaf nodes', async () => {
      function App(props: { onMapChange: (map: Map<Element, unknown>) => void }) {
        const elementsRef = React.useRef<Array<HTMLElement | null>>([]);
        const labelsRef = React.useRef<Array<string | null>>([]);

        return (
          <CompositeList
            elementsRef={elementsRef}
            labelsRef={labelsRef}
            onMapChange={props.onMapChange}
          >
            <button type="button" onClick={() => screen.getByTestId('badge').remove()}>
              Remove badge
            </button>
            <div data-testid="list">
              <Item label="a" />
              <span data-testid="badge" />
              <Item label="b" />
            </div>
          </CompositeList>
        );
      }

      const onMapChange = vi.fn();
      const { user } = await render(<App onMapChange={onMapChange} />);

      await waitFor(() => {
        expect(screen.getByTestId('b')).toHaveAttribute('data-index', '1');
      });
      onMapChange.mockClear();

      await user.click(screen.getByRole('button', { name: 'Remove badge' }));

      await waitFor(() => {
        expect(screen.queryByTestId('badge')).toBe(null);
      });
      expect(onMapChange).not.toHaveBeenCalled();
    });

    it('keeps controlled item indexes without compacting them', async () => {
      function Item(props: { index: number }) {
        const { ref } = useCompositeListItem({ index: props.index });
        return <div ref={ref} data-index={props.index} />;
      }

      const elementsRef = {
        current: [] as Array<HTMLElement | null>,
      };
      const labelsRef = {
        current: [] as Array<string | null>,
      };

      await render(
        <CompositeList elementsRef={elementsRef} labelsRef={labelsRef}>
          <Item index={2} />
          <Item index={0} />
        </CompositeList>,
      );

      expect(elementsRef.current).toHaveLength(3);
      expect(elementsRef.current[0]).toHaveAttribute('data-index', '0');
      expect(elementsRef.current[1]).toBe(undefined);
      expect(elementsRef.current[2]).toHaveAttribute('data-index', '2');
      expect(labelsRef.current).toHaveLength(3);
    });

    it('updates elements when controlled indexes change', async () => {
      function Item(props: { label: string; index: number }) {
        const { ref } = useCompositeListItem({ index: props.index });
        return <div ref={ref} data-label={props.label} />;
      }

      const elementsRef = {
        current: [] as Array<HTMLElement | null>,
      };

      function App(props: { swapped: boolean }) {
        return (
          <CompositeList elementsRef={elementsRef}>
            <Item label="a" index={props.swapped ? 1 : 0} />
            <Item label="b" index={props.swapped ? 0 : 1} />
          </CompositeList>
        );
      }

      const { setProps } = await render(<App swapped={false} />);

      expect(elementsRef.current[0]).toHaveAttribute('data-label', 'a');
      expect(elementsRef.current[1]).toHaveAttribute('data-label', 'b');

      await setProps({ swapped: true });

      expect(elementsRef.current[0]).toHaveAttribute('data-label', 'b');
      expect(elementsRef.current[1]).toHaveAttribute('data-label', 'a');
    });

    it('does not register controlled index -1', async () => {
      function Item() {
        const { ref } = useCompositeListItem({ index: -1 });
        return <div ref={ref} />;
      }

      const elementsRef = {
        current: [] as Array<HTMLElement | null>,
      };

      await render(
        <CompositeList elementsRef={elementsRef}>
          <Item />
        </CompositeList>,
      );

      expect(elementsRef.current).toHaveLength(0);
      expect(Object.hasOwn(elementsRef.current, '-1')).toBe(false);
    });

    it('updates refs when an item mounts from a nested state update', async () => {
      let addItem: (() => void) | undefined;

      function Item(props: { label: string }) {
        const { ref } = useCompositeListItem();
        return <div ref={ref} data-label={props.label} />;
      }

      function DeepSection() {
        const [extra, setExtra] = React.useState(false);
        addItem = () => setExtra(true);
        return extra ? <Item label="extra" /> : null;
      }

      const elementsRef = {
        current: [] as Array<HTMLElement | null>,
      };

      await render(
        <CompositeList elementsRef={elementsRef}>
          <Item label="a" />
          <DeepSection />
          <Item label="b" />
        </CompositeList>,
      );

      expect(elementsRef.current).toHaveLength(2);

      await act(async () => {
        addItem?.();
      });

      expect(elementsRef.current).toHaveLength(3);
      expect(elementsRef.current[0]).toHaveAttribute('data-label', 'a');
      expect(elementsRef.current[1]).toHaveAttribute('data-label', 'extra');
      expect(elementsRef.current[2]).toHaveAttribute('data-label', 'b');
    });

    it('updates labels without re-registering the item', async () => {
      function Item(props: { label: string }) {
        const { ref } = useCompositeListItem({ label: props.label });
        return <div ref={ref}>fallback</div>;
      }

      const elementsRef = {
        current: [] as Array<HTMLElement | null>,
      };
      const labelsRef = {
        current: [] as Array<string | null>,
      };

      function TestComponent(props: { label: string; onMapChange: () => void }) {
        return (
          <CompositeList
            elementsRef={elementsRef}
            labelsRef={labelsRef}
            onMapChange={props.onMapChange}
          >
            <Item label={props.label} />
          </CompositeList>
        );
      }

      const onMapChange = vi.fn();

      const { setProps } = await render(<TestComponent label="one" onMapChange={onMapChange} />);

      expect(labelsRef.current[0]).toBe('one');

      const mapChangeCallCount = onMapChange.mock.calls.length;

      await setProps({ label: 'two' });

      expect(labelsRef.current[0]).toBe('two');
      expect(onMapChange).toHaveBeenCalledTimes(mapChangeCallCount);
    });

    describe('mixed controlled and uncontrolled indexes', () => {
      const expectedMessage =
        'Base UI: A CompositeList is mixing controlled and uncontrolled indexes. ' +
        'Decide between using a controlled or uncontrolled index prop for all items in the CompositeList. ' +
        'The indexing mode is determined by the first registered item. ' +
        'An item is considered controlled when its index prop is not `undefined`.';

      function Item(props: { index?: number | undefined }) {
        const { ref } = useCompositeListItem({ index: props.index });
        return <div ref={ref} />;
      }

      it('warns when a controlled item is followed by an uncontrolled item', async () => {
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        await render(
          <CompositeList elementsRef={{ current: [] }}>
            <Item index={0} />
            <Item />
          </CompositeList>,
        );

        expect(console.error).toHaveBeenCalledWith(expectedMessage);

        errorSpy.mockRestore();
      });

      it('warns when an uncontrolled item is followed by a controlled item', async () => {
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        await render(
          <CompositeList elementsRef={{ current: [] }}>
            <Item />
            <Item index={1} />
          </CompositeList>,
        );

        expect(console.error).toHaveBeenCalledWith(expectedMessage);

        errorSpy.mockRestore();
      });
    });
  });
});
