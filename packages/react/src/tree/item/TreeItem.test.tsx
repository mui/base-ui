import { describe, expect, it } from 'vitest';
import { createRenderer } from '#test-utils';
import { Tree } from '..';

describe('<Tree.Item />', () => {
  const { render } = createRenderer();

  describe('prop: itemId', () => {
    it('reports an id that is not in the items of the root', async () => {
      await expect(() =>
        render(
          <Tree.Root items={[{ id: 'a', label: 'A' }]}>
            <Tree.List>
              <Tree.Item itemId="a" />
              <Tree.Item itemId="b" />
            </Tree.List>
          </Tree.Root>,
        ),
      ).toErrorDev('A <Tree.Item> has the itemId "b", which is not in the `items` of <Tree.Root>');
    });
  });
});
