import * as React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { screen, render as rtlRender } from '@testing-library/react';
import { isJSDOM, testDragKind } from '#test-utils';
import { Draggable } from '@base-ui/react/draggable';
import { setupDragEngineTests, fireDrag } from '../../../test/dnd';
import { DraggableProvider } from '../DraggableProvider';

setupDragEngineTests();

const ThemeContext = React.createContext('light');

function ThemedBadge() {
  const theme = React.useContext(ThemeContext);
  return <span data-testid="preview">{theme}</span>;
}

/**
 * The preview's React tree is separate from its DOM placement, so a preview can
 * read the app's context and still sit where the app's contextual CSS matches it.
 *
 * jsdom resolves no cascade, so only a real browser can test the CSS half.
 */
describe.skipIf(isJSDOM)('Draggable.Preview (cascade)', () => {
  let style: HTMLStyleElement;

  beforeEach(() => {
    style = document.createElement('style');
    // Ancestor-scoped on purpose. The rule stops matching if the preview is moved
    // out from under `.dark`.
    style.textContent = '.dark .Badge { color: rgb(0, 128, 0); }';
    document.head.appendChild(style);
  });

  afterEach(() => {
    style.remove();
  });

  it('reads React context and still matches an ancestor-scoped rule', () => {
    rtlRender(
      <ThemeContext.Provider value="dark">
        <DraggableProvider>
          <div className="dark">
            <Draggable.Root kind={testDragKind} data-testid="drag">
              <Draggable.Preview className="Badge">
                <ThemedBadge />
              </Draggable.Preview>
            </Draggable.Root>
          </div>
        </DraggableProvider>
      </ThemeContext.Provider>,
    );

    const source = screen.getByTestId('drag');
    fireDrag.dragStart(source);

    // React half. The content renders in the provider's tree, so the theme reaches it.
    expect(screen.getByTestId('preview')).toHaveTextContent('dark');

    // CSS half. The engine's host stays in the source's parent, inside the
    // top-layer wrapper, so the part's element still sits under `.dark` and
    // `.dark .Badge` applies.
    const badge = screen.getByTestId('preview').closest('.Badge') as HTMLElement;
    const host = badge.closest('[data-drag-preview]') as HTMLElement;
    expect(host.parentElement!.parentElement).toBe(source.parentElement);
    expect(getComputedStyle(badge).color).toBe('rgb(0, 128, 0)');
  });
});
