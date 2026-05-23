import * as React from 'react';
import { expect } from 'vitest';
import { flushMicrotasks, screen } from '@mui/internal-test-utils';
import { createRenderer } from '#test-utils';
import { CompositeList } from './CompositeList';
import { useCompositeListItem } from './useCompositeListItem';

describe('<CompositeList />', () => {
  const { render } = createRenderer();

  describe('prop: elementsRef', () => {
    it('cleans up refs on unmount', async () => {
      function Item() {
        const { ref } = useCompositeListItem();
        return <div ref={ref} />;
      }
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

    it('repopulates elementsRef from sortedMap after refs are wiped', async () => {
      function Item({ id }: { id: string }) {
        const { ref } = useCompositeListItem();
        return <div ref={ref} data-testid={id} />;
      }

      const elementsRef = {
        current: [] as Array<HTMLElement | null>,
      };

      function App() {
        const [showExtraItem, setShowExtraItem] = React.useState(false);

        return (
          <>
            <button type="button" onClick={() => setShowExtraItem(true)}>
              Add item
            </button>
            <CompositeList elementsRef={elementsRef}>
              <Item id="a" />
              <Item id="b" />
              <Item id="c" />
              {showExtraItem ? <Item id="d" /> : null}
            </CompositeList>
          </>
        );
      }

      const { user } = await render(<App />);

      const optionA = screen.getByTestId('a');

      expect(elementsRef.current.indexOf(optionA)).not.toBe(-1);

      // Simulate StrictMode cleanup without ref re-attachment.
      elementsRef.current = [null, null, null];
      expect(elementsRef.current.indexOf(optionA)).toBe(-1);

      // Trigger a map update so the layout effect re-syncs refs from sortedMap.
      await user.click(screen.getByRole('button', { name: 'Add item' }));
      await flushMicrotasks();

      const optionD = screen.getByTestId('d');
      expect(elementsRef.current.indexOf(optionA)).not.toBe(-1);
      expect(elementsRef.current.indexOf(optionD)).not.toBe(-1);
    });
  });
});
