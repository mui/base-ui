import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act } from '@mui/internal-test-utils';
import { createDndRenderer, isJSDOM } from '#test-utils';
import { flushRaf, setupDragEngineTests } from '../../../../test/dnd';
import { DRAG_PREVIEW_ATTR } from '../dragAttributes';
import { createClonedDragPreviewElement, createDragPreviewHostElement } from './cloneDragPreview';

setupDragEngineTests();

/** Dispatch a mouse pointer event on `target` inside `act`, as the sensor's listeners bubble to it. */
function dispatchMouse(
  type: 'pointerdown' | 'pointermove' | 'pointerup',
  target: EventTarget,
  x: number,
  y: number,
): void {
  act(() => {
    target.dispatchEvent(
      new PointerEvent(type, {
        pointerType: 'mouse',
        pointerId: 1,
        isPrimary: true,
        clientX: x,
        clientY: y,
        button: type === 'pointermove' ? -1 : 0,
        buttons: type === 'pointerup' ? 0 : 1,
        bubbles: true,
        cancelable: true,
      }),
    );
  });
}

/** The single neutralizer sheet the engine adopts into a root, or `undefined`. */
function findNeutralizerSheet(root: DocumentOrShadowRoot): CSSStyleSheet | undefined {
  return root.adoptedStyleSheets.find((sheet) =>
    Array.from(sheet.cssRules).some((rule) => rule.cssText.includes(DRAG_PREVIEW_ATTR)),
  );
}

/**
 * The top layer is the whole point of the in-place preview: it is what lets an
 * element injected deep inside a transformed, clipping ancestor still be positioned
 * against the viewport and painted above everything. jsdom implements none of it
 * (`showPopover` doesn't exist), so these have to run in a real browser.
 */
describe.skipIf(isJSDOM)('createClonedDragPreviewElement (top layer)', () => {
  let scroller: HTMLElement;
  let list: HTMLElement;
  let source: HTMLElement;

  beforeEach(() => {
    scroller = document.createElement('div');
    // The shape a virtualizer produces: a clipping scroll container whose content
    // is translated. Both would break a plain `position: fixed` preview.
    scroller.style.cssText =
      'position: relative; width: 200px; height: 100px; overflow: hidden; border: 0;';
    list = document.createElement('div');
    list.style.cssText = 'transform: translateY(40px); width: 200px;';
    source = document.createElement('div');
    source.style.cssText = 'width: 120px; height: 30px; background: rgb(0 128 0);';
    source.textContent = 'Row';

    list.appendChild(source);
    scroller.appendChild(list);
    document.body.appendChild(scroller);
  });

  afterEach(() => {
    scroller.remove();
  });

  it('neutralizes contextual source motion while allowing ending transitions', () => {
    const sheet = document.createElement('style');
    sheet.textContent =
      '.List .Card { transition: all 200ms; transform: translateX(10px); } .Card[data-ending-style] { transition: translate 100ms; }';
    document.head.appendChild(sheet);
    list.className = 'List';
    source.className = 'Card';
    const handle = createClonedDragPreviewElement(source, null)!;
    try {
      expect(getComputedStyle(handle.element).transitionDuration).toBe('0s');
      expect(getComputedStyle(handle.element).transform).toBe('none');
      handle.element.setAttribute('data-ending-style', '');
      handle.prepareForDrop?.();
      expect(getComputedStyle(handle.element).transitionProperty).toBe('translate');
      expect(getComputedStyle(handle.element).transitionDuration).toBe('0.1s');
    } finally {
      handle.destroy();
      sheet.remove();
    }
  });

  it('preserves direct-child styles on the clone and its descendants', () => {
    const sheet = document.createElement('style');
    sheet.textContent =
      '.List > .Card { display: flex; gap: 8px; background: rgb(255, 0, 0); } .List > .Card > span { color: rgb(0, 0, 255); } .Card[data-drag-preview] { border: 3px solid rgb(0, 128, 0); }';
    document.head.appendChild(sheet);
    list.className = 'List';
    source.className = 'Card';
    source.style.removeProperty('background');
    source.innerHTML = '<span>Card</span>';
    const handle = createClonedDragPreviewElement(source, null)!;
    try {
      const computed = getComputedStyle(handle.element);
      expect(computed.backgroundColor).toBe('rgb(255, 0, 0)');
      expect(computed.display).toBe('flex');
      expect(computed.gap).toBe('8px');
      expect(computed.borderTopWidth).toBe('3px');
      expect(getComputedStyle(handle.element.firstElementChild!).color).toBe('rgb(0, 0, 255)');
    } finally {
      handle.destroy();
      sheet.remove();
    }
  });

  it('preserves sibling-position styles of the source, not of the last child', () => {
    const sheet = document.createElement('style');
    sheet.textContent = `
      .List .Row { background: rgb(255, 255, 255); border-top: 0 solid rgb(0, 0, 0); }
      .List .Row:nth-child(odd) { background: rgb(0, 0, 255); }
      .List .Row:first-child { border-top: 3px solid rgb(255, 0, 0); }
    `;
    document.head.appendChild(sheet);
    list.className = 'List';
    source.className = 'Row';
    source.style.removeProperty('background');
    // Three rows, so the last one is odd like the source but not `:first-child`,
    // and anything appended after it lands on an even index.
    for (let i = 0; i < 2; i += 1) {
      const row = document.createElement('div');
      row.className = 'Row';
      row.textContent = `Row ${i + 2}`;
      list.appendChild(row);
    }
    const handle = createClonedDragPreviewElement(source, null)!;
    try {
      const sourceStyle = getComputedStyle(source);
      const previewStyle = getComputedStyle(handle.element);
      expect(sourceStyle.backgroundColor).toBe('rgb(0, 0, 255)');
      expect(previewStyle.backgroundColor).toBe('rgb(0, 0, 255)');
      expect(sourceStyle.borderTopWidth).toBe('3px');
      expect(previewStyle.borderTopWidth).toBe('3px');
      expect(previewStyle.borderTopColor).toBe('rgb(255, 0, 0)');
    } finally {
      handle.destroy();
      sheet.remove();
    }
  });

  it('restores sibling-position styles the wrapper position drops', () => {
    const sheet = document.createElement('style');
    sheet.textContent = `
      .List .Row { background: rgb(255, 255, 255); }
      .List .Row:nth-child(even) { background: rgb(0, 0, 255); }
      .List .Row:last-child { border-top: 3px solid rgb(255, 0, 0); }
    `;
    document.head.appendChild(sheet);
    list.className = 'List';
    source.className = 'Row';
    source.style.removeProperty('background');
    // The source is the second and last row: even, and `:last-child`. Inside the
    // wrapper the clone is first and only, so both rules stop matching.
    const first = document.createElement('div');
    first.className = 'Row';
    first.textContent = 'Row 1';
    list.insertBefore(first, source);
    const handle = createClonedDragPreviewElement(source, null)!;
    try {
      const previewStyle = getComputedStyle(handle.element);
      expect(previewStyle.backgroundColor).toBe('rgb(0, 0, 255)');
      expect(previewStyle.borderTopWidth).toBe('3px');
      expect(previewStyle.borderTopColor).toBe('rgb(255, 0, 0)');
    } finally {
      handle.destroy();
      sheet.remove();
    }
  });

  it('keeps preview positioning when structural rules position the source', () => {
    const sheet = document.createElement('style');
    sheet.textContent =
      '.List > .Card { position: absolute; left: 100px; top: 100px; margin: 20px; }';
    document.head.appendChild(sheet);
    list.className = 'List';
    source.className = 'Card';
    const rect = source.getBoundingClientRect();
    const handle = createClonedDragPreviewElement(source, null)!;
    try {
      handle.element.style.translate = `${rect.left}px ${rect.top}px`;
      const previewRect = handle.element.getBoundingClientRect();
      expect(previewRect.left).toBeCloseTo(rect.left);
      expect(previewRect.top).toBeCloseTo(rect.top);
      expect(previewRect.width).toBeCloseTo(rect.width);
      expect(previewRect.height).toBeCloseTo(rect.height);
    } finally {
      handle.destroy();
      sheet.remove();
    }
  });

  it('does not restore a structural transform onto the clone root', () => {
    const sheet = document.createElement('style');
    sheet.textContent = '.List > .Card { transform: translateX(10px); rotate: 4deg; }';
    document.head.appendChild(sheet);
    list.className = 'List';
    source.className = 'Card';
    const handle = createClonedDragPreviewElement(source, null)!;
    try {
      const previewStyle = getComputedStyle(handle.element);
      expect(previewStyle.transform).toBe('none');
      expect(previewStyle.rotate).toBe('4deg');
    } finally {
      handle.destroy();
      sheet.remove();
    }
  });

  it('does not insert the clone beside the source while building the preview', () => {
    const observer = new MutationObserver(() => {});
    observer.observe(list, { childList: true });
    const handle = createClonedDragPreviewElement(source, null)!;
    try {
      const records = observer.takeRecords();
      observer.disconnect();
      // A single insertion, the wrapper. The clone itself never touches the list.
      expect(records.map((record) => record.addedNodes.length)).toEqual([1]);
      expect(records[0].addedNodes[0]).toBe(handle.element.parentElement);
    } finally {
      handle.destroy();
    }
  });

  it('resolves preview styles using source-size variables before preserving them', () => {
    const sheet = document.createElement('style');
    sheet.textContent =
      '.Card[data-drag-preview] { border-radius: calc(var(--drag-source-width) / 2); }';
    document.head.appendChild(sheet);
    source.className = 'Card';
    const handle = createClonedDragPreviewElement(source, null)!;
    try {
      expect(getComputedStyle(handle.element).borderTopLeftRadius).toBe('60px');
    } finally {
      handle.destroy();
      sheet.remove();
    }
  });

  it('preserves both generated pseudo-elements and nested direct-child declarations', () => {
    const sheet = document.createElement('style');
    sheet.textContent = `
      .List { & > .Card { --icon-color: rgb(1, 2, 3); color: rgb(4, 5, 6); }
        & > .Card::before { content: "Before"; color: var(--icon-color); }
        & > .Card::after { content: "After"; }
      }
    `;
    document.head.appendChild(sheet);
    list.className = 'List';
    source.className = 'Card';
    const beforeSheets = document.adoptedStyleSheets.length;
    const handle = createClonedDragPreviewElement(source, null)!;
    try {
      expect(getComputedStyle(handle.element).color).toBe('rgb(4, 5, 6)');
      expect(getComputedStyle(handle.element, '::before').content).toBe('"Before"');
      expect(getComputedStyle(handle.element, '::before').color).toBe('rgb(1, 2, 3)');
      expect(getComputedStyle(handle.element, '::after').content).toBe('"After"');
    } finally {
      handle.destroy();
      sheet.remove();
    }
    expect(document.adoptedStyleSheets.length).toBe(beforeSheets);
  });

  it('preserves contextual styling when stylesheet rules cannot be inspected', () => {
    const sheet = document.createElement('style');
    sheet.textContent = '.List > .Card { color: rgb(1, 2, 3); }';
    document.head.appendChild(sheet);
    list.className = 'List';
    source.className = 'Card';
    const rules = vi.spyOn(sheet.sheet!, 'cssRules', 'get').mockImplementation(() => {
      throw new DOMException('Stylesheet is cross-origin', 'SecurityError');
    });
    const handle = createClonedDragPreviewElement(source, null)!;
    try {
      expect(getComputedStyle(handle.element).color).toBe('rgb(1, 2, 3)');
    } finally {
      handle.destroy();
      rules.mockRestore();
      sheet.remove();
    }
  });

  it('preserves contextual styles from a cross-origin app stylesheet', () => {
    const sheet = document.createElement('style');
    sheet.textContent =
      '.Card { color: blue !important; } .List > .Card { color: rgb(1, 2, 3) !important; padding: 20px; } .Card[data-drag-preview] { border: 3px solid green; }';
    document.head.appendChild(sheet);
    list.className = 'List';
    source.className = 'Card';
    const href = vi
      .spyOn(sheet.sheet!, 'href', 'get')
      .mockReturnValue('https://cdn.example.com/app.css');
    const rules = vi.spyOn(sheet.sheet!, 'cssRules', 'get').mockImplementation(() => {
      throw new DOMException('Stylesheet is cross-origin', 'SecurityError');
    });
    const handle = createClonedDragPreviewElement(source, null)!;
    try {
      expect(getComputedStyle(handle.element).color).toBe('rgb(1, 2, 3)');
      expect(getComputedStyle(handle.element).padding).toBe('20px');
      expect(getComputedStyle(handle.element).borderTopWidth).toBe('3px');
    } finally {
      handle.destroy();
      rules.mockRestore();
      href.mockRestore();
      sheet.remove();
    }
  });

  it('keeps important contextual declarations above surviving important base rules', () => {
    const sheet = document.createElement('style');
    sheet.textContent = `
      .Card, .Child { color: rgb(0, 0, 255) !important; }
      .List > .Card { color: rgb(255, 0, 0) !important; }
      .List > .Card > .Child { color: rgb(0, 128, 0) !important; }
      .Card[data-drag-preview] { border: 3px solid rgb(0, 128, 0); }
    `;
    document.head.appendChild(sheet);
    list.className = 'List';
    source.className = 'Card';
    source.innerHTML = '<span class="Child">Card</span>';
    const handle = createClonedDragPreviewElement(source, null)!;
    try {
      expect(getComputedStyle(handle.element).color).toBe('rgb(255, 0, 0)');
      expect(getComputedStyle(handle.element.firstElementChild!).color).toBe('rgb(0, 128, 0)');
      expect(getComputedStyle(handle.element).borderTopWidth).toBe('3px');
    } finally {
      handle.destroy();
      sheet.remove();
    }
  });

  it('keeps an explicit important preview override of a contextual source property', () => {
    const sheet = document.createElement('style');
    sheet.textContent = `
      .List > .Card { color: rgb(255, 0, 0) !important; }
      .Card[data-drag-preview] { color: rgb(0, 0, 255) !important; }
    `;
    document.head.appendChild(sheet);
    list.className = 'List';
    source.className = 'Card';
    const handle = createClonedDragPreviewElement(source, null)!;
    try {
      expect(getComputedStyle(handle.element).color).toBe('rgb(0, 0, 255)');
    } finally {
      handle.destroy();
      sheet.remove();
    }
  });

  it('bounds subtree queries for unrelated styles and reads CSSOM changes on the next pickup', () => {
    const sheet = document.createElement('style');
    sheet.textContent = Array.from(
      { length: 512 },
      (_, index) => `.Other${index} > .Unrelated { color: red; }`,
    ).join('\n');
    document.head.appendChild(sheet);
    list.className = 'List';
    source.className = 'Card';
    const query = vi.spyOn(source, 'querySelectorAll');
    let handle = createClonedDragPreviewElement(source, null)!;
    try {
      // Includes cloning's descendant query. A rule-by-rule traversal needs 513.
      expect(query.mock.calls.length).toBeLessThan(150);
      handle.destroy();
      sheet.sheet!.insertRule('.Card { color: blue !important; }');
      sheet.sheet!.insertRule('.List > .Card { color: rgb(1, 2, 3) !important; }');
      sheet.sheet!.insertRule('.Card[data-drag-preview] { border: 3px solid green; }');
      handle = createClonedDragPreviewElement(source, null)!;
      expect(getComputedStyle(handle.element).color).toBe('rgb(1, 2, 3)');
      expect(getComputedStyle(handle.element).borderTopWidth).toBe('3px');
    } finally {
      handle.destroy();
      query.mockRestore();
      sheet.remove();
    }
  });

  it('neutralizes important source motion and allows an important ending transition', () => {
    const sheet = document.createElement('style');
    sheet.textContent = `.List .Card { transition: all 200ms !important; }
      .List .Card[data-ending-style] { transition: translate 100ms !important; }`;
    document.head.appendChild(sheet);
    list.className = 'List';
    source.className = 'Card';
    const handle = createClonedDragPreviewElement(source, null)!;
    try {
      expect(getComputedStyle(handle.element).transitionDuration).toBe('0s');
      handle.element.setAttribute('data-ending-style', '');
      handle.prepareForDrop?.();
      expect(getComputedStyle(handle.element).transitionProperty).toBe('translate');
      expect(getComputedStyle(handle.element).transitionDuration).toBe('0.1s');
    } finally {
      handle.destroy();
      sheet.remove();
    }
  });

  it('preserves generated content styled through a shadow host', () => {
    const host = document.createElement('div');
    const root = host.attachShadow({ mode: 'closed' });
    const sheet = document.createElement('style');
    sheet.textContent = ':host > .Card::before { content: "Icon"; }';
    root.append(sheet, source);
    list.append(host);
    source.className = 'Card';
    const handle = createClonedDragPreviewElement(source, null)!;
    try {
      expect(getComputedStyle(handle.element, '::before').content).toBe('"Icon"');
    } finally {
      handle.destroy();
    }
  });

  it('preserves styles applied to a slotted source', () => {
    const host = document.createElement('div');
    const root = host.attachShadow({ mode: 'open' });
    root.innerHTML = '<style>::slotted(.Card) { color: rgb(1, 2, 3); }</style><slot></slot>';
    host.append(source);
    list.append(host);
    source.className = 'Card';
    const handle = createClonedDragPreviewElement(source, null)!;
    try {
      expect(getComputedStyle(handle.element).color).toBe('rgb(1, 2, 3)');
    } finally {
      handle.destroy();
    }
  });

  it('does not measure every descendant when ordinary classes survive wrapping', () => {
    source.innerHTML = '<span class="Child">Item</span>'.repeat(100);
    const measure = vi.spyOn(window, 'getComputedStyle');
    const handle = createClonedDragPreviewElement(source, null)!;
    try {
      const descendants = new Set(handle.element.querySelectorAll('.Child'));
      expect(measure.mock.calls.filter(([node]) => descendants.has(node))).toHaveLength(0);
    } finally {
      handle.destroy();
      measure.mockRestore();
    }
  });

  it('promotes the preview to the top layer through an engine-owned wrapper', () => {
    const handle = createClonedDragPreviewElement(source, null)!;

    // The wrapper, not the preview, is the popover: the UA `[popover]` chrome
    // lands on an element with no consumer styling contract.
    const wrapper = handle.element.parentElement!;
    expect(wrapper.matches(':popover-open')).toBe(true);
    expect(wrapper.getAttribute('popover')).toBe('manual');
    expect(handle.element.hasAttribute('popover')).toBe(false);
    // Still in the source's own parent, which is what keeps the app's CSS on it.
    expect(wrapper.parentElement).toBe(list);

    handle.destroy();
  });

  it('positions against the viewport, not the transformed ancestor', () => {
    const handle = createClonedDragPreviewElement(source, null)!;
    handle.element.style.translate = '300px 400px';

    // The ancestor translates its content by 40px. A trapped preview would land at
    // 440; the top layer's containing block is the viewport, so it lands at 400.
    const rect = handle.element.getBoundingClientRect();
    expect(Math.round(rect.left)).toBe(300);
    expect(Math.round(rect.top)).toBe(400);

    handle.destroy();
  });

  it('is not clipped by the scroll container it was injected into', () => {
    const handle = createClonedDragPreviewElement(source, null)!;
    // Outside the 200x100 clipping ancestor, but still inside the viewport.
    handle.element.style.translate = '260px 200px';

    // A clipped element still reports a box, so hit-test it: only a painted element
    // answers `elementFromPoint`. The preview is inert and `pointer-events: none` in
    // production precisely so it *can't* be hit — lift both to probe it here.
    handle.element.style.pointerEvents = 'auto';
    handle.element.removeAttribute('inert');

    const rect = handle.element.getBoundingClientRect();
    const hit = document.elementFromPoint(
      Math.round(rect.left + rect.width / 2),
      Math.round(rect.top + rect.height / 2),
    );
    expect(handle.element.contains(hit)).toBe(true);

    handle.destroy();
  });

  it('re-opens in the top layer after being re-homed mid-drag', () => {
    const handle = createClonedDragPreviewElement(source, null)!;
    const wrapper = handle.element.parentElement!;
    expect(wrapper.matches(':popover-open')).toBe(true);

    // A virtualizer recycles the row: any DOM move closes an open popover, and the
    // UA `[popover]:not(:popover-open)` rule would leave it `display: none`.
    list.remove();
    handle.ensureConnected();

    expect(handle.element.isConnected).toBe(true);
    expect(wrapper.matches(':popover-open')).toBe(true);
    expect(getComputedStyle(wrapper).display).not.toBe('none');

    handle.destroy();
  });

  it('reopens the preview and restores scrolling after its connected ancestor moves', async () => {
    source.style.overflow = 'auto';
    const content = document.createElement('div');
    content.style.height = '200px';
    source.replaceChildren(content);
    source.scrollTop = 40;
    const sibling = document.createElement('div');
    scroller.appendChild(sibling);
    const handle = createClonedDragPreviewElement(source, null)!;

    try {
      const wrapper = handle.element.parentElement!;
      expect(wrapper.matches(':popover-open')).toBe(true);
      expect(handle.element.scrollTop).toBe(40);

      scroller.appendChild(list);
      // Let the mutation observer repair the preview without a pointer move.
      await Promise.resolve();

      expect(wrapper.parentElement).toBe(list);
      expect(wrapper.matches(':popover-open')).toBe(true);
      expect(handle.element.getBoundingClientRect().height).toBe(30);
      expect(handle.element.scrollTop).toBe(40);
    } finally {
      handle.destroy();
    }
  });

  it('keeps the source geometry rather than shrinking to fit', () => {
    const handle = createClonedDragPreviewElement(source, null)!;

    // Out of flow, the clone would otherwise collapse to its content width.
    expect(Math.round(handle.element.getBoundingClientRect().width)).toBe(120);
    expect(Math.round(handle.element.getBoundingClientRect().height)).toBe(30);

    handle.destroy();
  });

  it('sizes the clone from the untransformed box of a transformed source', () => {
    // `getBoundingClientRect` includes the source's own transform (240×60 here),
    // but the clone renders untransformed — the engine overwrites `transform` to
    // position it — so it must be sized from `offsetWidth`/`offsetHeight`.
    source.style.transform = 'scale(2)';

    const handle = createClonedDragPreviewElement(source, null)!;

    expect(handle.element.style.width).toBe('120px');
    expect(handle.element.style.height).toBe('30px');
    expect(Math.round(handle.element.getBoundingClientRect().width)).toBe(120);
    expect(Math.round(handle.element.getBoundingClientRect().height)).toBe(30);

    handle.destroy();
  });

  it('anchors a scaled clone from a custom transform origin', () => {
    const baseline = source.getBoundingClientRect();
    source.style.transformOrigin = '0 0';
    source.style.scale = '2';

    const handle = createClonedDragPreviewElement(source, null)!;

    expect(handle.sourceRect.left).toBeCloseTo(baseline.left);
    expect(handle.sourceRect.top).toBeCloseTo(baseline.top);
    expect(handle.sourceRect.width).toBe(120);
    expect(handle.sourceRect.height).toBe(30);

    handle.destroy();
  });

  it('anchors a rotated clone from a custom transform origin', () => {
    const baseline = source.getBoundingClientRect();
    source.style.transformOrigin = '0 0';
    source.style.rotate = '90deg';

    const handle = createClonedDragPreviewElement(source, null)!;

    expect(handle.sourceRect.left).toBeCloseTo(baseline.left);
    expect(handle.sourceRect.top).toBeCloseTo(baseline.top);
    expect(handle.sourceRect.width).toBe(120);
    expect(handle.sourceRect.height).toBe(30);

    handle.destroy();
  });

  it('sizes the clone from the untransformed box for the individual scale property', () => {
    // CSS Transforms 2 keeps `scale`/`rotate`/`translate` out of the computed
    // `transform`, so a source using the hover-lift `scale: 1.5` reads as
    // untransformed unless all four are checked.
    source.style.scale = '1.5';

    const handle = createClonedDragPreviewElement(source, null)!;

    // `scale` is not neutralized (unlike `translate` it composes around the box's
    // centre without displacing the anchor), so the clone re-applies it and looks
    // exactly like the element that was grabbed. That only works because the box
    // it applies to is the *untransformed* one — sizing from the transformed AABB
    // would compound the scale to 2.25x.
    expect(handle.element.style.width).toBe('120px');
    expect(handle.element.style.height).toBe('30px');
    expect(getComputedStyle(handle.element).scale).toBe('1.5');
    expect(Math.round(handle.element.getBoundingClientRect().width)).toBe(180);
    expect(Math.round(handle.element.getBoundingClientRect().height)).toBe(45);

    handle.destroy();
  });

  it('preserves cloned dimensions under CSS zoom', () => {
    list.style.zoom = '0.5';
    source.style.scale = '1.2';
    const handle = createClonedDragPreviewElement(source, null)!;
    try {
      const sourceRect = source.getBoundingClientRect();
      const cloneRect = handle.element.getBoundingClientRect();
      expect(cloneRect.width).toBeCloseTo(sourceRect.width);
      expect(cloneRect.height).toBeCloseTo(sourceRect.height);
    } finally {
      handle.destroy();
    }
  });

  it.each(['scale(0.5)', 'scale(2, 0.5)'])(
    'preserves descendant layout under ancestor %s',
    (transform) => {
      list.style.transform = transform;
      source.innerHTML = '<span style="display:block;width:20px;height:10px">Text</span>';
      const sourceChild = source.firstElementChild!.getBoundingClientRect();
      const handle = createClonedDragPreviewElement(source, null)!;
      try {
        const cloneChild = handle.element.firstElementChild!.getBoundingClientRect();
        expect(cloneChild.width).toBeCloseTo(sourceChild.width);
        expect(cloneChild.height).toBeCloseTo(sourceChild.height);
        expect(handle.element.style.width).toBe('120px');
      } finally {
        handle.destroy();
      }
    },
  );

  it.each(['0.5', '2'])('sizes a custom preview in CSS units under zoom %s', (zoom) => {
    list.style.zoom = zoom;
    const handle = createDragPreviewHostElement(source, null)!;
    try {
      handle.element.style.width = 'var(--drag-source-width)';
      handle.element.style.height = 'var(--drag-source-height)';
      const sourceRect = source.getBoundingClientRect();
      const previewRect = handle.element.getBoundingClientRect();
      expect(previewRect.width).toBeCloseTo(sourceRect.width);
      expect(previewRect.height).toBeCloseTo(sourceRect.height);
    } finally {
      handle.destroy();
    }
  });

  it('drops the source transition and animation so the preview tracks the pointer', () => {
    // Every frame writes `transform`; a source transition would ease each of
    // those writes and the preview would trail the pointer for the whole drag.
    source.style.transition = 'transform 200ms ease';
    source.style.animation = 'spin 1s linear infinite';

    const handle = createClonedDragPreviewElement(source, null)!;

    // Assert the effect, not the serialization: the `animation` shorthand reads
    // back as its longhands.
    const computed = getComputedStyle(handle.element);
    expect(computed.transitionDuration).toBe('0s');
    expect(computed.animationName).toBe('none');

    handle.destroy();
  });

  it('lets a consumer rule keyed on the preview attribute override the neutralizer', () => {
    // The documented styling hook: `.Card[data-drag-preview] { rotate: 3deg }`.
    // The engine neutralizes `transition` from its adopted sheet rather than
    // inline precisely so this wins without `!important` — an inline declaration
    // would beat any author rule at any specificity. `rotate` is never touched.
    const sheet = document.createElement('style');
    sheet.textContent = '.Card[data-drag-preview]{rotate:3deg;transition:box-shadow 300ms ease;}';
    document.head.appendChild(sheet);
    source.classList.add('Card');

    const handle = createClonedDragPreviewElement(source, null)!;

    const computed = getComputedStyle(handle.element);
    expect(computed.rotate).toBe('3deg');
    expect(computed.transitionDuration).toBe('0.3s');

    handle.destroy();
    sheet.remove();
  });

  it('keeps ids unique and supports class-based preview styles instead of id selectors', () => {
    const sheet = document.createElement('style');
    sheet.textContent = `
      #drag-card { color: rgb(123, 45, 67); }
      .Card[data-drag-preview] { opacity: 0.5; }
    `;
    document.head.appendChild(sheet);
    source.id = 'drag-card';
    source.classList.add('Card');
    expect(getComputedStyle(source).color).toBe('rgb(123, 45, 67)');

    const handle = createClonedDragPreviewElement(source, null)!;
    const computed = getComputedStyle(handle.element);

    expect(handle.element.id).toBe('drag-card-drag-preview');
    expect(computed.color).not.toBe('rgb(123, 45, 67)');
    expect(computed.opacity).toBe('0.5');

    handle.destroy();
    sheet.remove();
  });

  it('lets cascade-layered consumer styles (Tailwind-style) style the preview', () => {
    // Tailwind v4 puts every utility in `@layer utilities`, and unlayered author
    // styles beat layered ones at any specificity. The engine must not ship any
    // unlayered rule that competes with the preview's visual styling: the UA
    // popover chrome is neutralized inline on the engine-owned wrapper instead.
    const sheet = document.createElement('style');
    sheet.textContent =
      '@layer utilities { .Card { border: 2px solid rgb(1, 2, 3); } ' +
      '.Card[data-drag-preview] { rotate: 4deg; } }';
    document.head.appendChild(sheet);
    source.classList.add('Card');

    const handle = createClonedDragPreviewElement(source, null)!;

    const computed = getComputedStyle(handle.element);
    expect(computed.borderTopWidth).toBe('2px');
    expect(computed.borderTopColor).toBe('rgb(1, 2, 3)');
    expect(computed.rotate).toBe('4deg');

    handle.destroy();
    sheet.remove();
  });

  it('copies the canvas backing store, which cloneNode leaves blank', () => {
    const canvas = document.createElement('canvas');
    canvas.width = 8;
    canvas.height = 8;
    const context = canvas.getContext('2d')!;
    context.fillStyle = 'rgb(255, 0, 0)';
    context.fillRect(0, 0, 8, 8);
    source.appendChild(canvas);

    const handle = createClonedDragPreviewElement(source, null)!;

    // `cloneNode` copies the element, not its bitmap — a chart or signature pad
    // would otherwise drag as a blank rectangle.
    const pixel = handle.element
      .querySelector('canvas')!
      .getContext('2d')!
      .getImageData(4, 4, 1, 1).data;
    expect(Array.from(pixel)).toEqual([255, 0, 0, 255]);

    handle.destroy();
  });

  it("restores a scrolled descendant's scroll offset, which cloneNode drops", () => {
    const scrollable = document.createElement('div');
    scrollable.style.cssText = 'height: 20px; overflow: auto;';
    const content = document.createElement('div');
    content.style.height = '300px';
    scrollable.appendChild(content);
    source.appendChild(scrollable);
    scrollable.scrollTop = 120;

    // Scroll offsets are no-ops on a detached node, so they can only be applied
    // once the clone is inserted — and shown: writing to a `display: none`
    // subtree clamps to 0, which is why the top-layer promotion comes first.
    const handle = createClonedDragPreviewElement(source, null)!;
    const cloneScrollable = handle.element.querySelector('div')!;
    expect(cloneScrollable.scrollTop).toBe(120);

    // A mid-drag re-home closes the popover before the offsets are re-applied;
    // the reopen must come first or the write clamps to 0 in `display: none`.
    list.remove();
    handle.ensureConnected();
    expect(handle.element.querySelector('div')!.scrollTop).toBe(120);

    handle.destroy();
  });

  it('re-adopts the neutralizer sheet after the document replaces its adopted sheets', () => {
    source.style.transition = 'transform 200ms ease';
    const first = createClonedDragPreviewElement(source, null)!;
    const sheet = findNeutralizerSheet(document);
    expect(sheet).toBeDefined();
    first.destroy();

    // A theme switch that assigns a fresh `adoptedStyleSheets` array drops the
    // engine's sheet along with everything else. The next preview must notice and
    // adopt it again, or it would carry the source's transition.
    document.adoptedStyleSheets = [];

    const second = createClonedDragPreviewElement(source, null)!;
    expect(document.adoptedStyleSheets.filter((adopted) => adopted === sheet)).toHaveLength(1);
    expect(getComputedStyle(second.element).transitionDuration).toBe('0s');
    second.destroy();
  });

  describe('lifted through the pointer sensor', () => {
    const { renderDnd } = createDndRenderer();

    /**
     * Press, cross the mouse activation distance, then settle back on the press
     * point — the shape of a real pickup — and return the clone's box on the frame
     * the drag committed, next to the source's own box as it was at the press.
     */
    async function liftAndMeasure(): Promise<{ sourceRect: DOMRect; cloneRect: DOMRect }> {
      const { engine } = await renderDnd();
      engine.registerDraggable(source, {});

      const sourceRect = source.getBoundingClientRect();
      const pressX = sourceRect.left + 8;
      const pressY = sourceRect.top + 6;
      dispatchMouse('pointerdown', source, pressX, pressY);
      dispatchMouse('pointermove', source, pressX + 20, pressY);
      dispatchMouse('pointermove', source, pressX, pressY);
      await flushRaf();

      const clone = document.querySelector<HTMLElement>(`[${DRAG_PREVIEW_ATTR}]`);
      expect(clone).not.toBeNull();
      const cloneRect = clone!.getBoundingClientRect();
      dispatchMouse('pointerup', source, pressX, pressY);
      return { sourceRect, cloneRect };
    }

    function expectSameBox(actual: DOMRect, expected: DOMRect): void {
      expect(Math.abs(actual.left - expected.left)).toBeLessThanOrEqual(0.5);
      expect(Math.abs(actual.top - expected.top)).toBeLessThanOrEqual(0.5);
      expect(Math.abs(actual.width - expected.width)).toBeLessThanOrEqual(0.5);
      expect(Math.abs(actual.height - expected.height)).toBeLessThanOrEqual(0.5);
    }

    it.each(['0.5', '2'])('preserves the pickup position under CSS zoom %s', async (zoom) => {
      list.style.zoom = zoom;
      const { sourceRect, cloneRect } = await liftAndMeasure();
      expectSameBox(cloneRect, sourceRect);
    });

    it('lifts a scaled source off exactly where it sits', async () => {
      // The grab offset the lifecycle measures is relative to the *transformed*
      // rect, but the clone is anchored on the untransformed box it re-applies
      // `scale` to. Anchoring the default `'source'` offset on that same box is
      // what keeps the clone from jumping at pickup.
      source.style.scale = '1.2';

      const { sourceRect, cloneRect } = await liftAndMeasure();

      expectSameBox(cloneRect, sourceRect);
    });

    it('lifts a rotated source off exactly where it sits', async () => {
      source.style.transformOrigin = '0 0';
      source.style.rotate = '90deg';

      const { sourceRect, cloneRect } = await liftAndMeasure();

      expectSameBox(cloneRect, sourceRect);
    });

    it.each(['0 0', '50% 50%', '20px 10px'])(
      'preserves a scaled source on a zoomed canvas with transform origin %s',
      async (origin) => {
        list.style.transform = 'translateY(40px) scale(0.5)';
        source.style.scale = '1.2';
        source.style.transformOrigin = origin;

        const { sourceRect, cloneRect } = await liftAndMeasure();

        expectSameBox(cloneRect, sourceRect);
      },
    );

    it.each(['scale(0.5)', 'scale(2, 0.5)'])(
      'preserves a rotated source under %s',
      async (scale) => {
        list.style.transform = `translateY(40px) ${scale}`;
        source.style.rotate = '30deg';
        source.style.transformOrigin = '20px 10px';

        const { sourceRect, cloneRect } = await liftAndMeasure();

        expectSameBox(cloneRect, sourceRect);
      },
    );
  });

  it('confines the popover UA chrome to the wrapper, away from the preview', () => {
    const handle = createClonedDragPreviewElement(source, null)!;

    // The `[popover]` UA rule gives the open popover `margin: auto` (measured in
    // the hundreds of pixels), a solid border, and an opaque `Canvas` background.
    // All of it lands on the engine-owned wrapper, where the inline reset
    // neutralizes it without touching the preview's own cascade.
    const wrapper = getComputedStyle(handle.element.parentElement!);
    expect(wrapper.marginTop).toBe('0px');
    expect(wrapper.borderTopWidth).toBe('0px');
    expect(wrapper.backgroundColor).toBe('rgba(0, 0, 0, 0)');

    // The preview never carries the chrome and keeps looking like the element it
    // was lifted from.
    const styles = getComputedStyle(handle.element);
    expect(styles.marginTop).toBe('0px');
    expect(styles.borderTopWidth).toBe('0px');
    expect(styles.backgroundColor).toBe('rgb(0, 128, 0)');

    handle.destroy();
  });
});
