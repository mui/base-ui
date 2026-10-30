import { describe, expect, it } from 'vitest';
import * as React from 'react';
import { createRenderer } from '#test-utils';
import { PopupTree, usePopupTree } from './PopupTree';
import { PopupTreeRegistry } from './PopupTreeRegistry';

describe('PopupTree', () => {
  const { render } = createRenderer();

  it('provides the external tree it currently receives', async () => {
    const seen: Array<PopupTreeRegistry | null> = [];
    function ReadTree() {
      seen.push(usePopupTree());
      return null;
    }
    const first = new PopupTreeRegistry();
    const second = new PopupTreeRegistry();

    const { setProps } = await render(<PopupTree externalTree={first}>{<ReadTree />}</PopupTree>);
    expect(seen.at(-1)).toBe(first);

    await setProps({ externalTree: second });

    expect(seen.at(-1)).toBe(second);
  });
});
