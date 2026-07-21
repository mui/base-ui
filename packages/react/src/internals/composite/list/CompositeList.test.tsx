import { expect, vi } from 'vitest';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { act, screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer } from '#test-utils';
import { CompositeList } from './CompositeList';
import { useCompositeListItem } from './useCompositeListItem';

describe('<CompositeList />', () => {
  const { render, renderToString } = createRenderer();

  describe('prop: elementsRef', () => {
    function Item(props: { label?: string; index?: number }) {
      const { ref, index } = useCompositeListItem({ index: props.index });
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

    it('keeps refs populated for items whose guessed index is already correct', async () => {
      function GuessedItem(props: { label: string }) {
        const { ref } = useCompositeListItem({ guess: true, label: props.label });
        return (
          <div ref={ref} data-testid={props.label}>
            {props.label}
          </div>
        );
      }

      const elementsRef = {
        current: [] as Array<HTMLElement | null>,
      };
      const labelsRef = {
        current: [] as Array<string | null>,
      };

      await render(
        <CompositeList elementsRef={elementsRef} labelsRef={labelsRef}>
          <GuessedItem label="a" />
          <GuessedItem label="b" />
          <GuessedItem label="c" />
        </CompositeList>,
      );

      // A React 18 Strict Mode effect replay empties the arrays without reattaching refs
      // when every guessed index is already correct. The list must repopulate them itself.
      await waitFor(() => {
        expect(elementsRef.current[0]).toBe(screen.getByTestId('a'));
      });
      expect(elementsRef.current[1]).toBe(screen.getByTestId('b'));
      expect(elementsRef.current[2]).toBe(screen.getByTestId('c'));
      expect(labelsRef.current).toEqual(['a', 'b', 'c']);
    });

    it('only publishes maps that are aligned with the element registry', async () => {
      const elementsRef = {
        current: [] as Array<HTMLElement | null>,
      };
      const snapshots: Array<{
        elements: Array<HTMLElement | null>;
        mapElements: Element[];
      }> = [];

      function App(props: { items: string[] }) {
        return (
          <CompositeList
            elementsRef={elementsRef}
            onMapChange={(map) => {
              snapshots.push({
                elements: [...elementsRef.current],
                mapElements: Array.from(map.keys()),
              });
            }}
          >
            {props.items.map((item) => (
              <Item key={item} label={item} />
            ))}
          </CompositeList>
        );
      }

      const { setProps } = await render(<App items={['a', 'b', 'c']} />, { strict: false });

      expect(snapshots).toHaveLength(1);

      await setProps({ items: ['a', 'b', 'c', 'd'] });

      expect(snapshots).toHaveLength(2);
      snapshots.forEach((snapshot) => {
        expect(snapshot.elements).toEqual(snapshot.mapElements);
      });
    });

    it('registers explicitly indexed items in their index-addressed slots', async () => {
      const elementsRef = {
        current: [] as Array<HTMLElement | null>,
      };
      const onMapChange = vi.fn();

      await render(
        <CompositeList elementsRef={elementsRef} onMapChange={onMapChange}>
          <Item label="two" index={2} />
          <Item label="zero" index={0} />
          <Item label="one" index={1} />
        </CompositeList>,
      );

      const map = onMapChange.mock.lastCall?.[0] as Map<Element, { index: number }>;
      expect(Array.from(map.values(), (metadata) => metadata.index)).toEqual([0, 1, 2]);
      expect(elementsRef.current).toEqual([
        screen.getByTestId('zero'),
        screen.getByTestId('one'),
        screen.getByTestId('two'),
      ]);
    });

    it('reserves explicit slots when assigning automatic indexes', async () => {
      const elementsRef = {
        current: [] as Array<HTMLElement | null>,
      };

      await render(
        <CompositeList elementsRef={elementsRef}>
          <Item label="automatic one" />
          <Item label="explicit zero" index={0} />
          <Item label="automatic two" />
        </CompositeList>,
      );

      expect(elementsRef.current).toEqual([
        screen.getByTestId('explicit zero'),
        screen.getByTestId('automatic one'),
        screen.getByTestId('automatic two'),
      ]);
      expect(screen.getByTestId('automatic one')).toHaveAttribute('data-index', '1');
      expect(screen.getByTestId('automatic two')).toHaveAttribute('data-index', '2');
    });

    it('does not consume an index guess for an explicitly indexed item', async () => {
      const baselineElementsRef = {
        current: [] as Array<HTMLElement | null>,
      };
      const elementsRef = {
        current: [] as Array<HTMLElement | null>,
      };

      function GuessedItem(props: { label: string; index?: number }) {
        const { ref, index } = useCompositeListItem({ guess: true, index: props.index });
        const initialIndex = React.useRef(index).current;
        return <div ref={ref} data-testid={props.label} data-initial-index={initialIndex} />;
      }

      await render(
        <React.Fragment>
          <CompositeList elementsRef={baselineElementsRef}>
            <GuessedItem label="baseline automatic" />
          </CompositeList>
          <CompositeList elementsRef={elementsRef}>
            <GuessedItem label="explicit" index={1} />
            <GuessedItem label="automatic" />
          </CompositeList>
        </React.Fragment>,
      );

      // React 18 Strict Mode consumes a guess during its discarded render. Compare against
      // the same runtime's baseline to isolate whether the explicit item consumed another.
      expect(screen.getByTestId('automatic').dataset.initialIndex).toBe(
        screen.getByTestId('baseline automatic').dataset.initialIndex,
      );
      expect(elementsRef.current[0]).toBe(screen.getByTestId('automatic'));
      expect(elementsRef.current[1]).toBe(screen.getByTestId('explicit'));
    });

    it('populates a replacement element registry when the items are unchanged', async () => {
      const firstElementsRef = {
        current: [] as Array<HTMLElement | null>,
      };
      const secondElementsRef = {
        current: [null, null] as Array<HTMLElement | null>,
      };

      function App() {
        const [useSecondRef, setUseSecondRef] = React.useState(false);
        return (
          <CompositeList elementsRef={useSecondRef ? secondElementsRef : firstElementsRef}>
            <button type="button" onClick={() => setUseSecondRef(true)}>
              Replace ref
            </button>
            <Item label="item" />
          </CompositeList>
        );
      }

      const { user } = await render(<App />);
      expect(firstElementsRef.current).toEqual([screen.getByTestId('item')]);

      await user.click(screen.getByRole('button', { name: 'Replace ref' }));
      expect(secondElementsRef.current).toEqual([screen.getByTestId('item')]);
    });

    it('registers a replacement render target', async () => {
      const elementsRef = {
        current: [] as Array<HTMLElement | null>,
      };

      function SwitchingItem() {
        const [useButton, setUseButton] = React.useState(false);
        const { ref } = useCompositeListItem();

        return (
          <React.Fragment>
            <button type="button" onClick={() => setUseButton(true)}>
              Replace target
            </button>
            {useButton ? (
              <button ref={ref} data-testid="item" type="button">
                item
              </button>
            ) : (
              <div ref={ref} data-testid="item">
                item
              </div>
            )}
          </React.Fragment>
        );
      }

      const { user } = await render(
        <CompositeList elementsRef={elementsRef}>
          <SwitchingItem />
        </CompositeList>,
      );
      const initialItem = screen.getByTestId('item');

      await user.click(screen.getByRole('button', { name: 'Replace target' }));

      const replacementItem = screen.getByTestId('item');
      expect(replacementItem).not.toBe(initialItem);
      expect(initialItem.isConnected).toBe(false);
      expect(elementsRef.current).toEqual([replacementItem]);
    });

    it('does not register negative explicit indexes', async () => {
      const elementsRef = {
        current: [] as Array<HTMLElement | null>,
      };

      await render(
        <CompositeList elementsRef={elementsRef}>
          <Item label="item" index={-1} />
        </CompositeList>,
      );

      expect(elementsRef.current).toHaveLength(0);
      expect(Object.hasOwn(elementsRef.current, '-1')).toBe(false);
    });

    it('updates refs when an item mounts from a nested state update', async () => {
      const elementsRef = {
        current: [] as Array<HTMLElement | null>,
      };

      function DeepSection() {
        const [showItem, setShowItem] = React.useState(false);
        return (
          <React.Fragment>
            <button type="button" onClick={() => setShowItem(true)}>
              Add item
            </button>
            {showItem && <Item label="nested" />}
          </React.Fragment>
        );
      }

      const { user } = await render(
        <CompositeList elementsRef={elementsRef}>
          <Item label="first" />
          <DeepSection />
          <Item label="last" />
        </CompositeList>,
      );

      await user.click(screen.getByRole('button', { name: 'Add item' }));

      expect(elementsRef.current).toEqual([
        screen.getByTestId('first'),
        screen.getByTestId('nested'),
        screen.getByTestId('last'),
      ]);
    });

    it('updates refs when an item unmounts from a nested state update', async () => {
      const elementsRef = {
        current: [] as Array<HTMLElement | null>,
      };
      const onMapChange = vi.fn();

      function DeepSection() {
        const [showItem, setShowItem] = React.useState(true);
        return (
          <React.Fragment>
            <button type="button" onClick={() => setShowItem(false)}>
              Remove item
            </button>
            {showItem && <Item label="nested" />}
          </React.Fragment>
        );
      }

      const { user } = await render(
        <CompositeList elementsRef={elementsRef} onMapChange={onMapChange}>
          <Item label="first" />
          <DeepSection />
          <Item label="last" />
        </CompositeList>,
      );

      expect(elementsRef.current).toHaveLength(3);

      await user.click(screen.getByRole('button', { name: 'Remove item' }));

      expect(elementsRef.current).toEqual([
        screen.getByTestId('first'),
        screen.getByTestId('last'),
      ]);
      const map = onMapChange.mock.lastCall?.[0] as Map<Element, unknown>;
      expect(Array.from(map.keys())).toEqual([
        screen.getByTestId('first'),
        screen.getByTestId('last'),
      ]);
      expect(screen.getByTestId('last')).toHaveAttribute('data-index', '1');
    });

    it('assigns correct guessed indexes during the first render', async () => {
      const renderCounts: Record<string, number> = { a: 0, b: 0, c: 0 };
      const initialIndexes: Record<string, number> = {};

      function GuessedItem(props: { label: string }) {
        const { ref, index } = useCompositeListItem({ guess: true });
        renderCounts[props.label] += 1;
        if (!(props.label in initialIndexes)) {
          initialIndexes[props.label] = index;
        }
        return <div ref={ref} data-testid={props.label} data-index={index} />;
      }

      const elementsRef = {
        current: [] as Array<HTMLElement | null>,
      };

      await render(
        <CompositeList elementsRef={elementsRef}>
          <GuessedItem label="a" />
          <GuessedItem label="b" />
          <GuessedItem label="c" />
        </CompositeList>,
        // The guess exists to avoid the corrective re-render in production behavior;
        // Strict Mode's double-render would obscure the count.
        { strict: false },
      );

      expect(initialIndexes).toEqual({ a: 0, b: 1, c: 2 });
      expect(renderCounts).toEqual({ a: 1, b: 1, c: 1 });
      expect(elementsRef.current).toEqual([
        screen.getByTestId('a'),
        screen.getByTestId('b'),
        screen.getByTestId('c'),
      ]);
    });

    it('re-registers an item when its explicit index changes or is removed', async () => {
      const refCalls: Array<HTMLElement | null> = [];
      const elementsRef = {
        current: [] as Array<HTMLElement | null>,
      };

      function TrackedItem(props: { index?: number }) {
        const { ref, index } = useCompositeListItem({ guess: true, index: props.index });
        const trackingRef = React.useCallback(
          (node: HTMLElement | null) => {
            refCalls.push(node);
            ref(node);
          },
          [ref],
        );
        return <div ref={trackingRef} data-testid="tracked" data-index={index} />;
      }

      function App(props: { index?: number }) {
        return (
          <CompositeList elementsRef={elementsRef}>
            <TrackedItem index={props.index} />
          </CompositeList>
        );
      }

      const { setProps } = await render(<App index={0} />, { strict: false });
      const tracked = screen.getByTestId('tracked');
      expect(refCalls).toEqual([tracked]);
      expect(elementsRef.current[0]).toBe(tracked);

      // Moving a controlled item re-registers it at the new slot. The ref identity depends on
      // the registration data, so the element's refs cycle once: registration ownership for a
      // shared node is decided by ref attachment order, which an effect-based republish would
      // escape.
      await setProps({ index: 2 });

      expect(refCalls).toEqual([tracked, null, tracked]);
      expect(screen.getByTestId('tracked')).toHaveAttribute('data-index', '2');
      expect(Object.hasOwn(elementsRef.current, 0)).toBe(false);
      expect(elementsRef.current[2]).toBe(tracked);

      await setProps({ index: undefined });

      await waitFor(() => {
        expect(screen.getByTestId('tracked')).toHaveAttribute('data-index', '0');
      });
      expect(refCalls).toEqual([tracked, null, tracked, null, tracked]);
      expect(elementsRef.current).toEqual([tracked]);
    });

    it('does not detach item refs when an index shifts', async () => {
      const refCalls: Array<HTMLElement | null> = [];

      function TrackedItem() {
        const { ref, index } = useCompositeListItem();
        const trackingRef = React.useCallback(
          (node: HTMLElement | null) => {
            refCalls.push(node);
            ref(node);
          },
          [ref],
        );
        return <div ref={trackingRef} data-testid="tracked" data-index={index} />;
      }

      function App(props: { items: string[] }) {
        const elementsRef = React.useRef<Array<HTMLElement | null>>([]);
        return (
          <CompositeList elementsRef={elementsRef}>
            {props.items.map((item) =>
              item === 'tracked' ? <TrackedItem key={item} /> : <Item key={item} label={item} />,
            )}
          </CompositeList>
        );
      }

      // Strict Mode replays initial refs; production behavior is what the
      // stability contract targets.
      const { setProps } = await render(<App items={['tracked']} />, { strict: false });
      const tracked = screen.getByTestId('tracked');
      expect(refCalls).toEqual([tracked]);

      await setProps({ items: ['before', 'tracked'] });
      await waitFor(() => {
        expect(screen.getByTestId('tracked')).toHaveAttribute('data-index', '1');
      });
      expect(refCalls).toEqual([tracked]);
    });

    it('excludes items detached outside React from the registry', async () => {
      const elementsRef = {
        current: [] as Array<HTMLElement | null>,
      };
      const onMapChange = vi.fn();

      function App(props: { extra: boolean }) {
        return (
          <CompositeList elementsRef={elementsRef} onMapChange={onMapChange}>
            <div>
              <Item label="a" />
              <Item label="b" />
              <Item label="c" />
            </div>
            {props.extra && <Item label="d" />}
          </CompositeList>
        );
      }

      const { setProps } = await render(<App extra={false} />, { strict: false });

      // Detaching a registered item outside React never fires its ref callback, so it
      // stays registered while disconnected. `compareDocumentPosition` is meaningless
      // for it, and leaving it in would scramble the order of every other item.
      const detached = screen.getByTestId('b');
      detached.remove();

      await setProps({ extra: true });

      expect(elementsRef.current).toEqual([
        screen.getByTestId('a'),
        screen.getByTestId('c'),
        screen.getByTestId('d'),
      ]);
      const map = onMapChange.mock.lastCall?.[0] as Map<Element, unknown>;
      expect(Array.from(map.keys())).toEqual([
        screen.getByTestId('a'),
        screen.getByTestId('c'),
        screen.getByTestId('d'),
      ]);
    });

    it('skips detached items while verifying order after a move', async () => {
      function App() {
        const elementsRef = React.useRef<Array<HTMLElement | null>>([]);
        return (
          <CompositeList elementsRef={elementsRef}>
            <div data-testid="list">
              <Item label="a" />
              <Item label="b" />
              <Item label="c" />
            </div>
          </CompositeList>
        );
      }

      await render(<App />, { strict: false });

      const list = screen.getByTestId('list');
      const a = screen.getByTestId('a');
      const c = screen.getByTestId('c');

      // One batch that both detaches a registered item and moves another. The move makes the
      // observer verify order, and the verification walks the detached item, which no longer
      // has a meaningful document position.
      screen.getByTestId('b').remove();
      list.insertBefore(c, a);

      await waitFor(() => {
        expect(screen.getByTestId('c')).toHaveAttribute('data-index', '0');
      });
      expect(screen.getByTestId('a')).toHaveAttribute('data-index', '1');
    });

    it('updates the registry when a mounted item stops rendering an element', async () => {
      const elementsRef = {
        current: [] as Array<HTMLElement | null>,
      };

      function VanishingItem() {
        // Starts with no element at all, so the item registers nothing until it renders one.
        const [hidden, setHidden] = React.useState(true);
        const { ref, index } = useCompositeListItem({ label: hidden ? 'hidden' : 'shown' });
        return (
          <React.Fragment>
            <button type="button" onClick={() => setHidden((value) => !value)}>
              Toggle element
            </button>
            {!hidden && (
              <div ref={ref} data-testid="vanishing" data-index={index}>
                vanishing
              </div>
            )}
          </React.Fragment>
        );
      }

      const { user } = await render(
        <CompositeList elementsRef={elementsRef}>
          <VanishingItem />
          <Item label="tail" />
        </CompositeList>,
      );

      expect(elementsRef.current).toEqual([screen.getByTestId('tail')]);

      await user.click(screen.getByRole('button', { name: 'Toggle element' }));
      expect(elementsRef.current).toHaveLength(2);

      // The item stays mounted and subscribed while its element detaches, so the next
      // publication reaches a subscriber whose node is gone.
      await user.click(screen.getByRole('button', { name: 'Toggle element' }));

      expect(elementsRef.current).toEqual([screen.getByTestId('tail')]);
      expect(screen.getByTestId('tail')).toHaveAttribute('data-index', '0');
    });

    it('updates indexes when a leaf item moves outside React', async () => {
      const elementsRef = {
        current: [] as Array<HTMLElement | null>,
      };

      await render(
        <CompositeList elementsRef={elementsRef}>
          <div data-testid="container">
            <Item label="a" />
            <Item label="b" />
            <Item label="c" />
          </div>
        </CompositeList>,
      );

      expect(screen.getByTestId('a')).toHaveAttribute('data-index', '0');

      const container = screen.getByTestId('container');
      container.appendChild(screen.getByTestId('a'));

      await waitFor(() => {
        expect(screen.getByTestId('a')).toHaveAttribute('data-index', '2');
      });
      expect(screen.getByTestId('b')).toHaveAttribute('data-index', '0');
      expect(screen.getByTestId('c')).toHaveAttribute('data-index', '1');
      expect(elementsRef.current).toEqual([
        screen.getByTestId('b'),
        screen.getByTestId('c'),
        screen.getByTestId('a'),
      ]);
    });

    it('observes each shared mutation root once', async () => {
      const observe = vi.spyOn(MutationObserver.prototype, 'observe');
      const elementsRef = {
        current: [] as Array<HTMLElement | null>,
      };

      await render(
        <CompositeList elementsRef={elementsRef}>
          <div data-testid="list">
            <Item label="a" />
            <Item label="b" />
            <Item label="c" />
          </div>
        </CompositeList>,
        { strict: false },
      );

      const observedRoots = observe.mock.calls.map(([root]) => root);
      observe.mockRestore();
      expect(observedRoots).toEqual([screen.getByTestId('list')]);
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

    it('observes reorders after the list grows from one item', async () => {
      function App(props: { items: string[] }) {
        const elementsRef = React.useRef<Array<HTMLElement | null>>([]);
        return (
          <CompositeList elementsRef={elementsRef}>
            {props.items.map((item) => (
              <Item key={item} label={item} />
            ))}
          </CompositeList>
        );
      }

      const { setProps } = await render(<App items={['a']} />, { strict: false });
      await setProps({ items: ['a', 'b'] });
      await setProps({ items: ['b', 'a'] });

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

    it('registers items that sit across a shadow boundary', async () => {
      const host = document.createElement('div');
      document.body.appendChild(host);
      const shadowContainer = document.createElement('div');
      host.attachShadow({ mode: 'open' }).appendChild(shadowContainer);

      const elementsRef = {
        current: [] as Array<HTMLElement | null>,
      };

      try {
        // No ancestor can `contain` both items, so the pair has no common root to observe.
        // Registration still has to hold.
        const { unmount } = await render(
          <CompositeList elementsRef={elementsRef}>
            <Item label="light" />
            {ReactDOM.createPortal(<Item label="shadow" />, shadowContainer)}
          </CompositeList>,
          { strict: false },
        );

        const shadowItem = shadowContainer.querySelector('[data-testid="shadow"]');
        expect(shadowItem).not.toBe(null);
        expect(elementsRef.current).toEqual([screen.getByTestId('light'), shadowItem]);

        unmount();
        expect(elementsRef.current).toHaveLength(0);
      } finally {
        host.remove();
      }
    });
  });

  describe('prop: labelsRef', () => {
    function LabelledItem(props: {
      testId: string;
      label?: string | null;
      text?: string;
      useTextRef?: boolean;
    }) {
      const textRef = React.useRef<HTMLElement | null>(null);
      const { ref } = useCompositeListItem({
        label: props.label,
        textRef: props.useTextRef ? textRef : undefined,
      });
      return (
        <div ref={ref} data-testid={props.testId}>
          <span ref={props.useTextRef ? textRef : undefined}>{props.text}</span>
          {props.useTextRef ? '-ignored' : ''}
        </div>
      );
    }

    it('resolves each label source', async () => {
      const elementsRef = {
        current: [] as Array<HTMLElement | null>,
      };
      const labelsRef = {
        current: [] as Array<string | null>,
      };

      await render(
        <CompositeList elementsRef={elementsRef} labelsRef={labelsRef}>
          <LabelledItem testId="explicit" label="explicit label" text="ignored" />
          {/* An explicit `null` means "no label", and must not fall back to the text. */}
          <LabelledItem testId="null-label" label={null} text="not a label" />
          <LabelledItem testId="text-ref" useTextRef text="from text ref" />
          <LabelledItem testId="element-text" text="from element" />
        </CompositeList>,
      );

      expect(labelsRef.current).toEqual(['explicit label', null, 'from text ref', 'from element']);
    });

    it('drops label slots for items that unmount', async () => {
      const elementsRef = {
        current: [] as Array<HTMLElement | null>,
      };
      const labelsRef = {
        current: [] as Array<string | null>,
      };

      function App(props: { items: string[] }) {
        return (
          <CompositeList elementsRef={elementsRef} labelsRef={labelsRef}>
            {props.items.map((item) => (
              <LabelledItem key={item} testId={item} label={item} />
            ))}
          </CompositeList>
        );
      }

      const { setProps } = await render(<App items={['a', 'b', 'c']} />);
      expect(labelsRef.current).toEqual(['a', 'b', 'c']);

      await setProps({ items: ['a'] });
      expect(labelsRef.current).toEqual(['a']);
    });

    it('updates the label of a mounted item', async () => {
      const elementsRef = {
        current: [] as Array<HTMLElement | null>,
      };
      const labelsRef = {
        current: [] as Array<string | null>,
      };
      function App(props: { label: string }) {
        return (
          <CompositeList elementsRef={elementsRef} labelsRef={labelsRef}>
            <LabelledItem testId="item" label={props.label} />
          </CompositeList>
        );
      }

      const { setProps } = await render(<App label="before" />);
      expect(labelsRef.current).toEqual(['before']);

      await setProps({ label: 'after' });

      expect(labelsRef.current).toEqual(['after']);
    });
  });

  describe('prop: onMapChange', () => {
    it('publishes item metadata alongside the index', async () => {
      const elementsRef = {
        current: [] as Array<HTMLElement | null>,
      };
      const onMapChange = vi.fn();

      function MetadataItem(props: { testId: string; kind: string }) {
        const metadata = React.useMemo(() => ({ kind: props.kind }), [props.kind]);
        const { ref } = useCompositeListItem({ metadata });
        return <div ref={ref} data-testid={props.testId} />;
      }

      await render(
        <CompositeList elementsRef={elementsRef} onMapChange={onMapChange}>
          <MetadataItem testId="first" kind="alpha" />
          <MetadataItem testId="second" kind="beta" />
        </CompositeList>,
      );

      const map = onMapChange.mock.lastCall?.[0] as Map<Element, { kind: string; index: number }>;
      expect(map.get(screen.getByTestId('first'))).toEqual({ kind: 'alpha', index: 0 });
      expect(map.get(screen.getByTestId('second'))).toEqual({ kind: 'beta', index: 1 });
    });
  });

  describe('Suspense integration', () => {
    it('does not publish an empty registry when an outer boundary repeatedly suspends', async () => {
      function createSuspender() {
        let pending = true;
        let resolvePromise = () => {};
        const promise = new Promise<void>((resolve) => {
          resolvePromise = resolve;
        });

        return {
          read() {
            if (pending) {
              throw promise;
            }
          },
          resolve() {
            pending = false;
            resolvePromise();
          },
        };
      }

      const suspenders = [createSuspender(), createSuspender()];
      const elementsRef = {
        current: [] as Array<HTMLElement | null>,
      };
      const labelsRef = {
        current: [] as Array<string | null>,
      };
      const snapshots: Array<{
        elements: Array<HTMLElement | null>;
        labels: Array<string | null>;
        mapElements: Element[];
      }> = [];

      function Item(props: { attempt?: number; label: string }) {
        const { ref, index } = useCompositeListItem({ guess: true, label: props.label });
        if (props.attempt != null && props.attempt >= 0) {
          suspenders[props.attempt].read();
        }
        return (
          <div ref={ref} data-testid={props.label} data-index={index}>
            {props.label}
          </div>
        );
      }

      function App() {
        const [attempt, setAttempt] = React.useState(-1);
        return (
          <React.Fragment>
            <button type="button" onClick={() => setAttempt((value) => value + 1)}>
              Suspend
            </button>
            <React.Suspense fallback={<div>Loading</div>}>
              <CompositeList
                elementsRef={elementsRef}
                labelsRef={labelsRef}
                onMapChange={(map) => {
                  snapshots.push({
                    elements: [...elementsRef.current],
                    labels: [...labelsRef.current],
                    mapElements: Array.from(map.keys()),
                  });
                }}
              >
                <Item label="a" />
                <Item label="b" attempt={attempt} />
                <Item label="c" />
              </CompositeList>
            </React.Suspense>
          </React.Fragment>
        );
      }

      await render(<App />);

      async function suspendAndResolve(attempt: number) {
        await act(async () => {
          screen.getByRole('button', { name: 'Suspend' }).click();
        });
        await screen.findByText('Loading');

        await act(async () => {
          suspenders[attempt].resolve();
          await Promise.resolve();
        });
        await waitFor(() => {
          expect(screen.queryByText('Loading')).toBe(null);
        });

        expect(elementsRef.current).toEqual([
          screen.getByTestId('a'),
          screen.getByTestId('b'),
          screen.getByTestId('c'),
        ]);
        expect(labelsRef.current).toEqual(['a', 'b', 'c']);
        expect(screen.getByTestId('a')).toHaveAttribute('data-index', '0');
        expect(screen.getByTestId('b')).toHaveAttribute('data-index', '1');
        expect(screen.getByTestId('c')).toHaveAttribute('data-index', '2');
      }

      await suspendAndResolve(0);
      await suspendAndResolve(1);

      expect(snapshots.length).toBeGreaterThan(0);
      snapshots.forEach((snapshot) => {
        expect(snapshot.mapElements).toHaveLength(3);
        expect(snapshot.elements).toEqual(snapshot.mapElements);
        expect(snapshot.labels).toEqual(['a', 'b', 'c']);
      });
    });
  });

  describe('server-side rendering', () => {
    function Item(props: { label: string }) {
      const { ref, index } = useCompositeListItem();
      return <div ref={ref} data-testid={props.label} data-index={index} />;
    }

    it('hydrates a server-rendered list without a mismatch under Strict Mode', () => {
      const elementsRef = {
        current: [] as Array<HTMLElement | null>,
      };

      function App() {
        return (
          <CompositeList elementsRef={elementsRef}>
            <Item label="a" />
            <Item label="b" />
          </CompositeList>
        );
      }

      const { hydrate } = renderToString(<App />);
      expect(screen.getByTestId('a')).toHaveAttribute('data-index', '-1');
      expect(screen.getByTestId('b')).toHaveAttribute('data-index', '-1');

      hydrate();

      expect(screen.getByTestId('a')).toHaveAttribute('data-index', '0');
      expect(screen.getByTestId('b')).toHaveAttribute('data-index', '1');
      expect(elementsRef.current).toEqual([screen.getByTestId('a'), screen.getByTestId('b')]);
    });
  });

  describe('without a parent list', () => {
    it('renders an item that is not wrapped in a list', async () => {
      function OrphanItem() {
        const { ref, index } = useCompositeListItem();
        return <div ref={ref} data-testid="orphan" data-index={index} />;
      }

      const { unmount } = await render(<OrphanItem />);

      // The default context no-ops keep a stray item inert rather than throwing.
      expect(screen.getByTestId('orphan')).toBeInTheDocument();
      expect(screen.getByTestId('orphan')).toHaveAttribute('data-index', '-1');
      expect(() => unmount()).not.toThrow();
    });
  });
});
