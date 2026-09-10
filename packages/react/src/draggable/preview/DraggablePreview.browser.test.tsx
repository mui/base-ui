import * as React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { fireEvent, screen, render as rtlRender } from '@testing-library/react';
import { isJSDOM, testDragKind } from '#test-utils';
import { Draggable } from '@base-ui/react/draggable';
import { setupDragEngineTests } from '../../../test/dnd';
import { DraggablePreviewProvider } from '../preview-provider/DraggablePreviewProvider';

setupDragEngineTests();

const ThemeContext = React.createContext('light');

function ThemedBadge() {
  const theme = React.useContext(ThemeContext);
  return <span data-testid="preview">{theme}</span>;
}

/**
 * The point of separating the preview's React tree from its DOM placement: a
 * preview can read the app's context *and* stay where the app's contextual CSS
 * matches it. Reading context used to cost the cascade, because the provider
 * relocated the element into a host of its own.
 *
 * jsdom resolves no cascade, so only a real browser can prove the CSS half.
 */
describe.skipIf(isJSDOM)('Draggable.Preview (cascade)', () => {
  let style: HTMLStyleElement;

  beforeEach(() => {
    style = document.createElement('style');
    // Deliberately ancestor-scoped: this is the rule shape a provider that
    // relocated the preview would silently stop matching.
    style.textContent = '.dark .Badge { color: rgb(0, 128, 0); }';
    document.head.appendChild(style);
  });

  afterEach(() => {
    style.remove();
  });

  it('reads React context and still matches an ancestor-scoped rule', () => {
    rtlRender(
      <ThemeContext.Provider value="dark">
        <DraggablePreviewProvider>
          <div className="dark">
            <Draggable.Root kind={testDragKind} data-testid="drag">
              <Draggable.Preview className="Badge">
                <ThemedBadge />
              </Draggable.Preview>
            </Draggable.Root>
          </div>
        </DraggablePreviewProvider>
      </ThemeContext.Provider>,
    );

    const source = screen.getByTestId('drag');
    fireEvent.dragStart(source);

    // The React half: content rendered in the provider's tree, so the theme reaches it.
    expect(screen.getByTestId('preview')).toHaveTextContent('dark');

    // The CSS half: the engine's host stays in the source's own parent (through
    // the top-layer wrapper), so the part's element still sits under `.dark` and
    // `.dark .Badge` applies.
    const badge = screen.getByTestId('preview').closest('.Badge') as HTMLElement;
    const host = badge.closest('[data-drag-preview]') as HTMLElement;
    expect(host.parentElement!.parentElement).toBe(source.parentElement);
    expect(getComputedStyle(badge).color).toBe('rgb(0, 128, 0)');
  });
});
