import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act } from '@mui/internal-test-utils';
import { isJSDOM } from '#test-utils';
import { createDndRenderer } from '../../../../test/dndEngine';
import { flushRaf, setupDragEngineTests } from '../../../../test/dnd';
import * as DraggablePreviewDataAttributes from '../../../draggable/preview/DraggablePreviewDataAttributes';
import { createDragPreviewElement, measurePreviewAnchor } from './cloneDragPreview';
import { PREVIEW_ELEMENT_ATTRIBUTE } from '../utils';
import type { DraggableRootModifier } from '../../../draggable/root/DraggableRoot';

/** Measure and clone `source`, the way a pickup does. */
function clonePreview(source: HTMLElement, container: HTMLElement | null) {
  const anchor = measurePreviewAnchor(source, container);
  return anchor && createDragPreviewElement(source, anchor);
}

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
    Array.from(sheet.cssRules).some((rule) =>
      rule.cssText.includes(`[${PREVIEW_ELEMENT_ATTRIBUTE}=`),
    ),
  );
}

/**
 * The top layer lets a preview inserted deep inside a transformed, clipping
 * ancestor still position against the viewport and paint above everything. jsdom
 * has no `showPopover`, so these tests run in a real browser.
 */
describe.skipIf(isJSDOM)('createDragPreviewElement (top layer)', () => {
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
    const handle = clonePreview(source, null)!;
    try {
      expect(getComputedStyle(handle.element).transitionDuration).toBe('0s');
      expect(getComputedStyle(handle.element).transform).toBe('none');
      handle.element.setAttribute('data-ending-style', '');
      handle.prepareForDrop();
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
    const handle = clonePreview(source, null)!;
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
    const handle = clonePreview(source, null)!;
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

  it('restores sibling-position styles the end position changes', () => {
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
    // The source is the second and last row, so it is even and `:last-child`. The
    // clone is appended after it as the third row, which is odd, so the
    // `:nth-child(even)` rule stops matching it.
    const first = document.createElement('div');
    first.className = 'Row';
    first.textContent = 'Row 1';
    list.insertBefore(first, source);
    const handle = clonePreview(source, null)!;
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
    const handle = clonePreview(source, null)!;
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
    const handle = clonePreview(source, null)!;
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
    const handle = clonePreview(source, null)!;
    try {
      const records = observer.takeRecords();
      observer.disconnect();
      // A single insertion, the finished preview. Nothing is inserted next to the
      // source while it is built.
      expect(records.map((record) => record.addedNodes.length)).toEqual([1]);
      expect(records[0].addedNodes[0]).toBe(handle.element);
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
    const handle = clonePreview(source, null)!;
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
    const handle = clonePreview(source, null)!;
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

  it('preserves contextual styles from a cross-origin app stylesheet', () => {
    const sheet = document.createElement('style');
    sheet.textContent =
      '.Card { color: blue !important; } .List > .Card { color: rgb(1, 2, 3) !important; padding: 20px; } .List > .Card > .Child { color: rgb(4, 5, 6); } .Card[data-drag-preview] { border: 3px solid green; }';
    document.head.appendChild(sheet);
    list.className = 'List';
    source.className = 'Card';
    source.innerHTML = '<span class="Child">Card</span>';
    const href = vi
      .spyOn(sheet.sheet!, 'href', 'get')
      .mockReturnValue('https://cdn.example.com/app.css');
    const rules = vi.spyOn(sheet.sheet!, 'cssRules', 'get').mockImplementation(() => {
      throw new DOMException('Stylesheet is cross-origin', 'SecurityError');
    });
    const handle = clonePreview(source, null)!;
    try {
      expect(getComputedStyle(handle.element).color).toBe('rgb(1, 2, 3)');
      expect(getComputedStyle(handle.element).padding).toBe('20px');
      // The snapshot covers descendants, not only the root.
      expect(getComputedStyle(handle.element.firstElementChild!).color).toBe('rgb(4, 5, 6)');
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
    const handle = clonePreview(source, null)!;
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
    const handle = clonePreview(source, null)!;
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
      { length: 8192 },
      (_, index) => `.Other${index} > .Unrelated { color: red; }`,
    ).join('\n');
    document.head.appendChild(sheet);
    list.className = 'List';
    source.className = 'Card';
    const query = vi.spyOn(source, 'querySelectorAll');
    let handle = clonePreview(source, null)!;
    try {
      // Includes cloning's descendant query. A rule-by-rule traversal needs 8193.
      expect(query.mock.calls.length).toBeLessThan(150);
      handle.destroy();
      sheet.sheet!.insertRule('.Card { color: blue !important; }');
      sheet.sheet!.insertRule('.List > .Card { color: rgb(1, 2, 3) !important; }');
      sheet.sheet!.insertRule('.Card[data-drag-preview] { border: 3px solid green; }');
      handle = clonePreview(source, null)!;
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
    const handle = clonePreview(source, null)!;
    try {
      expect(getComputedStyle(handle.element).transitionDuration).toBe('0s');
      handle.element.setAttribute('data-ending-style', '');
      handle.prepareForDrop();
      expect(getComputedStyle(handle.element).transitionProperty).toBe('translate');
      expect(getComputedStyle(handle.element).transitionDuration).toBe('0.1s');
    } finally {
      handle.destroy();
      sheet.remove();
    }
  });

  it('lets a cascade-layered ending transition animate the drop', () => {
    // Tailwind v4 puts `transition` and `data-ending-style:transition-[translate]`
    // in `@layer utilities`, which loses to any unlayered rule.
    const sheet = document.createElement('style');
    sheet.textContent = `@layer utilities {
      .Card { transition: background-color 150ms; }
      .Card[data-drag-preview][data-ending-style] { transition: translate 200ms; }
    }`;
    document.head.appendChild(sheet);
    source.className = 'Card';
    const handle = clonePreview(source, null)!;
    try {
      expect(getComputedStyle(handle.element).transitionDuration).toBe('0s');
      handle.element.setAttribute('data-ending-style', '');
      handle.prepareForDrop();
      expect(getComputedStyle(handle.element).transitionProperty).toBe('translate');
      expect(getComputedStyle(handle.element).transitionDuration).toBe('0.2s');
    } finally {
      handle.destroy();
      sheet.remove();
    }
  });

  it('does not revive the source motion when the drop has no ending rule', () => {
    const sheet = document.createElement('style');
    sheet.textContent = `.Card { transition: all 200ms; animation: preview-pulse 1s; }
      @keyframes preview-pulse { from { opacity: 0.5; } }`;
    document.head.appendChild(sheet);
    source.className = 'Card';
    const handle = clonePreview(source, null)!;
    try {
      handle.element.setAttribute('data-ending-style', '');
      handle.prepareForDrop();
      const computed = getComputedStyle(handle.element);
      expect(computed.transitionDuration).toBe('0s');
      expect(computed.animationName).toBe('none');
      expect(computed.transform).toBe('none');
    } finally {
      handle.destroy();
      sheet.remove();
    }
  });

  it('keeps the rule scan for a small source in a mid-sized app stylesheet', () => {
    const sheet = document.createElement('style');
    sheet.textContent = Array.from(
      { length: 2000 },
      (_, index) => `.Other${index} > .Unrelated { color: red; }`,
    ).join('\n');
    document.head.appendChild(sheet);
    source.innerHTML = '<span class="Child">Item</span>'.repeat(5);
    const measure = vi.spyOn(window, 'getComputedStyle');
    const handle = clonePreview(source, null)!;
    try {
      // The full snapshot reads every descendant. The scan reads none of these,
      // since no structural rule matches them.
      const descendants = new Set(source.querySelectorAll('.Child'));
      expect(measure.mock.calls.filter(([node]) => descendants.has(node))).toHaveLength(0);
    } finally {
      handle.destroy();
      measure.mockRestore();
      sheet.remove();
    }
  });

  it('keeps engine-owned values off descendants in the full computed-style snapshot', () => {
    const sheet = document.createElement('style');
    sheet.textContent = `.List { --token: 4px; }
      .List > .Card > .Child { --accent: rgb(1, 2, 3); color: var(--accent); }`;
    document.head.appendChild(sheet);
    list.className = 'List';
    source.className = 'Card';
    source.innerHTML = '<span class="Child">Item</span>';
    const rules = vi.spyOn(sheet.sheet!, 'cssRules', 'get').mockImplementation(() => {
      throw new DOMException('Stylesheet is cross-origin', 'SecurityError');
    });
    const handle = clonePreview(source, null)!;
    try {
      const child = handle.element.firstElementChild as HTMLElement;
      const computed = getComputedStyle(child);
      // The clone root's `pointer-events: none` must reach every descendant.
      expect(child.style.pointerEvents).toBe('');
      expect(computed.pointerEvents).toBe('none');
      expect(child.style.getPropertyValue('interactivity')).toBe('');
      // A token the child only inherits needs no copy. One its own lost rule
      // declared is restored.
      expect(child.style.getPropertyValue('--token')).toBe('');
      expect(computed.getPropertyValue('--token')).toBe('4px');
      expect(computed.getPropertyValue('--accent')).toBe('rgb(1, 2, 3)');
      expect(computed.color).toBe('rgb(1, 2, 3)');
    } finally {
      handle.destroy();
      rules.mockRestore();
      sheet.remove();
    }
  });

  it('shows restored descendant styles without transitioning them in', () => {
    const sheet = document.createElement('style');
    sheet.textContent = `.Child { color: rgb(0, 0, 0); transition: color 10s linear; }
      .List > .Card > .Child { color: rgb(255, 0, 0); }`;
    document.head.appendChild(sheet);
    list.className = 'List';
    source.className = 'Card';
    source.innerHTML = '<span class="Child">Item</span>';
    const handle = clonePreview(source, null)!;
    try {
      const child = handle.element.firstElementChild!;
      expect(getComputedStyle(child).color).toBe('rgb(255, 0, 0)');
      expect(child.getAnimations()).toHaveLength(0);
    } finally {
      handle.destroy();
      sheet.remove();
    }
  });

  it('keeps consumer sibling and popover rules off the preview', () => {
    const sheet = document.createElement('style');
    sheet.textContent = `.List > * { animation: preview-fade-in 1s; }
      [popover] { opacity: 0; filter: blur(4px); transition: opacity 1s; translate: 10px 10px; }
      @keyframes preview-fade-in { from { opacity: 0; } }`;
    document.head.appendChild(sheet);
    list.className = 'List';
    const handle = clonePreview(source, null)!;
    try {
      // The preview is the popover now, so the app's `[popover]` rule reaches it. The
      // values it changed are restored, and the sibling rule's entrance animation is
      // neutralized like any source motion.
      const computed = getComputedStyle(handle.element);
      expect(computed.opacity).toBe('1');
      expect(computed.filter).toBe('none');
      expect(computed.animationName).toBe('none');
      expect(computed.transitionDuration).toBe('0s');
      expect(handle.element).toHaveAttribute('aria-hidden', 'true');
      handle.element.style.translate = '300px 400px';
      const rect = handle.element.getBoundingClientRect();
      expect(Math.round(rect.left)).toBe(300);
      expect(Math.round(rect.top)).toBe(400);
    } finally {
      handle.destroy();
      sheet.remove();
    }
  });

  it('keeps the preview on the pointer in a right-to-left page when the source sets `right`', () => {
    const sheet = document.createElement('style');
    sheet.textContent = '.Card { position: relative; right: 10px; }';
    document.head.appendChild(sheet);
    // A fixed box resolves an over-constrained inset against the viewport's
    // direction, which is the root element's.
    document.documentElement.dir = 'rtl';
    source.className = 'Card';
    const handle = clonePreview(source, null)!;
    try {
      handle.element.style.translate = '50px 60px';
      const rect = handle.element.getBoundingClientRect();
      expect(rect.left).toBeCloseTo(50);
      expect(rect.top).toBeCloseTo(60);
    } finally {
      handle.destroy();
      sheet.remove();
      document.documentElement.removeAttribute('dir');
    }
  });

  it.each(['collapse', 'separate'])(
    'keeps the column widths of a dragged table row (border-collapse: %s)',
    (borderCollapse) => {
      const table = document.createElement('table');
      table.style.cssText = `width: 400px; border-collapse: ${borderCollapse}; border-spacing: 0;`;
      table.innerHTML =
        '<tbody><tr><td>Long first column</td><td>b</td><td>c</td></tr>' +
        '<tr><td>x</td><td>A much longer second cell</td><td>z</td></tr></tbody>';
      document.body.appendChild(table);
      const row = table.querySelector('tr')!;
      const rowRect = row.getBoundingClientRect();
      const sourceCells = Array.from(row.children, (cell) => cell.getBoundingClientRect());
      const handle = clonePreview(row, null)!;
      try {
        // The preview is a `<tr>` in the same `<tbody>`, so the document stays valid.
        expect(handle.element.localName).toBe('tr');
        expect(handle.element.parentElement).toBe(row.parentElement);
        handle.element.style.translate = `${rowRect.left}px ${rowRect.top}px`;
        const cloneCells = Array.from(handle.element.children, (cell) =>
          cell.getBoundingClientRect(),
        );
        cloneCells.forEach((cell, index) => {
          expect(cell.left).toBeCloseTo(sourceCells[index].left, 0);
          expect(cell.width).toBeCloseTo(sourceCells[index].width, 0);
        });
      } finally {
        handle.destroy();
        table.remove();
      }
    },
  );

  it('sizes a transformed source from its subpixel border box', () => {
    source.style.width = '120.5px';
    source.style.height = '30.25px';
    source.style.scale = '1.5';
    const handle = clonePreview(source, null)!;
    try {
      // `offsetWidth`/`offsetHeight` would round these to 121 and 30.
      expect(handle.anchor.sourceRect.width).toBeCloseTo(120.5, 2);
      expect(handle.anchor.sourceRect.height).toBeCloseTo(30.25, 2);
    } finally {
      handle.destroy();
    }
  });

  it('restores a scrolled descendant inside a smooth-scrolling container', () => {
    const scrollable = document.createElement('div');
    scrollable.style.cssText = 'height: 20px; overflow: auto;';
    scrollable.innerHTML = '<div style="height: 300px"></div>';
    source.appendChild(scrollable);
    scrollable.scrollTop = 120;
    // Set after scrolling the source, so the setup itself is instant.
    scrollable.style.scrollBehavior = 'smooth';
    const handle = clonePreview(source, null)!;
    try {
      expect(handle.element.querySelector('div')!.scrollTop).toBe(120);
    } finally {
      handle.destroy();
    }
  });

  it('keeps a cloned named <details> open', () => {
    source.innerHTML = '<details name="faq" open><summary>Question</summary>Answer</details>';
    const handle = clonePreview(source, null)!;
    try {
      // Inserting an open `<details>` into an exclusive group whose other member
      // is open would close it.
      expect(handle.element.querySelector('details')!.open).toBe(true);
      expect(source.querySelector('details')!.open).toBe(true);
    } finally {
      handle.destroy();
    }
  });

  it('renders the preview of a source assigned to a named slot', () => {
    const host = document.createElement('div');
    const root = host.attachShadow({ mode: 'open' });
    root.innerHTML = '<slot name="item"></slot>';
    source.slot = 'item';
    host.append(source);
    list.append(host);
    const handle = clonePreview(source, null)!;
    try {
      expect(handle.element.assignedSlot).toBe(root.querySelector('slot'));
      expect(handle.element.getClientRects().length).toBeGreaterThan(0);
    } finally {
      handle.destroy();
    }
  });

  it('rewrites url() references in inline styles through the CSSOM', () => {
    // A strict CSP without 'unsafe-inline' blocks `setAttribute('style', …)`.
    source.innerHTML =
      '<svg><defs><filter id="preview-blur"></filter></defs><rect style="filter: url(#preview-blur)"></rect></svg>';
    const setAttribute = vi.spyOn(Element.prototype, 'setAttribute');
    const handle = clonePreview(source, null)!;
    try {
      expect(setAttribute.mock.calls.filter(([name]) => name === 'style')).toHaveLength(0);
      const rect = handle.element.querySelector('rect')!;
      expect(rect.style.filter).toContain('#preview-blur-drag-preview');
    } finally {
      setAttribute.mockRestore();
      handle.destroy();
    }
  });

  it('re-homes without throwing when a polyfill leaves :popover-open unsupported', () => {
    const handle = clonePreview(source, null)!;
    const originalMatches = Element.prototype.matches;
    const matches = vi
      .spyOn(Element.prototype, 'matches')
      .mockImplementation(function matchesWithoutPopoverOpen(this: Element, selector: string) {
        if (selector.includes(':popover-open')) {
          throw new DOMException(`'${selector}' is not a valid selector.`, 'SyntaxError');
        }
        return originalMatches.call(this, selector);
      });
    try {
      expect(() => handle.ensureConnected()).not.toThrow();
    } finally {
      matches.mockRestore();
      handle.destroy();
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
    const handle = clonePreview(source, null)!;
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
    const handle = clonePreview(source, null)!;
    try {
      expect(getComputedStyle(handle.element).color).toBe('rgb(1, 2, 3)');
    } finally {
      handle.destroy();
    }
  });

  it('does not measure every descendant when ordinary classes survive wrapping', () => {
    source.innerHTML = '<span class="Child">Item</span>'.repeat(100);
    const measure = vi.spyOn(window, 'getComputedStyle');
    const handle = clonePreview(source, null)!;
    try {
      const descendants = new Set(handle.element.querySelectorAll('.Child'));
      expect(measure.mock.calls.filter(([node]) => descendants.has(node))).toHaveLength(0);
    } finally {
      handle.destroy();
      measure.mockRestore();
    }
  });

  it('promotes the preview itself to the top layer, with no wrapper', () => {
    const handle = clonePreview(source, null)!;

    expect(handle.element.matches(':popover-open')).toBe(true);
    expect(handle.element.getAttribute('popover')).toBe('manual');
    // Still in the source's own parent, which is what keeps the app's CSS on it.
    expect(handle.element.parentElement).toBe(list);

    handle.destroy();
  });

  it('positions against the viewport, not the transformed ancestor', () => {
    const handle = clonePreview(source, null)!;
    handle.element.style.translate = '300px 400px';

    // The ancestor translates its content by 40px. A trapped preview would land at
    // 440. The top layer's containing block is the viewport, so it lands at 400.
    const rect = handle.element.getBoundingClientRect();
    expect(Math.round(rect.left)).toBe(300);
    expect(Math.round(rect.top)).toBe(400);

    handle.destroy();
  });

  it('is not clipped by the scroll container it was injected into', () => {
    const handle = clonePreview(source, null)!;
    // Outside the 200x100 clipping ancestor, but still inside the viewport.
    handle.element.style.translate = '260px 200px';

    // A clipped element still reports a box, so hit-test instead. The preview is
    // normally inert and `pointer-events: none`, so lift both to probe it.
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
    const handle = clonePreview(source, null)!;
    expect(handle.element.matches(':popover-open')).toBe(true);

    // A virtualizer recycles the row. Any DOM move closes an open popover, and the
    // UA `[popover]:not(:popover-open)` rule would leave it `display: none`.
    list.remove();
    handle.ensureConnected();

    expect(handle.element.isConnected).toBe(true);
    expect(handle.element.matches(':popover-open')).toBe(true);
    expect(getComputedStyle(handle.element).display).not.toBe('none');

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
    const handle = clonePreview(source, null)!;

    try {
      expect(handle.element.matches(':popover-open')).toBe(true);
      expect(handle.element.scrollTop).toBe(40);

      scroller.appendChild(list);
      // Let the mutation observer repair the preview without a pointer move.
      await Promise.resolve();

      expect(handle.element.parentElement).toBe(list);
      expect(handle.element.matches(':popover-open')).toBe(true);
      expect(handle.element.getBoundingClientRect().height).toBe(30);
      expect(handle.element.scrollTop).toBe(40);
    } finally {
      handle.destroy();
    }
  });

  it('keeps the source geometry rather than shrinking to fit', () => {
    const handle = clonePreview(source, null)!;

    // Out of flow, the clone would otherwise collapse to its content width.
    expect(Math.round(handle.element.getBoundingClientRect().width)).toBe(120);
    expect(Math.round(handle.element.getBoundingClientRect().height)).toBe(30);

    handle.destroy();
  });

  it('sizes the clone from the untransformed box of a transformed source', () => {
    // `getBoundingClientRect` includes the source's own transform (240×60 here),
    // but the clone renders with `transform` neutralized, so it must be sized from
    // the untransformed layout box.
    source.style.transform = 'scale(2)';

    const handle = clonePreview(source, null)!;

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

    const handle = clonePreview(source, null)!;

    expect(handle.anchor.sourceRect.left).toBeCloseTo(baseline.left);
    expect(handle.anchor.sourceRect.top).toBeCloseTo(baseline.top);
    expect(handle.anchor.sourceRect.width).toBe(120);
    expect(handle.anchor.sourceRect.height).toBe(30);

    handle.destroy();
  });

  it('anchors a rotated clone from a custom transform origin', () => {
    const baseline = source.getBoundingClientRect();
    source.style.transformOrigin = '0 0';
    source.style.rotate = '90deg';

    const handle = clonePreview(source, null)!;

    expect(handle.anchor.sourceRect.left).toBeCloseTo(baseline.left);
    expect(handle.anchor.sourceRect.top).toBeCloseTo(baseline.top);
    expect(handle.anchor.sourceRect.width).toBe(120);
    expect(handle.anchor.sourceRect.height).toBe(30);

    handle.destroy();
  });

  it('sizes the clone from the untransformed box for the individual scale property', () => {
    // CSS Transforms 2 keeps `scale`, `rotate` and `translate` out of the computed
    // `transform`, so a source with a hover-lift `scale: 1.5` reads as
    // untransformed unless each property is checked.
    source.style.scale = '1.5';

    const handle = clonePreview(source, null)!;

    // `scale` isn't neutralized: it composes around the box's center without moving
    // the anchor, so the clone re-applies it to the untransformed box. Sizing from
    // the transformed bounding box would compound it to 2.25x.
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
    const handle = clonePreview(source, null)!;
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
      const handle = clonePreview(source, null)!;
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
    const handle = createDragPreviewElement(
      source,
      measurePreviewAnchor(source, null)!,
      document.createElement('div'),
    )!;
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
    // Every frame writes `translate`. A source transition would ease each write,
    // and the preview would trail the pointer for the whole drag.
    source.style.transition = 'transform 200ms ease';
    source.style.animation = 'spin 1s linear infinite';

    const handle = clonePreview(source, null)!;

    // Assert the effect, not the serialization, because the `animation` shorthand
    // reads back as its longhands.
    const computed = getComputedStyle(handle.element);
    expect(computed.transitionDuration).toBe('0s');
    expect(computed.animationName).toBe('none');

    handle.destroy();
  });

  it('lets a consumer rule keyed on the preview attribute override the neutralizer', () => {
    // The engine neutralizes `transition` from its adopted sheet, not inline, so
    // this documented styling hook wins without `!important`.
    const sheet = document.createElement('style');
    sheet.textContent = '.Card[data-drag-preview]{rotate:3deg;transition:box-shadow 300ms ease;}';
    document.head.appendChild(sheet);
    source.classList.add('Card');

    const handle = clonePreview(source, null)!;

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

    const handle = clonePreview(source, null)!;
    const computed = getComputedStyle(handle.element);

    expect(handle.element.id).not.toBe(source.id);
    expect(document.getElementById(handle.element.id)).toBe(handle.element);
    expect(computed.color).not.toBe('rgb(123, 45, 67)');
    expect(computed.opacity).toBe('0.5');

    handle.destroy();
    sheet.remove();
  });

  it('lets cascade-layered consumer styles (Tailwind-style) style the preview', () => {
    // Tailwind v4 puts every utility in `@layer utilities`, which loses to any
    // unlayered rule. So the engine ships no unlayered visual rule and writes back
    // inline only the values the UA popover chrome changed.
    const sheet = document.createElement('style');
    sheet.textContent =
      '@layer utilities { .Card { border: 2px solid rgb(1, 2, 3); } ' +
      '.Card[data-drag-preview] { rotate: 4deg; } }';
    document.head.appendChild(sheet);
    source.classList.add('Card');

    const handle = clonePreview(source, null)!;

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

    const handle = clonePreview(source, null)!;

    // `cloneNode` copies the element, not its bitmap. Without a copy, a chart or
    // signature pad would drag as a blank rectangle.
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

    // Scroll offsets are no-ops on a detached node, so they apply only once the
    // clone is inserted and shown. Writing to a `display: none` subtree clamps to
    // 0, which is why the top-layer promotion comes first.
    const handle = clonePreview(source, null)!;
    const cloneScrollable = handle.element.querySelector('div')!;
    expect(cloneScrollable.scrollTop).toBe(120);

    // A mid-drag re-home closes the popover before the offsets are re-applied. The
    // popover must reopen first, or the write clamps to 0 under `display: none`.
    list.remove();
    handle.ensureConnected();
    expect(handle.element.querySelector('div')!.scrollTop).toBe(120);

    handle.destroy();
  });

  it('re-adopts the neutralizer sheet after the document replaces its adopted sheets', () => {
    source.style.transition = 'transform 200ms ease';
    const first = clonePreview(source, null)!;
    const sheet = findNeutralizerSheet(document);
    expect(sheet).toBeDefined();
    first.destroy();

    // A theme switch that assigns a new `adoptedStyleSheets` array drops the
    // engine's sheet with everything else. The next preview must adopt it again,
    // or it would carry the source's transition.
    document.adoptedStyleSheets = [];

    const second = clonePreview(source, null)!;
    expect(document.adoptedStyleSheets.filter((adopted) => adopted === sheet)).toHaveLength(1);
    expect(getComputedStyle(second.element).transitionDuration).toBe('0s');
    second.destroy();
  });

  describe('lifted through the pointer sensor', () => {
    const { renderDnd } = createDndRenderer();

    /**
     * Press, cross the mouse activation distance, then settle back on the press
     * point, as a real pickup does. Returns the clone's box on the frame the drag
     * committed and the source's box at the press.
     */
    async function liftAndMeasure(): Promise<{ sourceRect: DOMRect; cloneRect: DOMRect }> {
      const { engine } = await renderDnd();
      engine.registerSource(source, {});

      const sourceRect = source.getBoundingClientRect();
      const pressX = sourceRect.left + 8;
      const pressY = sourceRect.top + 6;
      dispatchMouse('pointerdown', source, pressX, pressY);
      dispatchMouse('pointermove', source, pressX + 20, pressY);
      dispatchMouse('pointermove', source, pressX, pressY);
      await flushRaf();

      const clone = document.querySelector<HTMLElement>(
        `[${DraggablePreviewDataAttributes.dragPreview}]`,
      );
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

    it('re-grabs a source whose previous preview is still settling without its settling state', async () => {
      const animationsFlag = globalThis as { BASE_UI_ANIMATIONS_DISABLED?: boolean | undefined };
      const previousFlag = animationsFlag.BASE_UI_ANIMATIONS_DISABLED;
      animationsFlag.BASE_UI_ANIMATIONS_DISABLED = false;
      const sheet = document.createElement('style');
      sheet.textContent = `
        .Card { color: rgb(0, 0, 0); }
        .Card[data-settling] { color: transparent; width: 60px !important; }
        .Card[data-drag-preview][data-ending-style] { transition: translate 10s linear; }
      `;
      document.head.appendChild(sheet);
      source.className = 'Card';
      const measuredWidths: number[] = [];
      const probe: DraggableRootModifier = (context) => {
        measuredWidths.push(context.sourceRect.width);
        return context.point;
      };
      try {
        const { engine } = await renderDnd();
        engine.registerSource(source, { modifiers: probe });
        const sourceRect = source.getBoundingClientRect();
        const pressX = sourceRect.left + 8;
        const pressY = sourceRect.top + 6;
        dispatchMouse('pointerdown', source, pressX, pressY);
        dispatchMouse('pointermove', source, pressX + 20, pressY);
        await flushRaf();
        dispatchMouse('pointerup', source, pressX + 20, pressY);
        expect(source).toHaveAttribute('data-settling');

        // Grab it again while the first clone is still settling.
        dispatchMouse('pointerdown', source, pressX, pressY);
        dispatchMouse('pointermove', source, pressX + 20, pressY);
        await flushRaf();

        const previews = document.querySelectorAll<HTMLElement>(
          `[${DraggablePreviewDataAttributes.dragPreview}]`,
        );
        expect(previews).toHaveLength(1);
        const preview = previews[0];
        expect(preview).not.toHaveAttribute('data-settling');
        expect(getComputedStyle(preview).color).toBe('rgb(0, 0, 0)');
        // Measured without the `[data-settling]` width, by the preview and the modifiers.
        expect(preview.getBoundingClientRect().width).toBeCloseTo(sourceRect.width);
        expect(measuredWidths.at(-1)).toBeCloseTo(sourceRect.width);
        dispatchMouse('pointerup', source, pressX + 20, pressY);
      } finally {
        animationsFlag.BASE_UI_ANIMATIONS_DISABLED = previousFlag;
        sheet.remove();
      }
    });

    it('lifts a scaled source off exactly where it sits', async () => {
      // The lifecycle's grab offset is relative to the transformed rect, but the
      // clone is anchored on the untransformed box it re-applies `scale` to.
      // Anchoring the default `'source'` offset on that same box keeps the clone
      // from jumping at pickup.
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

    // A non-uniform ancestor scale with a rotated source isn't supported (see
    // `applyAncestorScale`).
    it.each(['scale(0.5)'])('preserves a rotated source under %s', async (scale) => {
      list.style.transform = `translateY(40px) ${scale}`;
      source.style.rotate = '30deg';
      source.style.transformOrigin = '20px 10px';

      const { sourceRect, cloneRect } = await liftAndMeasure();

      expectSameBox(cloneRect, sourceRect);
    });
  });

  it('reads the transform origin again when ending styles change it', () => {
    // The ancestor scale is re-applied around the preview's `transform-origin`, and
    // the position offsets it. An ending rule that moves the origin must not shift
    // the preview off its destination.
    const sheet = document.createElement('style');
    sheet.textContent = '.Card[data-ending-style] { transform-origin: 0 0; }';
    document.head.appendChild(sheet);
    const scaled = document.createElement('div');
    scaled.style.cssText =
      'position: absolute; inset: 0 auto auto 0; transform: scale(2); transform-origin: 0 0;';
    const card = document.createElement('div');
    card.className = 'Card';
    card.style.cssText = 'width: 50px; height: 20px;';
    scaled.appendChild(card);
    document.body.appendChild(scaled);
    const handle = clonePreview(card, null)!;
    try {
      handle.element.setAttribute('data-ending-style', '');
      handle.prepareForDrop();
      handle.setPosition(100, 60);

      const rect = handle.element.getBoundingClientRect();
      expect(rect.left).toBeCloseTo(100);
      expect(rect.top).toBeCloseTo(60);
      expect(rect.width).toBeCloseTo(100);
    } finally {
      handle.destroy();
      scaled.remove();
      sheet.remove();
    }
  });

  it('keeps the preview in place when ending styles move its transform origin', () => {
    // A fade-only ending leaves the preview where it was released, so the position
    // must follow the new origin without a new `setPosition`.
    const sheet = document.createElement('style');
    sheet.textContent = '.Card[data-ending-style] { transform-origin: 0 0; }';
    document.head.appendChild(sheet);
    const scaled = document.createElement('div');
    scaled.style.cssText =
      'position: absolute; inset: 0 auto auto 0; transform: scale(2); transform-origin: 0 0;';
    const card = document.createElement('div');
    card.className = 'Card';
    card.style.cssText = 'width: 50px; height: 20px;';
    scaled.appendChild(card);
    document.body.appendChild(scaled);
    const handle = clonePreview(card, null)!;
    try {
      handle.setPosition(100, 60);
      expect(handle.element.getBoundingClientRect().left).toBeCloseTo(100);

      handle.element.setAttribute('data-ending-style', '');
      handle.prepareForDrop();

      const rect = handle.element.getBoundingClientRect();
      expect(rect.left).toBeCloseTo(100);
      expect(rect.top).toBeCloseTo(60);
    } finally {
      handle.destroy();
      scaled.remove();
      sheet.remove();
    }
  });

  it('lets ending styles set what the popover corrections pinned', () => {
    // An unstyled source gets the UA `Canvas` background corrected away inline. A
    // drop animation that sets a background must still win.
    const sheet = document.createElement('style');
    sheet.textContent = '.Plain[data-ending-style] { background-color: rgb(255, 0, 0); }';
    document.head.appendChild(sheet);
    const plain = document.createElement('div');
    plain.className = 'Plain';
    plain.textContent = 'Plain';
    list.appendChild(plain);
    const handle = clonePreview(plain, null)!;
    try {
      expect(getComputedStyle(handle.element).backgroundColor).toBe('rgba(0, 0, 0, 0)');

      handle.element.setAttribute('data-ending-style', '');
      handle.prepareForDrop();

      expect(getComputedStyle(handle.element).backgroundColor).toBe('rgb(255, 0, 0)');
      expect(handle.element.matches(':popover-open')).toBe(true);
    } finally {
      handle.destroy();
      plain.remove();
      sheet.remove();
    }
  });

  it('runs an ending transition on properties other than translate', () => {
    // A fade-out on the drop. Measuring the popover corrections again for the ending
    // styles must not apply them without their transition.
    const sheet = document.createElement('style');
    sheet.textContent =
      '.Fade[data-drag-preview] { transition: opacity 200ms; } ' +
      '.Fade[data-drag-preview][data-ending-style] { opacity: 0; }';
    document.head.appendChild(sheet);
    const fade = document.createElement('div');
    fade.className = 'Fade';
    fade.textContent = 'Fade';
    list.appendChild(fade);
    const handle = clonePreview(fade, null)!;
    try {
      handle.element.setAttribute('data-ending-style', '');
      handle.prepareForDrop();

      const transitions = handle.element
        .getAnimations()
        .filter((animation): animation is CSSTransition => animation instanceof CSSTransition);
      expect(transitions.map((transition) => transition.transitionProperty)).toContain('opacity');
    } finally {
      handle.destroy();
      fade.remove();
      sheet.remove();
    }
  });

  it('shows the clone of a source that is an open popover', () => {
    const panel = document.createElement('div');
    panel.setAttribute('popover', 'manual');
    panel.textContent = 'Panel';
    list.appendChild(panel);
    panel.showPopover();
    const handle = clonePreview(panel, null)!;
    try {
      expect(handle.element.matches(':popover-open')).toBe(true);
      expect(getComputedStyle(handle.element).display).toBe('block');
    } finally {
      handle.destroy();
      panel.remove();
    }
  });

  it('keeps the popover UA chrome off the preview', () => {
    // A source that sets none of the properties the `[popover]` UA rule sets: no
    // border, padding, background, overflow or color of its own.
    const plain = document.createElement('div');
    plain.textContent = 'Plain';
    list.style.color = 'rgb(1, 2, 3)';
    list.appendChild(plain);
    const handle = clonePreview(source, null)!;
    const plainHandle = clonePreview(plain, null)!;
    try {
      // None of the `[popover]` UA chrome may reach the preview: `margin: auto`,
      // border, padding, `overflow: auto`, `CanvasText`, and a `Canvas` background.
      const styles = getComputedStyle(handle.element);
      expect(styles.marginTop).toBe('0px');
      expect(styles.borderTopWidth).toBe('0px');
      expect(styles.backgroundColor).toBe('rgb(0, 128, 0)');

      const plainStyles = getComputedStyle(plainHandle.element);
      expect(plainStyles.borderTopStyle).toBe('none');
      expect(plainStyles.paddingTop).toBe('0px');
      expect(plainStyles.overflow).toBe('visible');
      expect(plainStyles.backgroundColor).toBe('rgba(0, 0, 0, 0)');
      expect(plainStyles.color).toBe('rgb(1, 2, 3)');
    } finally {
      handle.destroy();
      plainHandle.destroy();
      plain.remove();
    }
  });
});
