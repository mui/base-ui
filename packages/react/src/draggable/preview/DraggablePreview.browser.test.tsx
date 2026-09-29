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
    const container = badge.closest('[data-drag-preview-container]') as HTMLElement;
    expect(container.parentElement).toBe(source.parentElement);
    expect(getComputedStyle(badge).color).toBe('rgb(0, 128, 0)');
  });

  it('leaves the transforms and motion of a custom preview element alone', () => {
    // The engine neutralizes the source's motion on the element it moves each
    // frame. The consumer's own preview element inherits nothing from the source,
    // so its styles must survive. At (0,1,0), `.Badge` ties with the engine's
    // sheet and would lose to it if the sheet reached this element.
    style.textContent = `
      div { transition: translate 1s; }
      .Badge {
        transform: scale(2);
        transition: box-shadow 300ms ease;
        animation: badge-pulse 1s infinite;
      }
      @keyframes badge-pulse { to { opacity: 0.5; } }
    `;
    rtlRender(
      <DraggableProvider>
        <Draggable.Root
          kind={testDragKind}
          data-testid="drag"
          style={{ width: '120px', height: '30px' }}
        >
          <Draggable.Preview className="Badge">
            <span data-testid="preview">Preview</span>
          </Draggable.Preview>
        </Draggable.Root>
      </DraggableProvider>,
    );

    fireDrag.dragStart(screen.getByTestId('drag'));

    const badge = screen.getByTestId('preview').parentElement!;
    const computed = getComputedStyle(badge);
    expect(computed.transform).toBe('matrix(2, 0, 0, 2, 0, 0)');
    expect(computed.transitionDuration).toBe('0.3s');
    expect(computed.animationName).toBe('badge-pulse');
    // The source size reaches the consumer's element from the host it sits in.
    expect(computed.getPropertyValue('--drag-source-width')).toBe('120px');
    // The host the engine moves still drops motion that would ease its `translate`.
    expect(getComputedStyle(badge.parentElement!).transitionDuration).toBe('0s');
  });
});
