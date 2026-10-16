import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createDragPreviewElement, measurePreviewAnchor } from './cloneDragPreview';
import type { DragPreviewElementHandle } from './cloneDragPreview';

/** Measure and clone `source`, the way a pickup does. */
function clonePreview(source: HTMLElement, container: HTMLElement | null) {
  const anchor = measurePreviewAnchor(source, container);
  return anchor && createDragPreviewElement(source, anchor);
}

describe('createDragPreviewElement (clone)', () => {
  let host: HTMLElement;
  const handles: DragPreviewElementHandle[] = [];

  beforeEach(() => {
    host = document.createElement('div');
    document.body.appendChild(host);
  });

  afterEach(() => {
    // Destroy the handles before removing the host. Each one observes its ancestor
    // chain, so `host.remove()` would trigger `reconnect()` and re-append the
    // preview to `document.body`.
    while (handles.length > 0) {
      handles.pop()!.destroy();
    }
    host.remove();
    const leaked = document.querySelectorAll('[data-drag-preview]').length;
    if (leaked > 0) {
      throw new Error(`${leaked} drag preview element(s) leaked into the document after cleanup.`);
    }
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
    const handle = track(clonePreview(source, options?.container ?? null));
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

  it('keeps the source classes so consumers can style it with their own selector', () => {
    const handle = clone(createSource());

    // `.Card[data-drag-preview] { … }` works because the clone keeps the classes
    // and the engine writes only geometry inline, never visuals.
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

    // Last child, not next sibling. Both keep `getElementById` resolving the real
    // element, but only the last position leaves every sibling's `:nth-child` index
    // unchanged.
    expect(Array.from(host.children)).toEqual([source, sibling, handle.element]);
  });

  it('injects into an explicit container when one is given', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    try {
      const handle = clone(createSource(), { container });
      expect(handle.element.parentElement).toBe(container);
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

      // Viewport coordinates do not carry across documents. Inside the frame, the
      // preview would be offset by the frame's position.
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('belongs to a different document'),
      );
      expect(handle.element.parentElement).toBe(host);
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

    const handle = track(clonePreview(source, null))!;

    // A direct child of a shadow root has no `parentElement`. The preview is
    // appended to the shadow root itself, so it stays under the same adopted styles.
    expect(handle.element.parentNode).toBe(shadow);

    // The captured ancestor chain crosses the shadow host, so tearing the host
    // out still re-homes the preview to a surviving outer ancestor.
    shadowHost.remove();
    handle.ensureConnected();
    expect(handle.element.parentElement).toBe(host);
  });

  it('writes only the geometry contract inline, parked off-screen', () => {
    const handle = clone(createSource());

    // Geometry only. A visual property written inline would beat every consumer
    // rule keyed on `[data-drag-preview]`.
    const { style } = handle.element;
    expect(style.position).toBe('fixed');
    expect(style.top).toBe('0px');
    expect(style.left).toBe('0px');
    // A source `right` would over-constrain the box, and a right-to-left page
    // would then drop `left`.
    expect(style.right).toBe('auto');
    expect(style.bottom).toBe('auto');
    // Margins are not part of the measured rect and would shift the preview off
    // its transform anchor.
    expect(style.margin).toBe('0px');
    // `elementFromPoint` must see through the preview to the drop targets below.
    expect(style.pointerEvents).toBe('none');
    expect(style.willChange).toBe('translate');
    // Parked off-screen until the first frame positions it. Uses `translate`, not
    // `transform`, so a consumer `rotate`/`scale` composes about the box.
    expect(style.translate).toBe('-10000px -10000px');
    // The clone keeps its size from the source layout. Min/max constraints from
    // the app's CSS must not resize it.
    expect(style.minWidth).toBe('0px');
    expect(style.maxWidth).toBe('none');
    expect(style.minHeight).toBe('0px');
    expect(style.maxHeight).toBe('none');
  });

  describe('sourceRect', () => {
    /**
     * Give `source` a transformed layout, as a browser reports it for a scaled
     * element. `rect` is what `getBoundingClientRect` returns (the transformed
     * bounding box), and `layout` is its untransformed border box.
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
      // A 100x50 card at (100, 100), scaled 1.08 about its center (150, 125). The
      // bounding box grows to 108x54 and its top-left moves to (96, 98).
      mockTransformedLayout(
        source,
        { x: 96, y: 98, width: 108, height: 54 },
        {
          width: 100,
          height: 50,
        },
      );

      const handle = clone(source);

      // The preview renders untransformed, so its rect must be the untransformed
      // box, origin included. The transformed top-left would snap the preview up
      // and left by 4% of the card on pickup.
      expect(handle.anchor.sourceRect.width).toBe(100);
      expect(handle.anchor.sourceRect.height).toBe(50);
      expect(handle.anchor.sourceRect.x).toBe(100);
      expect(handle.anchor.sourceRect.y).toBe(100);
    });

    it('uses the measured rect verbatim when nothing transforms the source', () => {
      const source = createSource();
      source.getBoundingClientRect = () => new DOMRect(10, 20, 100.5, 50.25) as DOMRect;

      const handle = clone(source);

      // Not `offsetWidth`, which rounds to an integer. An untransformed source's
      // rect is exact, and the preview keeps its subpixel size.
      expect(handle.anchor.sourceRect.x).toBe(10);
      expect(handle.anchor.sourceRect.y).toBe(20);
      expect(handle.anchor.sourceRect.width).toBe(100.5);
      expect(handle.anchor.sourceRect.height).toBe(50.25);
    });

    it.each([
      ['the translate longhand', () => ({ translate: '10px 5px' })],
      // In the matrix form a browser resolves the computed `transform` to.
      ['a translate-only transform', () => ({ transform: 'matrix(1, 0, 0, 1, 10, 5)' })],
    ])('treats %s as untransformed, since it does not resize the box', (_label, style) => {
      const source = createSource();
      Object.assign(source.style, style());
      source.getBoundingClientRect = () => new DOMRect(20, 25, 100.5, 50.25) as DOMRect;
      // What a browser rounds `offsetWidth` to. Counting translation as a
      // transform would size the preview from these and lose the subpixels.
      Object.defineProperty(source, 'offsetWidth', { value: 100, configurable: true });
      Object.defineProperty(source, 'offsetHeight', { value: 50, configurable: true });

      const handle = clone(source);

      // Translation doesn't resize the box, so the rect, offset included, already
      // describes the preview's box. The engine's positioning overwrites the clone's
      // `translate`, and its `transform` is neutralized.
      expect(handle.anchor.sourceRect.x).toBe(20);
      expect(handle.anchor.sourceRect.y).toBe(25);
      expect(handle.anchor.sourceRect.width).toBe(100.5);
      expect(handle.anchor.sourceRect.height).toBe(50.25);
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

  it('never inherits data-settling from a source whose previous preview is settling', () => {
    const source = createSource();
    source.setAttribute('data-settling', '');

    const handle = clone(source);

    expect(handle.element).not.toHaveAttribute('data-settling');
  });

  it('removes descendant scripts from the preview', () => {
    const handle = clone(createSource('<span>hi</span><script>window.ran = true;</script>'));

    expect(handle.element.querySelector('script')).toBeNull();
    expect(handle.element.querySelector('span')).not.toBeNull();
  });

  it('preserves live select state when removing scripts', () => {
    const source = createSource(
      '<script>window.ran = true;</script><select><option>a</option><option>b</option></select>',
    );
    source.querySelector('select')!.selectedIndex = 1;

    const handle = clone(source);

    expect(handle.element.querySelector('script')).toBeNull();
    expect(handle.element.querySelector('select')!.selectedIndex).toBe(1);
  });

  it('neuters iframes so the clone does not refetch or re-run the embedded document', () => {
    const handle = clone(
      createSource('<iframe src="https://example.com" srcdoc="<p>embedded</p>"></iframe>'),
    );

    const frame = handle.element.querySelector('iframe')!;
    expect(frame).not.toHaveAttribute('src');
    // `srcdoc` takes precedence over `src`. Left in place, inserting the clone
    // would load the embedded document on every drag.
    expect(frame).not.toHaveAttribute('srcdoc');
  });

  it('neuters objects and embeds so the clone does not reload or re-run them', () => {
    const svg = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg'/>";
    const handle = clone(
      createSource(`<object data="${svg}" type="image/svg+xml"></object><embed src="${svg}">`),
    );

    expect(handle.element.querySelector('object')).not.toHaveAttribute('data');
    expect(handle.element.querySelector('embed')).not.toHaveAttribute('src');
  });

  it('loads cloned lazy images eagerly, since the preview starts off-screen', () => {
    const handle = clone(createSource('<img alt="" loading="lazy" />'));

    expect(handle.element.querySelector('img')).toHaveAttribute('loading', 'eager');
  });

  it('strips `name` from every cloned element except slots', () => {
    const handle = clone(
      createSource(
        '<details name="faq" open><summary>Q</summary>A</details><form name="settings"></form>' +
          '<slot name="icon"></slot>',
      ),
    );

    // A named `<details>` in the source's exclusive group would close itself, and
    // a named form would turn `document.settings` into a collection.
    expect(handle.element.querySelector('details')).not.toHaveAttribute('name');
    expect(handle.element.querySelector('form')).not.toHaveAttribute('name');
    // A nameless slot would take the host's unassigned children.
    expect(handle.element.querySelector('slot')).toHaveAttribute('name', 'icon');
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

    const input = handle.element.querySelector('input')!;
    const hint = handle.element.querySelector('p')!;
    expect(input.id).not.toBe('name-input');
    expect(hint.id).not.toBe('hint');
    expect(handle.element.querySelector('label')!.getAttribute('for')).toBe(input.id);
    expect(input.getAttribute('aria-describedby')).toBe(hint.id);
    expect(handle.element.querySelector('input')!.getAttribute('aria-owns')).toBe(
      `${hint.id} external`,
    );
    // The real source still owns the original id.
    expect(document.getElementById('name-input')).toBe(source.querySelector('input'));

    const next = clone(source);
    expect(next.element.querySelector('input')!.id).not.toBe(input.id);
    expect(next.element.querySelector('p')!.id).not.toBe(hint.id);
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
    const cropId = handle.element.querySelector('clipPath')!.id;
    const blurId = handle.element.querySelector('filter')!.id;

    expect(cropId).not.toBe('crop');
    expect(blurId).not.toBe('blur');
    expect(path.getAttribute('clip-path')).toBe(`url(#${cropId})`);
    // Browsers re-serialize the rewritten declarations with their own quoting.
    expect(path.getAttribute('style')).toMatch(new RegExp(`filter: url\\(['"]?#${blurId}['"]?\\)`));
    expect(path.getAttribute('style')).toMatch(new RegExp(`fill: url\\(['"]?#${cropId}['"]?\\)`));
    const use = handle.element.querySelector('use')!;
    expect(use.getAttribute('href')).toBe(`#${cropId}`);
    expect(use.getAttribute('xlink:href')).toBe(`#${blurId}`);
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
      `<${customElementName} style="align-self: end; justify-self: center; order: 2"><span>Payment</span></${customElementName}>`,
    );
    const beforeClone = { ...lifecycle };

    const handle = clone(source);

    expect(lifecycle).toEqual(beforeClone);
    expect(handle.element.querySelector(customElementName)).toBeNull();
    expect(handle.element.querySelector('div > span')).toHaveTextContent('Payment');
    // The placeholder keeps its place in the parent's flex/grid layout.
    const placeholder = handle.element.querySelector<HTMLElement>('div > span')!.parentElement!;
    expect(placeholder.style.alignSelf).toBe('end');
    expect(placeholder.style.justifySelf).toBe('center');
    expect(placeholder.style.order).toBe('2');
  });

  it('preserves live form state', () => {
    const source = createSource(
      '<input type="text" /><input type="checkbox" /><input type="checkbox" class="Mixed" /><select><option>a</option><option>b</option></select><textarea></textarea>',
    );
    const text = source.querySelector<HTMLInputElement>('input[type=text]')!;
    const checkbox = source.querySelector<HTMLInputElement>('input[type=checkbox]')!;
    const select = source.querySelector('select')!;
    const textarea = source.querySelector('textarea')!;
    text.value = 'typed';
    checkbox.checked = true;
    select.selectedIndex = 1;
    textarea.value = 'drafted';
    // A property only. Cloning doesn't carry it.
    source.querySelector<HTMLInputElement>('.Mixed')!.indeterminate = true;

    const handle = clone(source);

    expect(handle.element.querySelector<HTMLInputElement>('input[type=text]')!.value).toBe('typed');
    expect(handle.element.querySelector<HTMLInputElement>('input[type=checkbox]')!.checked).toBe(
      true,
    );
    expect(handle.element.querySelector('select')!.selectedIndex).toBe(1);
    expect(handle.element.querySelector('textarea')!.value).toBe('drafted');
    expect(handle.element.querySelector<HTMLInputElement>('.Mixed')!.indeterminate).toBe(true);
  });

  it('does not assign a file input value programmatically', () => {
    const source = createSource('<input type="file" /><input type="text" />');
    const fileInput = source.querySelector<HTMLInputElement>('input[type=file]')!;
    const text = source.querySelector<HTMLInputElement>('input[type=text]')!;
    text.value = 'typed';
    // A chosen file makes the input report `C:\fakepath\…`. Assigning that to the
    // clone throws `InvalidStateError` (jsdom enforces the same rule) and would
    // abort the drag. Fake the selection through the getter.
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

  it.each(['ancestor', 'explicit'] as const)(
    'keeps cloned controls out of their %s form without disabling them',
    (association) => {
      const form = document.createElement('form');
      form.id = 'preview-form';
      host.appendChild(form);
      const source = createSource('<input name="title" required>');
      const input = source.querySelector('input')!;
      if (association === 'ancestor') {
        form.appendChild(source);
      } else {
        input.setAttribute('form', form.id);
      }

      const handle = clone(source);
      input.value = 'Corrected after pickup';

      expect(form.checkValidity()).toBe(true);
      expect(form.elements).toHaveLength(1);
      expect(Array.from(new FormData(form).entries())).toEqual([['title', input.value]]);
      expect(handle.element.querySelector('input')).not.toBeDisabled();
    },
  );

  it('strips `name` from a cloned root control, which querySelectorAll never returns', () => {
    // The draggable itself is often the control, such as a radio card or a button.
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

    const handle = track(clonePreview(source, null))!;

    // A named clone joins the radio group. Inserting it unchecks the real source,
    // and removing it leaves the group with nothing checked.
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

    const handle = track(clonePreview(source, null))!;
    expect(handle.element.parentElement).toBe(inner);

    // A React commit tears the host out after the callback that triggered it, so
    // nothing calls `ensureConnected`. The observer repairs it anyway.
    inner.remove();
    await Promise.resolve();

    expect(handle.element.parentElement).toBe(host);
  });

  it('re-homes the clone to the nearest surviving ancestor when its host is torn out', () => {
    const inner = document.createElement('div');
    host.appendChild(inner);
    const source = document.createElement('div');
    inner.appendChild(source);

    const handle = track(clonePreview(source, null))!;
    expect(handle.element.parentElement).toBe(inner);

    // A virtualizer recycling the row takes the clone's host with it.
    inner.remove();
    handle.ensureConnected();

    expect(handle.element.parentElement).toBe(host);
  });

  it('keeps the number of an ordered list item', () => {
    // The clone joins the list after every item. Without its own `value`, the list
    // would number it as its last item.
    const list = document.createElement('ol');
    list.start = 3;
    list.innerHTML = '<li>a</li><li>b</li><li>c</li>';
    host.appendChild(list);
    const item = list.children[1] as HTMLElement;

    const handle = track(clonePreview(item, null))!;

    expect(handle.element.parentElement).toBe(list);
    expect(handle.element.localName).toBe('li');
    expect(handle.element.getAttribute('value')).toBe('4');
  });

  it('gives the clone its source number in a reversed list', () => {
    const list = document.createElement('ol');
    list.reversed = true;
    list.innerHTML = '<li>a</li><li>b</li><li>c</li>';
    host.appendChild(list);

    const handle = track(clonePreview(list.children[0] as HTMLElement, null))!;

    expect(handle.element.getAttribute('value')).toBe('3');
  });

  it('returns null when there is nothing to clone into', () => {
    const detached = document.createElement('div');

    expect(clonePreview(detached, null)).toBeNull();
  });

  it('removes the clone on destroy, idempotently', () => {
    const handle = clone(createSource());

    handle.destroy();
    expect(handle.element.isConnected).toBe(false);
    expect(() => handle.destroy()).not.toThrow();
  });
});
