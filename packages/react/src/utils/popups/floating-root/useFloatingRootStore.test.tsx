import { describe, expect, it } from 'vitest';
import * as React from 'react';
import { createRenderer } from '#test-utils';
import { PopupTreeContext, PopupTreeNode } from '../tree/PopupTree';
import { PopupTreeRegistry } from '../tree/PopupTreeRegistry';
import { useFloatingRootStore } from './useFloatingRootStore';
import type { FloatingRootStore } from './FloatingRootStore';

describe('useFloatingRootStore', () => {
  const { render } = createRenderer();

  function Test(props: { anchor: Element | null; onStore: (store: FloatingRootStore) => void }) {
    const store = useFloatingRootStore({ elements: { anchor: props.anchor } });
    props.onStore(store);
    return null;
  }

  it('follows the anchor when it changes after the first render', async () => {
    const first = document.createElement('button');
    const second = document.createElement('button');
    let store: FloatingRootStore | undefined;
    const onStore = (value: FloatingRootStore) => {
      store = value;
    };

    const { setProps } = await render(<Test anchor={first} onStore={onStore} />);
    expect(store?.select('anchor')).toBe(first);

    await setProps({ anchor: second });

    expect(store?.select('anchor')).toBe(second);
    expect(store?.select('anchorElement')).toBe(second);
  });

  describe('popup tree membership', () => {
    function Membership(props: {
      nodeId: string | undefined;
      onRender: (values: [PopupTreeRegistry | null, string | undefined, string | null]) => void;
    }) {
      const store = useFloatingRootStore({ nodeId: props.nodeId });
      props.onRender([
        store.select('popupTree'),
        store.select('popupNodeId'),
        store.select('popupParentNodeId'),
      ]);
      return null;
    }

    it('reads its tree, node id and parent on the first render', async () => {
      const tree = new PopupTreeRegistry();
      const renders: Array<[PopupTreeRegistry | null, string | undefined, string | null]> = [];

      await render(
        <PopupTreeContext.Provider value={tree}>
          <PopupTreeNode id="parent">
            <Membership nodeId="own" onRender={(values) => renders.push(values)} />
          </PopupTreeNode>
        </PopupTreeContext.Provider>,
      );

      expect(renders[0]).toEqual([tree, 'own', 'parent']);
    });

    it('follows a node id that changes after the first render', async () => {
      let store: FloatingRootStore | undefined;
      function NodeIdTest(props: { nodeId: string }) {
        store = useFloatingRootStore({ nodeId: props.nodeId });
        return null;
      }

      const { setProps } = await render(<NodeIdTest nodeId="first" />);
      expect(store?.select('popupNodeId')).toBe('first');

      await setProps({ nodeId: 'second' });

      expect(store?.select('popupNodeId')).toBe('second');
    });

    it('follows the tree and parent it renders in', async () => {
      let store: FloatingRootStore | undefined;
      function Membership() {
        store = useFloatingRootStore({});
        return null;
      }
      function Test(props: { tree: PopupTreeRegistry; parentId: string }) {
        return (
          <PopupTreeContext.Provider value={props.tree}>
            <PopupTreeNode id={props.parentId}>
              <Membership />
            </PopupTreeNode>
          </PopupTreeContext.Provider>
        );
      }
      const first = new PopupTreeRegistry();
      const second = new PopupTreeRegistry();

      const { setProps } = await render(<Test tree={first} parentId="first-parent" />);
      expect(store?.select('popupTree')).toBe(first);
      expect(store?.select('popupParentNodeId')).toBe('first-parent');

      await setProps({ tree: second, parentId: 'second-parent' });

      expect(store?.select('popupTree')).toBe(second);
      expect(store?.select('popupParentNodeId')).toBe('second-parent');
    });
  });
});
