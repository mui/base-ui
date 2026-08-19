import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { isJSDOM } from '#test-utils';
import { installDndPolyfill } from '../../../../test/dndPolyfill';
import { createDragPreviewElement } from './cloneDragPreview';

installDndPolyfill();

/**
 * The top layer is the whole point of the in-place preview: it is what lets an
 * element injected deep inside a transformed, clipping ancestor still be positioned
 * against the viewport and painted above everything. jsdom implements none of it
 * (`showPopover` doesn't exist), so these have to run in a real browser.
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

  it('promotes the preview to the top layer through an engine-owned wrapper', () => {
    const handle = createDragPreviewElement(source, { content: 'clone' })!;

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
    const handle = createDragPreviewElement(source, { content: 'clone' })!;
    handle.element.style.translate = '300px 400px';

    // The ancestor translates its content by 40px. A trapped preview would land at
    // 440; the top layer's containing block is the viewport, so it lands at 400.
    const rect = handle.element.getBoundingClientRect();
    expect(Math.round(rect.left)).toBe(300);
    expect(Math.round(rect.top)).toBe(400);

    handle.destroy();
  });

  it('is not clipped by the scroll container it was injected into', () => {
    const handle = createDragPreviewElement(source, { content: 'clone' })!;
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
    const handle = createDragPreviewElement(source, { content: 'clone' })!;
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

  it('keeps the source geometry rather than shrinking to fit', () => {
    const handle = createDragPreviewElement(source, { content: 'clone' })!;

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

    const handle = createDragPreviewElement(source, { content: 'clone' })!;

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

    const handle = createDragPreviewElement(source, { content: 'clone' })!;

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

    const handle = createDragPreviewElement(source, { content: 'clone' })!;

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

    const handle = createDragPreviewElement(source, { content: 'clone' })!;

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

  it('drops the source transition and animation so the preview tracks the pointer', () => {
    // Every frame writes `transform`; a source transition would ease each of
    // those writes and the preview would trail the pointer for the whole drag.
    source.style.transition = 'transform 200ms ease';
    source.style.animation = 'spin 1s linear infinite';

    const handle = createDragPreviewElement(source, { content: 'clone' })!;

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

    const handle = createDragPreviewElement(source, { content: 'clone' })!;

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

    const handle = createDragPreviewElement(source, { content: 'clone' })!;
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

    const handle = createDragPreviewElement(source, { content: 'clone' })!;

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

    const handle = createDragPreviewElement(source, { content: 'clone' })!;

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
    const handle = createDragPreviewElement(source, { content: 'clone' })!;
    const cloneScrollable = handle.element.querySelector('div')!;
    expect(cloneScrollable.scrollTop).toBe(120);

    // A mid-drag re-home closes the popover before the offsets are re-applied;
    // the reopen must come first or the write clamps to 0 in `display: none`.
    list.remove();
    handle.ensureConnected();
    expect(handle.element.querySelector('div')!.scrollTop).toBe(120);

    handle.destroy();
  });

  it('confines the popover UA chrome to the wrapper, away from the preview', () => {
    const handle = createDragPreviewElement(source, { content: 'clone' })!;

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
