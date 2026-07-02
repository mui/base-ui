import { expect, vi } from 'vitest';
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

    it('warns when controlled and uncontrolled indexes are mixed', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      function Item(props: { index?: number | undefined }) {
        const { ref } = useCompositeListItem({ index: props.index });
        return <div ref={ref} />;
      }

      const expectedMessage =
        'Base UI: A CompositeList is mixing controlled and uncontrolled indexes. ' +
        'Decide between using a controlled or uncontrolled index prop for all items in the CompositeList. ' +
        "The nature of the state is determined during the first render. It's considered controlled if the value is not `undefined`. " +
        'More info: https://fb.me/react-controlled-components';

      await render(
        <CompositeList elementsRef={{ current: [] }}>
          <Item index={0} />
          <Item />
        </CompositeList>,
      );

      expect(console.error).toHaveBeenCalledWith(expectedMessage);

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
