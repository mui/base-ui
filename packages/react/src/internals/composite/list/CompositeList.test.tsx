import { expect, vi } from 'vitest';
import * as React from 'react';
import { screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer } from '#test-utils';
import { CompositeList } from './CompositeList';
import { IndexGuessBehavior, useCompositeListItem } from './useCompositeListItem';

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

    it('keeps refs populated for items whose guessed index is already correct', async () => {
      function GuessedItem(props: { label: string }) {
        const { ref } = useCompositeListItem({
          label: props.label,
          indexGuessBehavior: IndexGuessBehavior.GuessFromOrder,
        });
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

      // A StrictMode dev remount runs the cleanup that empties the ref arrays,
      // but items whose index is unchanged don't re-render, so their ref
      // callbacks can't refill the arrays. The map change subscription must
      // write the refs back (https://github.com/mui/base-ui/issues/4698).
      await waitFor(() => {
        expect(elementsRef.current[0]).toBe(screen.getByTestId('a'));
      });
      expect(elementsRef.current[1]).toBe(screen.getByTestId('b'));
      expect(elementsRef.current[2]).toBe(screen.getByTestId('c'));
      expect(labelsRef.current).toEqual(['a', 'b', 'c']);
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
  });
});
