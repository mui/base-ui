import { expect } from 'chai';
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

      expect(elementsRef.current).to.have.length(3);
      expect(labelsRef.current).to.have.length(3);

      unmount();
      expect(elementsRef.current).to.have.length(0);
      expect(labelsRef.current).to.have.length(0);
    });
  });
});
