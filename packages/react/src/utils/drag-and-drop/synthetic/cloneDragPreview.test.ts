import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { installDndPolyfill } from '../../../../test/dndPolyfill';
import { createDragPreviewElement, type DragPreviewElementHandle } from './cloneDragPreview';

installDndPolyfill();

describe('createDragPreviewElement', () => {
  let host: HTMLElement;
  const handles: DragPreviewElementHandle[] = [];

  beforeEach(() => {
    host = document.createElement('div');
    document.body.appendChild(host);
  });

  afterEach(() => {
    // Destroy the handles *before* removing the host: each one keeps a live
    // MutationObserver on its ancestor chain, and `host.remove()` would trigger
    // `reconnect()` and re-append the preview to `document.body`.
    while (handles.length > 0) {
      handles.pop()!.destroy();
    }
    host.remove();
    expect(document.querySelectorAll('[data-drag-preview]')).toHaveLength(0);
  });

  /** Queue a handle for `afterEach` destruction (`destroy()` is idempotent). */
  function track(handle: DragPreviewElementHandle | null): DragPreviewElementHandle | null {
    if (handle) {
      handles.push(handle);
    }
    return handle;
  }

  function createSource(html: string = 'Card'): HTMLElement {
    const source = document.createElement('div');
    source.className = 'Card Card--wide';
    source.innerHTML = html;
    host.appendChild(source);
    return source;
  }

  function clone(source: HTMLElement, options?: { container?: HTMLElement }) {
    const handle = track(createDragPreviewElement(source, { content: 'clone', ...options }));
    expect(handle).not.toBeNull();
    return handle!;
  }

  it('collects each source and clone subtree once during pickup', () => {
    const querySelectorAll = vi.spyOn(Element.prototype, 'querySelectorAll');
    const source = createSource(
      '<section><label for="field">Name</label><input id="field" value="Ada" /></section>',
    );

    clone(source);

    const completeTreeQueries = querySelectorAll.mock.calls.filter(
      ([selector]) => selector === '*',
    );
    expect(completeTreeQueries).toHaveLength(2);
  });

  /**
   * The engine-owned top-layer wrapper the preview mounts inside — the element
   * whose DOM placement the injection contract is about.
   */
  function wrapperOf(handle: DragPreviewElementHandle): HTMLElement {
    return handle.element.parentElement!;
  }

  it('keeps the source classes so consumers can style it with their own selector', () => {
    const handle = clone(createSource());

    // `.Card[data-drag-preview] { … }` only works because the clone keeps the
    // classes and the engine writes geometry — never visuals — inline.
    expect(handle.element).toHaveClass('Card', 'Card--wide');
    expect(handle.element).toHaveAttribute('data-drag-preview', '');
    expect(handle.element).toHaveAttribute('aria-hidden', 'true');
    expect(handle.element).toHaveAttribute('inert');
  });

  it('injects the clone as the last child of the source parent, after the source', () => {
    const source = createSource();
    const sibling = document.createElement('div');
    host.appendChild(sibling);

    const handle = clone(source);

    // Last child rather than next-sibling: both come after the source in tree
    // order (so `getElementById` still resolves the real element), but last-child
    // leaves every existing sibling's `:nth-child` index untouched.
    expect(host.lastElementChild).toBe(wrapperOf(handle));
    expect(Array.from(host.children)).toEqual([source, sibling, wrapperOf(handle)]);
    // The clone itself sits inside the engine-owned top-layer wrapper.
    expect(wrapperOf(handle).firstElementChild).toBe(handle.element);
  });

  it('injects into an explicit container when one is given', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    try {
      const handle = clone(createSource(), { container });
      expect(wrapperOf(handle).parentElement).toBe(container);
      handle.destroy();
    } finally {
      container.remove();
    }
  });

  it('falls back to in-place when the container belongs to another document', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const frame = document.createElement('iframe');
    document.body.appendChild(frame);
    try {
      const foreign = frame.contentDocument!.createElement('div');
      frame.contentDocument!.body.appendChild(foreign);

      const handle = clone(createSource(), { container: foreign });

      // Viewport coordinates do not carry across documents: adopted into the
      // frame, the preview would be offset by the frame's own position.
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('belongs to a different document'),
      );
      expect(wrapperOf(handle).parentElement).toBe(host);
    } finally {
      frame.remove();
      warnSpy.mockRestore();
    }
  });

  it('appends to the shadow root when the source is its direct child', () => {
    const shadowHost = document.createElement('div');
    host.appendChild(shadowHost);
    const shadow = shadowHost.attachShadow({ mode: 'open' });
    const source = document.createElement('div');
    shadow.appendChild(source);

    const handle = track(createDragPreviewElement(source, { content: 'clone' }))!;

    // A direct child of a shadow root has no `parentElement`; the preview hangs
    // off the shadow root itself so it stays under the same adopted styles.
    expect(wrapperOf(handle).parentNode).toBe(shadow);

    // The captured ancestor chain crosses the shadow host, so tearing the host
    // out still re-homes the preview to a surviving outer ancestor.
    shadowHost.remove();
    handle.ensureConnected();
    expect(wrapperOf(handle).parentElement).toBe(host);
  });

  it('writes only the geometry contract inline, parked off-screen', () => {
    const handle = clone(createSource());

    // Geometry only — any visual property written inline would beat every
    // consumer rule keyed on `[data-drag-preview]`.
    const { style } = handle.element;
    expect(style.position).toBe('fixed');
    expect(style.top).toBe('0px');
    expect(style.left).toBe('0px');
    // Margins are not part of the measured rect and would shift the preview off
    // its transform anchor.
    expect(style.margin).toBe('0px');
    // `elementFromPoint` must see through the preview to the drop targets below.
    expect(style.pointerEvents).toBe('none');
    expect(style.willChange).toBe('translate');
    // Parked off-screen until the first frame positions it. `translate` rather
    // than `transform`, so a consumer `rotate`/`scale` composes about the box.
    expect(style.translate).toBe('-10000px -10000px');
    expect(style.zIndex).toBe('2147483647');
    // The clone keeps the box it had in the layout it just left; min/max clamps
    // from the app's CSS must not resize it out of that box.
    expect(style.minWidth).toBe('0px');
    expect(style.maxWidth).toBe('none');
    expect(style.minHeight).toBe('0px');
    expect(style.maxHeight).toBe('none');
  });

  describe('sourceRect', () => {
    /**
     * Give `source` a transformed layout: `rect` is what `getBoundingClientRect`
     * reports (the transformed AABB) and `layout` its untransformed border box,
     * the way a browser would report them for a scaled element.
     */
    function mockTransformedLayout(
      source: HTMLElement,
      rect: { x: number; y: number; width: number; height: number },
      layout: { width: number; height: number },
    ): void {
      source.style.transform = 'scale(1.08)';
      // Keep computed transform-origin aligned with the mocked layout box.
      source.style.width = `${layout.width}px`;
      source.style.height = `${layout.height}px`;
      source.getBoundingClientRect = () =>
        new DOMRect(rect.x, rect.y, rect.width, rect.height) as DOMRect;
      Object.defineProperty(source, 'offsetWidth', { value: layout.width, configurable: true });
      Object.defineProperty(source, 'offsetHeight', { value: layout.height, configurable: true });
    }

    it('re-centres the untransformed size on the transformed box, so the preview does not jump', () => {
      const source = createSource();
      // A 100x50 card at (100, 100), scaled 1.08 about its centre (150, 125):
      // the AABB grows to 108x54 and its top-left moves to (96, 98).
      mockTransformedLayout(
        source,
        { x: 96, y: 98, width: 108, height: 54 },
        {
          width: 100,
          height: 50,
        },
      );

      const handle = clone(source);

      // The preview renders untransformed, so its rect has to be the *untransformed*
      // box — size and origin both. Pairing the untransformed size with the
      // transformed AABB's top-left anchored the preview against a box it doesn't
      // own, snapping it up-and-left by 4% of the card on pickup.
      expect(handle.sourceRect.width).toBe(100);
      expect(handle.sourceRect.height).toBe(50);
      expect(handle.sourceRect.x).toBe(100);
      expect(handle.sourceRect.y).toBe(100);
    });

    it('uses the measured rect verbatim when nothing transforms the source', () => {
      const source = createSource();
      source.getBoundingClientRect = () => new DOMRect(10, 20, 100.5, 50.25) as DOMRect;

      const handle = clone(source);

      // Not `offsetWidth`, which rounds to an integer: an untransformed source's
      // own rect is exact, and the preview should keep its subpixel size.
      expect(handle.sourceRect.x).toBe(10);
      expect(handle.sourceRect.y).toBe(20);
      expect(handle.sourceRect.width).toBe(100.5);
      expect(handle.sourceRect.height).toBe(50.25);
    });

    it.each([
      ['the translate longhand', () => ({ translate: '10px 5px' })],
      ['a translate-only transform', () => ({ transform: 'translate(10px, 5px)' })],
    ])('treats %s as untransformed, since it does not resize the box', (_label, style) => {
      const source = createSource();
      Object.assign(source.style, style());
      source.getBoundingClientRect = () => new DOMRect(20, 25, 100.5, 50.25) as DOMRect;
      // What a browser rounds `offsetWidth` to. Counting translation as a
      // transform would size the preview from these and lose the subpixels.
      Object.defineProperty(source, 'offsetWidth', { value: 100, configurable: true });
      Object.defineProperty(source, 'offsetHeight', { value: 50, configurable: true });

      const handle = clone(source);

      // Translation moves the box without resizing it, so the rect already
      // describes the preview's own box — origin included, since the offset is
      // baked into it, the engine's positioning write overwrites the clone's
      // `translate`, and its `transform` is neutralized.
      expect(handle.sourceRect.x).toBe(20);
      expect(handle.sourceRect.y).toBe(25);
      expect(handle.sourceRect.width).toBe(100.5);
      expect(handle.sourceRect.height).toBe(50.25);
    });
  });

  it('never inherits data-dragging, so dimming the source does not dim the preview', () => {
    const source = createSource();
    // The engine marks the source after cloning, but a consumer may already
    // render the attribute itself.
    source.setAttribute('data-dragging', '');

    const handle = clone(source);

    expect(handle.element).not.toHaveAttribute('data-dragging');
  });

  it('removes scripts, which would otherwise re-execute when the clone is inserted', () => {
    // `cloneNode` does not copy a script's "already started" flag.
    const handle = clone(createSource('<span>hi</span><script>window.ran = true;</script>'));

    expect(handle.element.querySelector('script')).toBeNull();
    expect(handle.element.querySelector('span')).not.toBeNull();
  });

  it('copies live state before removing scripts, so the node zip stays aligned', () => {
    // `copyLiveState` zips the source and clone trees by index; removing the
    // clone's <script> first would shift every clone node after it by one, and
    // the typed value would land on the wrong element (or nowhere).
    const source = createSource('<script>window.ran = true;</script><input type="text" />');
    source.querySelector<HTMLInputElement>('input')!.value = 'typed';

    const handle = clone(source);

    expect(handle.element.querySelector('script')).toBeNull();
    expect(handle.element.querySelector<HTMLInputElement>('input')!.value).toBe('typed');
  });

  it('neuters iframes so the clone does not refetch or re-run the embedded document', () => {
    const handle = clone(
      createSource('<iframe src="https://example.com" srcdoc="<p>embedded</p>"></iframe>'),
    );

    const frame = handle.element.querySelector('iframe')!;
    expect(frame).not.toHaveAttribute('src');
    // `srcdoc` wins over `src`; left in place, inserting the clone would
    // re-execute the embedded document once per drag.
    expect(frame).not.toHaveAttribute('srcdoc');
  });

  it('strips autoplay from cloned media and blocks its preload', () => {
    const handle = clone(createSource('<video autoplay></video><audio autoplay></audio>'));

    for (const media of Array.from(handle.element.querySelectorAll('video, audio'))) {
      expect(media).not.toHaveAttribute('autoplay');
      expect(media).toHaveAttribute('preload', 'none');
    }
  });

  it('rewrites ids and the references inside the clone that point at them', () => {
    const source = createSource(
      '<label for="name-input">Name</label><input id="name-input" aria-describedby="hint" aria-owns="hint external" /><p id="hint">Hint</p>',
    );

    const handle = clone(source);

    // Duplicate ids would poison `getElementById`, `<label for>` and `aria-labelledby`.
    expect(handle.element.querySelector('input')!.id).toBe('name-input-drag-preview');
    expect(handle.element.querySelector('label')!.getAttribute('for')).toBe(
      'name-input-drag-preview',
    );
    expect(handle.element.querySelector('input')!.getAttribute('aria-describedby')).toBe(
      'hint-drag-preview',
    );
    expect(handle.element.querySelector('input')!.getAttribute('aria-owns')).toBe(
      'hint-drag-preview external',
    );
    // The real source still owns the original id.
    expect(document.getElementById('name-input')).toBe(source.querySelector('input'));
  });

  it('rewrites SVG paint-server references to the cloned ids', () => {
    const source = createSource(`
      <svg xmlns:xlink="http://www.w3.org/1999/xlink">
        <defs>
          <clipPath id="crop"><rect width="10" height="10" /></clipPath>
          <filter id="blur"><feGaussianBlur stdDeviation="1" /></filter>
        </defs>
        <path clip-path="url(#crop)" style="filter: url('#blur'); fill: url(#crop)" />
        <use href="#crop" xlink:href="#blur" />
      </svg>
    `);

    const handle = clone(source);
    const path = handle.element.querySelector('path')!;

    expect(handle.element.querySelector('clipPath')!.id).toBe('crop-drag-preview');
    expect(handle.element.querySelector('filter')!.id).toBe('blur-drag-preview');
    expect(path.getAttribute('clip-path')).toBe('url(#crop-drag-preview)');
    expect(path.getAttribute('style')).toContain("url('#blur-drag-preview')");
    expect(path.getAttribute('style')).toContain('url(#crop-drag-preview)');
    const use = handle.element.querySelector('use')!;
    expect(use.getAttribute('href')).toBe('#crop-drag-preview');
    expect(use.getAttribute('xlink:href')).toBe('#blur-drag-preview');
  });

  it('uses an inert native placeholder instead of cloning custom-element application code', () => {
    const customElementName = 'x-drag-preview-side-effect';
    const lifecycle = { constructed: 0, connected: 0, disconnected: 0 };
    if (!customElements.get(customElementName)) {
      customElements.define(
        customElementName,
        class extends HTMLElement {
          constructor() {
            super();
            lifecycle.constructed += 1;
          }

          connectedCallback() {
            lifecycle.connected += 1;
          }

          disconnectedCallback() {
            lifecycle.disconnected += 1;
          }
        },
      );
    }
    const source = createSource(
      `<${customElementName}><span>Payment</span></${customElementName}>`,
    );
    const beforeClone = { ...lifecycle };

    const handle = clone(source);

    expect(lifecycle).toEqual(beforeClone);
    expect(handle.element.querySelector(customElementName)).toBeNull();
    expect(handle.element.querySelector('div > span')).toHaveTextContent('Payment');
  });

  it('copies live form state, which cloneNode leaves at its defaults', () => {
    const source = createSource(
      '<input type="text" /><input type="checkbox" /><select><option>a</option><option>b</option></select><textarea></textarea>',
    );
    const text = source.querySelector<HTMLInputElement>('input[type=text]')!;
    const checkbox = source.querySelector<HTMLInputElement>('input[type=checkbox]')!;
    const select = source.querySelector('select')!;
    const textarea = source.querySelector('textarea')!;
    text.value = 'typed';
    checkbox.checked = true;
    select.selectedIndex = 1;
    textarea.value = 'drafted';

    const handle = clone(source);

    // `cloneNode` copies the `value`/`checked` *attributes* — the defaults — not
    // what the user actually typed or picked.
    expect(handle.element.querySelector<HTMLInputElement>('input[type=text]')!.value).toBe('typed');
    expect(handle.element.querySelector<HTMLInputElement>('input[type=checkbox]')!.checked).toBe(
      true,
    );
    expect(handle.element.querySelector('select')!.selectedIndex).toBe(1);
    expect(handle.element.querySelector('textarea')!.value).toBe('drafted');
  });

  it('skips the value copy for file inputs, whose value cannot be set programmatically', () => {
    const source = createSource('<input type="file" /><input type="text" />');
    const fileInput = source.querySelector<HTMLInputElement>('input[type=file]')!;
    const text = source.querySelector<HTMLInputElement>('input[type=text]')!;
    text.value = 'typed';
    // A chosen file makes the input report `C:\fakepath\…`; assigning that to the
    // clone throws `InvalidStateError` (jsdom enforces the same rule), which would
    // abort the whole drag. Fake the selection through the getter.
    Object.defineProperty(fileInput, 'value', {
      configurable: true,
      get: () => 'C:\\fakepath\\photo.png',
    });

    const handle = clone(source);

    expect(handle.element.querySelector<HTMLInputElement>('input[type=file]')!.value).toBe('');
    // The rest of the tree still gets its live state.
    expect(handle.element.querySelector<HTMLInputElement>('input[type=text]')!.value).toBe('typed');
  });

  it('strips `name` from cloned descendant controls so the form is not submitted twice', () => {
    const source = createSource(
      '<input type="text" name="title" value="a" /><select name="size"><option>s</option></select>' +
        '<textarea name="notes"></textarea><button name="action">Go</button>',
    );

    const handle = clone(source);

    for (const control of Array.from(
      handle.element.querySelectorAll('input, select, textarea, button'),
    )) {
      expect(control).not.toHaveAttribute('name');
    }
  });

  it('strips `name` from a cloned root control, which querySelectorAll never returns', () => {
    // The draggable itself is often the control — a whole radio card, a button.
    const source = document.createElement('input');
    source.type = 'radio';
    source.name = 'plan';
    source.value = 'pro';
    source.checked = true;
    host.appendChild(source);
    const other = document.createElement('input');
    other.type = 'radio';
    other.name = 'plan';
    other.value = 'basic';
    host.appendChild(other);

    const handle = track(createDragPreviewElement(source, { content: 'clone' }))!;

    // A named clone joins the radio group, which unchecks the real source the
    // moment it is inserted — and leaves the group empty when it is removed.
    expect(handle.element).not.toHaveAttribute('name');
    expect(source.checked).toBe(true);

    handle.destroy();
    expect(source.checked).toBe(true);
  });

  it('re-homes the clone when an ancestor is torn out, without waiting for a frame', async () => {
    const inner = document.createElement('div');
    host.appendChild(inner);
    const source = document.createElement('div');
    inner.appendChild(source);

    const handle = track(createDragPreviewElement(source, { content: 'clone' }))!;
    expect(wrapperOf(handle).parentElement).toBe(inner);

    // A React commit tears the host out *after* the callback that triggered it,
    // so nothing calls `ensureConnected`. The observer repairs it anyway.
    inner.remove();
    await Promise.resolve();

    expect(wrapperOf(handle).parentElement).toBe(host);
  });

  it('re-homes the clone to the nearest surviving ancestor when its host is torn out', () => {
    const inner = document.createElement('div');
    host.appendChild(inner);
    const source = document.createElement('div');
    inner.appendChild(source);

    const handle = track(createDragPreviewElement(source, { content: 'clone' }))!;
    expect(wrapperOf(handle).parentElement).toBe(inner);

    // A virtualizer recycling the row takes the clone's host with it.
    inner.remove();
    handle.ensureConnected();

    expect(wrapperOf(handle).parentElement).toBe(host);
  });

  it('returns null when there is nothing to clone into', () => {
    const detached = document.createElement('div');

    expect(createDragPreviewElement(detached, { content: 'clone' })).toBeNull();
  });

  it('removes the clone on destroy, idempotently', () => {
    const handle = clone(createSource());

    handle.destroy();
    expect(handle.element.isConnected).toBe(false);
    expect(() => handle.destroy()).not.toThrow();
  });
});
