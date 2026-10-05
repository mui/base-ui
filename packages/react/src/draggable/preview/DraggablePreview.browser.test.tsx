import * as React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { screen, render as rtlRender } from '@testing-library/react';
import { isJSDOM, testDragKind } from '#test-utils';
import { Draggable } from '@base-ui/react/draggable';
import { act } from '@mui/internal-test-utils';
import { setupDragEngineTests, fireDrag, flushRaf } from '../../../test/dnd';
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

    // CSS half. The copy of the part's element is the preview itself, in the
    // source's parent, so it still sits under `.dark` and `.dark .Badge` applies.
    const badge = screen.getByTestId('preview').closest('.Badge') as HTMLElement;
    expect(badge).toHaveAttribute('data-drag-preview');
    expect(badge.parentElement).toBe(source.parentElement);
    expect(getComputedStyle(badge).color).toBe('rgb(0, 128, 0)');
  });

  it('leaves the transforms and motion of a custom preview element alone', () => {
    // The engine neutralizes the source's motion on a clone. The consumer's own
    // preview element inherits nothing from the source, so its styles must survive.
    // At (0,1,0), `.Badge` ties with the engine's sheet and would lose to it if the
    // sheet reached this element.
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
    // The source size reaches the consumer's element, which is the one the engine moves.
    expect(computed.getPropertyValue('--drag-source-width')).toBe('120px');
  });

  it.each([
    ['keeps it off at the drop', '', '0s, 0.3s', '0s, 0s'],
    [
      'animates the drop with an ending transition',
      '.Badge[data-ending-style] { transition: translate 250ms 100ms, box-shadow 300ms; }',
      '0.25s, 0.3s',
      '0.1s, 0s',
    ],
  ])(
    'holds off only the transition that would ease its position, and %s',
    async (_name, endingRule, endingDurations, endingDelays) => {
      // The engine writes `translate` on the preview element every frame. A
      // transition covering it would make the preview trail the pointer. Other
      // transitions run. The drop animates only with a transition that applies once
      // `[data-ending-style]` is set, as a clone's does, so one meant for the drag
      // (such as hover effects) doesn't fly the preview back. The drag transition is
      // in the stylesheet, since an inline one would win over the ending rule.
      style.textContent = `.Badge { transform: scale(2); transition: translate 200ms 100ms, box-shadow 300ms; } ${endingRule}`;
      rtlRender(
        <DraggableProvider>
          <Draggable.Root kind={testDragKind} data-testid="drag">
            <Draggable.Preview className="Badge">
              <span data-testid="preview">Preview</span>
            </Draggable.Preview>
          </Draggable.Root>
        </DraggableProvider>,
      );

      fireDrag.dragStart(screen.getByTestId('drag'));

      const preview = screen.getByTestId('preview').parentElement!;
      expect(getComputedStyle(preview).transitionDuration).toBe('0s, 0.3s');
      // A delay would hold every position back as much as a duration would.
      expect(getComputedStyle(preview).transitionDelay).toBe('0s, 0s');
      expect(getComputedStyle(preview).transform).toBe('matrix(2, 0, 0, 2, 0, 0)');

      // The ending styles apply in the ending's first frame. A pending animation keeps
      // the preview mounted past it.
      const animations = globalThis as { BASE_UI_ANIMATIONS_DISABLED?: boolean | undefined };
      animations.BASE_UI_ANIMATIONS_DISABLED = false;
      preview.getAnimations = () =>
        [
          { effect: { getTiming: () => ({ iterations: 1 }) }, finished: new Promise(() => {}) },
        ] as unknown as Animation[];
      try {
        fireDrag.drop(screen.getByTestId('drag'));
        await act(async () => {
          await new Promise((resolve) => {
            requestAnimationFrame(resolve);
          });
        });
        expect(getComputedStyle(preview).transitionDuration).toBe(endingDurations);
        expect(getComputedStyle(preview).transitionDelay).toBe(endingDelays);
      } finally {
        animations.BASE_UI_ANIMATIONS_DISABLED = true;
      }
    },
  );

  it('copies what the content draws on a canvas on Draggable.updatePreview()', async () => {
    function Drawing() {
      const ref = React.useRef<HTMLCanvasElement>(null);
      React.useEffect(() => {
        const context = ref.current!.getContext('2d')!;
        context.fillStyle = 'rgb(0, 128, 0)';
        context.fillRect(0, 0, 4, 4);
        // The drawing happens after the copy was made.
        Draggable.updatePreview();
      }, []);
      return <canvas ref={ref} width={4} height={4} />;
    }
    rtlRender(
      <DraggableProvider>
        <Draggable.Root kind={testDragKind} data-testid="drag">
          <Draggable.Preview>
            <Drawing />
          </Draggable.Preview>
        </Draggable.Root>
      </DraggableProvider>,
    );

    fireDrag.dragStart(screen.getByTestId('drag'));
    await act(async () => {
      await new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
      });
    });

    const canvas = document.querySelector<HTMLCanvasElement>('[data-drag-preview] canvas')!;
    const [red, green, blue] = canvas.getContext('2d')!.getImageData(1, 1, 1, 1).data;
    expect([red, green, blue]).toEqual([0, 128, 0]);
  });

  it.each([
    ['a class', '.Badge { margin: 10px 0 0 20px; translate: 5px 50%; }', undefined],
    ['the style prop', '', { margin: '10px 0 0 20px', translate: '5px 50%' }],
  ])('offsets the preview by its own margin and translate from %s', async (_, css, ownStyle) => {
    // The engine positions the preview through `margin` and `translate`, so the
    // root's own values shift it from its offset, as they would shift it in place.
    style.textContent = `.Badge { height: 40px; } ${css}`;
    rtlRender(
      <DraggableProvider>
        <Draggable.Root kind={testDragKind} data-testid="drag">
          <Draggable.Preview className="Badge" style={ownStyle} offset="pointer">
            Preview
          </Draggable.Preview>
        </Draggable.Root>
      </DraggableProvider>,
    );

    const source = screen.getByTestId('drag');
    fireDrag.dragStart(source, { clientX: 100, clientY: 100 });
    fireDrag.dragOver(source, { clientX: 100, clientY: 100 });
    // The pickup happens past the activation distance. The move back to the press
    // point positions the preview on the next frame.
    await act(async () => {
      await new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
      });
    });

    const rect = screen.getByText('Preview').getBoundingClientRect();
    expect(rect.left).toBeCloseTo(125);
    expect(rect.top).toBeCloseTo(130);
  });

  it('holds off a position transition that an app popover rule adds', () => {
    // The preview is a popover, so an app's `[popover]` rule reaches it.
    style.textContent = '[popover] { transition: translate 200ms; }';
    rtlRender(
      <DraggableProvider>
        <Draggable.Root kind={testDragKind} data-testid="drag">
          <Draggable.Preview>
            <span data-testid="preview">Preview</span>
          </Draggable.Preview>
        </Draggable.Root>
      </DraggableProvider>,
    );

    fireDrag.dragStart(screen.getByTestId('drag'));

    expect(getComputedStyle(screen.getByTestId('preview').parentElement!).transitionDuration).toBe(
      '0s',
    );
  });

  it('offsets the preview by the translate its root gets on Draggable.updatePreview()', async () => {
    style.textContent = '.Badge { height: 40px; }';
    function Fixture(props: { shift: number }) {
      return (
        <DraggableProvider>
          <Draggable.Root kind={testDragKind} data-testid="drag">
            <Draggable.Preview
              className="Badge"
              style={{ translate: `${props.shift}px 0px` }}
              offset="pointer"
            >
              Preview
            </Draggable.Preview>
          </Draggable.Root>
        </DraggableProvider>
      );
    }
    const { rerender } = rtlRender(<Fixture shift={0} />);
    const source = screen.getByTestId('drag');
    fireDrag.dragStart(source, { clientX: 100, clientY: 100 });
    fireDrag.dragOver(source, { clientX: 100, clientY: 100 });
    await flushRaf();
    expect(screen.getByText('Preview').getBoundingClientRect().left).toBeCloseTo(100);

    rerender(<Fixture shift={20} />);
    Draggable.updatePreview();
    await flushRaf();

    expect(screen.getByText('Preview').getBoundingClientRect().left).toBeCloseTo(120);
  });

  it('measures the popover corrections again when the content restyles its root', async () => {
    // The UA `[popover]` rule gives an unstyled root an opaque `Canvas` background,
    // which the engine corrects. A later style from the content must still apply.
    style.textContent = '.Green { background-color: rgb(0, 128, 0); }';
    function Fixture(props: { tone: string }) {
      return (
        <DraggableProvider>
          <Draggable.Root kind={testDragKind} data-testid="drag">
            <Draggable.Preview className={props.tone}>
              <span data-testid="preview">Preview</span>
            </Draggable.Preview>
          </Draggable.Root>
        </DraggableProvider>
      );
    }
    const { rerender } = rtlRender(<Fixture tone="Plain" />);
    fireDrag.dragStart(screen.getByTestId('drag'));
    const preview = () => screen.getByTestId('preview').parentElement!;
    expect(getComputedStyle(preview()).backgroundColor).toBe('rgba(0, 0, 0, 0)');

    rerender(<Fixture tone="Green" />);
    Draggable.updatePreview();
    await flushRaf();

    expect(getComputedStyle(preview()).backgroundColor).toBe('rgb(0, 128, 0)');
  });
  it('does not copy its previous preview when it clones the source again', async () => {
    // A `container` inside the source holds the preview, so a second clone of the
    // source would include the first preview. A child combinator matches inside
    // that preview too, and its snapshot has no counterpart in the new clone.
    style.textContent = '.Card > span { color: rgb(255, 0, 0); }';
    rtlRender(
      <DraggableProvider>
        <Draggable.Root kind={testDragKind} data-testid="drag" className="Card">
          <span>Source</span>
          <div className="Slot" />
          <Draggable.Preview container={(source) => source.querySelector<HTMLElement>('.Slot')} />
        </Draggable.Root>
      </DraggableProvider>,
    );
    const source = screen.getByTestId('drag');
    source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

    fireDrag.dragStart(source);
    Draggable.updatePreview();
    await flushRaf();
    Draggable.updatePreview();
    await flushRaf();

    expect(document.querySelectorAll('[data-drag-preview]')).toHaveLength(1);
  });
});
