import { describe, it, expect, vi, afterEach } from 'vitest';
import { isJSDOM } from '#test-utils';
import {
  deepElementFromPoint,
  elementFromPointIgnoring,
  getComposedParentElement,
  getElementScale,
} from './utils';

const NO_SHADOW_ROOTS: ReadonlyMap<Element, ShadowRoot> = new Map();

function makeEl(): HTMLElement {
  const el = document.createElement('div');
  document.body.appendChild(el);
  return el;
}

describe('elementFromPointIgnoring', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.replaceChildren();
  });

  it('returns the hit element directly when it is not the preview', () => {
    const underlying = makeEl();
    const preview = makeEl();
    const spy = vi.spyOn(document, 'elementFromPoint').mockReturnValue(underlying);

    expect(elementFromPointIgnoring(document, 10, 20, preview, NO_SHADOW_ROOTS)).toBe(underlying);
    // The first hit isn't the preview, so there is no second hit-test.
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('re-resolves what is underneath when the preview intercepts the hit', () => {
    const underlying = makeEl();
    const preview = makeEl();
    const inner = document.createElement('span');
    preview.appendChild(inner);

    // Preview content can set `pointer-events: auto` and catch the hit. The
    // engine hides the preview synchronously and hit-tests again.
    const spy = vi.spyOn(document, 'elementFromPoint').mockImplementation(() => {
      return preview.style.display === 'none' ? underlying : inner;
    });

    expect(elementFromPointIgnoring(document, 10, 20, preview, NO_SHADOW_ROOTS)).toBe(underlying);
    expect(spy).toHaveBeenCalledTimes(2);
    // The preview's display is restored afterwards.
    expect(preview.style.display).toBe('');
  });

  it('passes the hit through when there is no preview to ignore', () => {
    const underlying = makeEl();
    vi.spyOn(document, 'elementFromPoint').mockReturnValue(underlying);

    expect(elementFromPointIgnoring(document, 10, 20, null, NO_SHADOW_ROOTS)).toBe(underlying);
  });

  it('returns null when nothing is under the pointer', () => {
    const preview = makeEl();
    vi.spyOn(document, 'elementFromPoint').mockReturnValue(null);

    expect(elementFromPointIgnoring(document, 10, 20, preview, NO_SHADOW_ROOTS)).toBeNull();
  });

  it('descends into an open shadow root instead of stopping at the host', () => {
    const host = makeEl();
    const shadow = host.attachShadow({ mode: 'open' });
    const inner = document.createElement('div');
    shadow.appendChild(inner);
    // jsdom's ShadowRoot has no elementFromPoint, so stub the browser behavior.
    (shadow as unknown as { elementFromPoint: () => Element }).elementFromPoint = () => inner;
    vi.spyOn(document, 'elementFromPoint').mockReturnValue(host);

    // A document-level hit stops at the shadow host. Without the descent, a drop
    // target inside the shadow tree would never be entered.
    expect(elementFromPointIgnoring(document, 10, 20, null, NO_SHADOW_ROOTS)).toBe(inner);
  });

  it('stops descending when the shadow root resolves back to its host', () => {
    const host = makeEl();
    const shadow = host.attachShadow({ mode: 'open' });
    (shadow as unknown as { elementFromPoint: () => Element }).elementFromPoint = () => host;
    vi.spyOn(document, 'elementFromPoint').mockReturnValue(host);

    expect(elementFromPointIgnoring(document, 10, 20, null, NO_SHADOW_ROOTS)).toBe(host);
  });
});

describe('deepElementFromPoint', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.replaceChildren();
  });

  it('descends through nested open shadow roots to the deepest element', () => {
    const outerHost = makeEl();
    const outerShadow = outerHost.attachShadow({ mode: 'open' });
    const innerHost = document.createElement('div');
    outerShadow.appendChild(innerHost);
    const innerShadow = innerHost.attachShadow({ mode: 'open' });
    const leaf = document.createElement('div');
    innerShadow.appendChild(leaf);
    (outerShadow as unknown as { elementFromPoint: () => Element }).elementFromPoint = () =>
      innerHost;
    (innerShadow as unknown as { elementFromPoint: () => Element }).elementFromPoint = () => leaf;
    vi.spyOn(document, 'elementFromPoint').mockReturnValue(outerHost);

    expect(deepElementFromPoint(document, 10, 20, NO_SHADOW_ROOTS)).toBe(leaf);
  });

  it('descends through closed ancestors of a retained shadow root', () => {
    const outerHost = makeEl();
    const outerShadow = outerHost.attachShadow({ mode: 'closed' });
    const innerHost = document.createElement('div');
    outerShadow.appendChild(innerHost);
    const innerShadow = innerHost.attachShadow({ mode: 'closed' });
    const leaf = document.createElement('div');
    innerShadow.appendChild(leaf);
    (outerShadow as unknown as { elementFromPoint: () => Element }).elementFromPoint = () =>
      innerHost;
    (innerShadow as unknown as { elementFromPoint: () => Element }).elementFromPoint = () => leaf;
    vi.spyOn(document, 'elementFromPoint').mockReturnValue(outerHost);

    expect(
      deepElementFromPoint(
        document,
        10,
        20,
        new Map([
          [outerHost, outerShadow],
          [innerHost, innerShadow],
        ]),
      ),
    ).toBe(leaf);
  });

  // jsdom's ShadowRoot lacks elementFromPoint. Browsers always have it, so this
  // case can't be reproduced there.
  it.skipIf(!isJSDOM)('stops at a host whose shadow root cannot hit-test (jsdom)', () => {
    const host = makeEl();
    host.attachShadow({ mode: 'open' });
    vi.spyOn(document, 'elementFromPoint').mockReturnValue(host);

    expect(deepElementFromPoint(document, 10, 20, NO_SHADOW_ROOTS)).toBe(host);
  });

  it.each([
    ['NaN', NaN, 20],
    ['infinite', 10, Infinity],
  ])('reports nothing for a %s coordinate instead of hit-testing it', (_, x, y) => {
    // Browsers reject a non-finite coordinate with a `TypeError`. A modifier
    // producing one would otherwise throw on every frame and strand the drag.
    const spy = vi.spyOn(document, 'elementFromPoint').mockReturnValue(makeEl());

    expect(deepElementFromPoint(document, x, y, NO_SHADOW_ROOTS)).toBeNull();
    expect(elementFromPointIgnoring(document, x, y, null, NO_SHADOW_ROOTS)).toBeNull();
    expect(spy).not.toHaveBeenCalled();
  });

  it('returns null in a document that cannot hit-test at all', () => {
    // jsdom defines `elementFromPoint` on neither Document nor ShadowRoot. This
    // runs from the activation commit, outside every containment boundary and
    // after the pending listeners are removed. Throwing here would leave the
    // sensor stuck and refuse every later pickup, so it returns no target.
    const doc = { elementFromPoint: undefined } as unknown as Document;

    expect(deepElementFromPoint(doc, 10, 20, NO_SHADOW_ROOTS)).toBeNull();
    expect(elementFromPointIgnoring(doc, 10, 20, null, NO_SHADOW_ROOTS)).toBeNull();
  });
});

describe('getComposedParentElement', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  function makeSlotted(mode: ShadowRootMode) {
    const host = makeEl();
    const root = host.attachShadow({ mode });
    const wrapper = document.createElement('div');
    const slot = document.createElement('slot');
    wrapper.appendChild(slot);
    root.appendChild(wrapper);
    const child = document.createElement('span');
    host.appendChild(child);
    return { host, root, slot, child };
  }

  it('enters the assigned slot of an open shadow root', () => {
    const { slot, child } = makeSlotted('open');

    expect(getComposedParentElement(child)).toBe(slot);
  });

  it('enters the slot of a known closed shadow root, which assignedSlot hides', () => {
    const { host, root, slot, child } = makeSlotted('closed');

    expect(child.assignedSlot).toBeNull();
    expect(getComposedParentElement(child)).toBe(host);
    expect(getComposedParentElement(child, new Map([[host, root]]))).toBe(slot);
  });

  it('climbs to the host when no slot in the known closed root takes the element', () => {
    const { host, root } = makeSlotted('closed');
    const unslotted = document.createElement('span');
    unslotted.slot = 'missing';
    host.appendChild(unslotted);

    expect(getComposedParentElement(unslotted, new Map([[host, root]]))).toBe(host);
  });
});

describe('getElementScale', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
    document.body.replaceChildren();
  });

  /** A child under an ancestor styled with `css`, both attached to the document. */
  function makeNested(css: string): HTMLElement {
    const parent = makeEl();
    parent.style.cssText = css;
    const child = document.createElement('div');
    child.style.cssText = 'width: 100px; height: 40px;';
    parent.appendChild(child);
    return child;
  }

  it('reports 1 for an untransformed element', () => {
    expect(getElementScale(makeEl())).toEqual({ x: 1, y: 1 });
  });

  // A computed `transform` is always a matrix, so that is the only form parsed. jsdom
  // echoes the declared string, so a declared matrix still exercises the real path.
  it('reads an ancestor matrix', () => {
    expect(getElementScale(makeNested('transform: matrix(2, 0, 0, 3, 0, 0)'))).toEqual({
      x: 2,
      y: 3,
    });
  });

  // A rotated element's rect is its bounding box. Read as a rect-to-layout ratio, the
  // rotation would look like a scale.
  it('reads a rotation as no scale', () => {
    expect(getElementScale(makeNested('transform: matrix(0, 1, -1, 0, 0, 0)'))).toEqual({
      x: 1,
      y: 1,
    });
  });

  it('reads the scale a rotation is composed with', () => {
    expect(getElementScale(makeNested('transform: matrix(0, 2, -2, 0, 0, 0)'))).toEqual({
      x: 2,
      y: 2,
    });
  });

  it('reads a mirror as its magnitude', () => {
    expect(getElementScale(makeNested('transform: matrix(-2, 0, 0, 2, 0, 0)'))).toEqual({
      x: 2,
      y: 2,
    });
  });

  it('compounds the transforms of every ancestor', () => {
    const outer = makeNested('transform: matrix(2, 0, 0, 2, 0, 0)');
    const inner = document.createElement('div');
    inner.style.transform = 'matrix(3, 0, 0, 3, 0, 0)';
    const leaf = document.createElement('div');
    inner.appendChild(leaf);
    outer.appendChild(inner);

    expect(getElementScale(leaf)).toEqual({ x: 6, y: 6 });
  });

  it('ignores a translation', () => {
    expect(getElementScale(makeNested('transform: matrix(1, 0, 0, 1, 40, 90)'))).toEqual({
      x: 1,
      y: 1,
    });
  });

  it('crosses up out of a shadow root', () => {
    const host = makeNested('transform: matrix(2, 0, 0, 2, 0, 0)');
    const inner = document.createElement('div');
    host.attachShadow({ mode: 'open' }).appendChild(inner);

    expect(getElementScale(inner)).toEqual({ x: 2, y: 2 });
  });

  it('walks through an assigned slot instead of the light-DOM parent', () => {
    const host = makeNested('transform: matrix(2, 0, 0, 2, 0, 0)');
    const shadow = host.attachShadow({ mode: 'open' });
    const wrapper = document.createElement('div');
    wrapper.style.transform = 'matrix(3, 0, 0, 3, 0, 0)';
    const slot = document.createElement('slot');
    wrapper.appendChild(slot);
    shadow.appendChild(wrapper);
    const leaf = document.createElement('div');
    host.appendChild(leaf);

    expect(leaf.assignedSlot).toBe(slot);
    expect(getElementScale(leaf)).toEqual({ x: 6, y: 6 });
  });

  // jsdom only. It needs `vi.resetModules()` to hand out a fresh module, which
  // browser mode doesn't, and a browser hides a closed popover, whose transform
  // then no longer applies.
  it.skipIf(!isJSDOM)(
    'treats a popover as closed where `:popover-open` does not parse',
    async () => {
      // Browsers from before the popover API throw a `SyntaxError` on the selector.
      // The `popover` attribute does nothing there, so the ancestor scale still applies.
      const matches = Element.prototype.matches;
      const spy = vi.spyOn(Element.prototype, 'matches').mockImplementation(function mock(
        this: Element,
        selector: string,
      ) {
        if (selector === ':popover-open') {
          throw new DOMException(`'${selector}' is not a valid selector`, 'SyntaxError');
        }
        return matches.call(this, selector);
      });
      const child = makeNested('transform: matrix(2, 0, 0, 2, 0, 0)');
      child.parentElement!.setAttribute('popover', 'manual');
      // A fresh module, so the unsupported selector doesn't stay cached for later tests.
      vi.resetModules();
      const utils = await import('./utils');

      expect(utils.getElementScale(child)).toEqual({ x: 2, y: 2 });
      expect(utils.getElementScale(child)).toEqual({ x: 2, y: 2 });
      // Cached after the first failure.
      expect(spy.mock.calls.filter(([selector]) => selector === ':popover-open')).toHaveLength(1);
    },
  );

  it.skipIf(isJSDOM)('folds in a zoom, which is not a transform', () => {
    expect(getElementScale(makeNested('zoom: 2'))).toEqual({ x: 2, y: 2 });
  });

  // Only a browser resolves transform functions such as `scale(2)` into the matrix the
  // walk reads. jsdom also has no computed value for the `scale` longhand.
  describe.skipIf(isJSDOM)('with styles a browser has resolved', () => {
    it('reads an ancestor scale()', () => {
      expect(getElementScale(makeNested('transform: scale(2)'))).toEqual({ x: 2, y: 2 });
    });

    it('reads an ancestor rotate() as no scale', () => {
      const scale = getElementScale(makeNested('transform: rotate(45deg)'));
      expect(scale.x).toBeCloseTo(1, 5);
      expect(scale.y).toBeCloseTo(1, 5);
    });

    // Compared loosely, because the browser rounds the composed matrix to a few decimals
    // and the norm of a 45° row keeps that rounding.
    it('reads the scale under a rotate()', () => {
      const scale = getElementScale(makeNested('transform: rotate(45deg) scale(2)'));
      expect(scale.x).toBeCloseTo(2, 4);
      expect(scale.y).toBeCloseTo(2, 4);
    });

    // `scale`, `rotate`, and `translate` don't fold into the computed `transform`, so
    // the longhand is read on its own. Hover-lift effects use it.
    it('reads the scale longhand', () => {
      expect(getElementScale(makeNested('scale: 1.5 2'))).toEqual({ x: 1.5, y: 2 });
    });

    it('reads the rotate longhand as no scale', () => {
      const scale = getElementScale(makeNested('rotate: 45deg'));
      expect(scale.x).toBeCloseTo(1, 5);
      expect(scale.y).toBeCloseTo(1, 5);
    });

    // The computed rotate is in degrees whatever unit was declared, so these
    // read as the 90deg case below.
    it.each(['100grad', '1.5707963267948966rad', '0.25turn'])(
      'reads a %s rotate longhand under a non-uniform scale',
      (declared) => {
        const child = makeNested('transform: matrix(2, 0, 0, 1, 0, 0)');
        child.style.rotate = declared;
        const scale = getElementScale(child);
        expect(scale.x).toBeCloseTo(1, 5);
        expect(scale.y).toBeCloseTo(2, 5);
      },
    );

    // A rotation doesn't change a scale by itself, but it changes which axis an
    // ancestor's scale lands on. Left out of the matrix, these come out swapped
    // as 2 × 1.
    it('keeps the axes straight for a rotate longhand under a non-uniform scale', () => {
      const child = makeNested('transform: matrix(2, 0, 0, 1, 0, 0)');
      child.style.rotate = '90deg';
      const scale = getElementScale(child);
      expect(scale.x).toBeCloseTo(1, 5);
      expect(scale.y).toBeCloseTo(2, 5);
    });

    it('reads an exponent-serialized rotate longhand under a non-uniform scale', () => {
      const child = makeNested('transform: matrix(2, 0, 0, 1, 0, 0)');
      const degrees = 1_000_000;
      child.style.rotate = `${degrees}deg`;
      const radians = (degrees * Math.PI) / 180;
      const scale = getElementScale(child);

      expect(scale.x).toBeCloseTo(Math.hypot(2 * Math.cos(radians), Math.sin(radians)), 4);
      expect(scale.y).toBeCloseTo(Math.hypot(2 * Math.sin(radians), Math.cos(radians)), 4);
    });

    // A rotation out of the screen plane squashes what the element paints. The
    // `matrix3d` branch flattens it the same way.
    it('reads an x-axis rotate longhand as its on-screen squash', () => {
      const scale = getElementScale(makeNested('rotate: x 60deg'));
      expect(scale.x).toBeCloseTo(1, 5);
      expect(scale.y).toBeCloseTo(0.5, 5);
    });

    it("reads the element's own rotation as no scale", () => {
      const strip = makeEl();
      strip.style.cssText = 'width: 400px; height: 14px; transform: rotate(30deg);';
      const scale = getElementScale(strip);
      expect(scale.x).toBeCloseTo(1, 5);
      expect(scale.y).toBeCloseTo(1, 5);
    });

    // Multiplying zooms down the chain is correct only because a computed `zoom` is the
    // element's own value, not the effective one. jsdom echoes the declared value, so it
    // can't tell the two apart. An engine reporting the effective zoom would square
    // this to 36.
    it('multiplies nested zooms', () => {
      const outer = makeNested('zoom: 2');
      const inner = document.createElement('div');
      inner.style.zoom = '3';
      const leaf = document.createElement('div');
      inner.appendChild(leaf);
      outer.appendChild(inner);

      expect(getElementScale(leaf)).toEqual({ x: 6, y: 6 });
    });
  });
});
