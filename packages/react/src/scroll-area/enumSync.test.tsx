import * as React from 'react';
import { expect } from 'vitest';
import { ScrollArea } from '@base-ui/react/scroll-area';
import { screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer, isJSDOM } from '#test-utils';
import { scrollAreaStateAttributesMapping } from './root/stateAttributes';
import { ScrollAreaRootDataAttributes } from './root/ScrollAreaRootDataAttributes';
import { ScrollAreaScrollbarDataAttributes } from './scrollbar/ScrollAreaScrollbarDataAttributes';
import { ScrollAreaRootCssVars } from './root/ScrollAreaRootCssVars';
import { ScrollAreaScrollbarCssVars } from './scrollbar/ScrollAreaScrollbarCssVars';
import { ScrollAreaViewportCssVars } from './viewport/ScrollAreaViewportCssVars';

// The parts inline these enums' values instead of referencing the members, so
// nothing links the docs enums to runtime behavior. These tests re-link them so a
// rename to only one side fails CI. Test-only imports ship no production bytes.
describe('ScrollArea docs enum / runtime sync', () => {
  const { render } = createRenderer();

  it('names the overflow data-attributes per ScrollAreaRootDataAttributes', () => {
    const keys = [
      'hasOverflowX',
      'hasOverflowY',
      'overflowXStart',
      'overflowXEnd',
      'overflowYStart',
      'overflowYEnd',
    ] as const;

    for (const key of keys) {
      const emitted = scrollAreaStateAttributesMapping[key]!(true);
      expect(Object.keys(emitted!)[0]).toBe(ScrollAreaRootDataAttributes[key]);
    }
  });

  it('names the scrollbar orientation attribute per ScrollAreaScrollbarDataAttributes', async () => {
    await render(
      <ScrollArea.Root>
        <ScrollArea.Scrollbar orientation="horizontal" keepMounted data-testid="scrollbar" />
      </ScrollArea.Root>,
    );

    expect(screen.getByTestId('scrollbar')).toHaveAttribute(
      ScrollAreaScrollbarDataAttributes.orientation,
      'horizontal',
    );
  });

  it('names the corner and thumb CSS variables per the *CssVars enums', async () => {
    await render(
      <ScrollArea.Root data-testid="root">
        <ScrollArea.Scrollbar orientation="vertical" keepMounted data-testid="scrollbar" />
      </ScrollArea.Root>,
    );

    const root = screen.getByTestId('root');
    const scrollbar = screen.getByTestId('scrollbar');

    // Both parts write these variables unconditionally through the `style` prop, so
    // the inline style carries them even without layout measurement.
    expect(root.style.getPropertyValue(ScrollAreaRootCssVars.scrollAreaCornerHeight)).not.toBe('');
    expect(root.style.getPropertyValue(ScrollAreaRootCssVars.scrollAreaCornerWidth)).not.toBe('');
    expect(
      scrollbar.style.getPropertyValue(ScrollAreaScrollbarCssVars.scrollAreaThumbHeight),
    ).not.toBe('');
  });

  it.skipIf(isJSDOM)('names the overflow CSS variables per ScrollAreaViewportCssVars', async () => {
    await render(
      <ScrollArea.Root style={{ width: 200, height: 200 }}>
        <ScrollArea.Viewport data-testid="viewport" style={{ width: '100%', height: '100%' }}>
          <div style={{ width: 1000, height: 1000 }} />
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar orientation="vertical" keepMounted />
        <ScrollArea.Scrollbar orientation="horizontal" keepMounted />
      </ScrollArea.Root>,
    );

    const viewport = screen.getByTestId('viewport');

    await waitFor(() =>
      expect(
        viewport.style.getPropertyValue(ScrollAreaViewportCssVars.scrollAreaOverflowYStart),
      ).not.toBe(''),
    );
    expect(
      viewport.style.getPropertyValue(ScrollAreaViewportCssVars.scrollAreaOverflowYEnd),
    ).not.toBe('');
    expect(
      viewport.style.getPropertyValue(ScrollAreaViewportCssVars.scrollAreaOverflowXStart),
    ).not.toBe('');
    expect(
      viewport.style.getPropertyValue(ScrollAreaViewportCssVars.scrollAreaOverflowXEnd),
    ).not.toBe('');
  });
});
