import { describe, expect, it } from 'vitest';
import * as React from 'react';
import { createRenderer } from '#test-utils';
import { PopupTree, usePopupTree } from './PopupTree';
import { PopupTreeRegistry } from './PopupTreeRegistry';

describe('PopupTree', () => {
  const { render } = createRenderer();

  it('provides its own tree and keeps it across renders', async () => {
    const seen: Array<PopupTreeRegistry | null> = [];
    function ReadTree(props: { label: string }) {
      seen.push(usePopupTree());
      return props.label;
    }

    const { setProps } = await render(
      <PopupTree>
        <ReadTree label="first" />
      </PopupTree>,
    );
    expect(seen.at(-1)).toBeInstanceOf(PopupTreeRegistry);

    await setProps({ children: <ReadTree label="second" /> });

    expect(seen.at(-1)).toBe(seen[0]);
  });
});
