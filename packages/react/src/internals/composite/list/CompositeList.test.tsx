import { expect, vi } from 'vitest';
import * as React from 'react';
import { screen, waitFor } from '@mui/internal-test-utils';
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

      const { user } = await render(<App />);

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
