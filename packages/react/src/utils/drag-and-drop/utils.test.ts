import { describe, it, expect, vi, afterEach } from 'vitest';
import { isJSDOM } from '#test-utils';
import { deepElementFromPoint, elementFromPointIgnoring, getElementScale } from './utils';

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

    expect(elementFromPointIgnoring(document, 10, 20, preview)).toBe(underlying);
    // No re-hit needed: the first result already wasn't the preview.
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('re-resolves what is underneath when the preview intercepts the hit', () => {
    const underlying = makeEl();
    const preview = makeEl();
    const inner = document.createElement('span');
    preview.appendChild(inner);

    // Preview content can set `pointer-events: auto` and swallow the hit; the
    // engine hides it synchronously (no repaint, so no flicker) and re-resolves.
    const spy = vi.spyOn(document, 'elementFromPoint').mockImplementation(() => {
      return preview.style.display === 'none' ? underlying : inner;
    });

    expect(elementFromPointIgnoring(document, 10, 20, preview)).toBe(underlying);
    expect(spy).toHaveBeenCalledTimes(2);
    // The preview's display is restored afterwards.
    expect(preview.style.display).toBe('');
  });

  it('passes the hit through when there is no preview to ignore', () => {
    const underlying = makeEl();
    vi.spyOn(document, 'elementFromPoint').mockReturnValue(underlying);

    expect(elementFromPointIgnoring(document, 10, 20, null)).toBe(underlying);
  });

  it('returns null when nothing is under the pointer', () => {
    const preview = makeEl();
    vi.spyOn(document, 'elementFromPoint').mockReturnValue(null);

    expect(elementFromPointIgnoring(document, 10, 20, preview)).toBeNull();
  });

  it('descends into an open shadow root instead of stopping at the host', () => {
    const host = makeEl();
    const shadow = host.attachShadow({ mode: 'open' });
    const inner = document.createElement('div');
    shadow.appendChild(inner);
    // jsdom's ShadowRoot has no elementFromPoint; supply the browser behavior.
    (shadow as unknown as { elementFromPoint: () => Element }).elementFromPoint = () => inner;
    vi.spyOn(document, 'elementFromPoint').mockReturnValue(host);

    // A document-level hit stops at the shadow host; a drop target inside the
    // shadow tree would never be entered without the descent.
    expect(elementFromPointIgnoring(document, 10, 20, null)).toBe(inner);
  });

  it('stops descending when the shadow root resolves back to its host', () => {
    const host = makeEl();
    const shadow = host.attachShadow({ mode: 'open' });
    (shadow as unknown as { elementFromPoint: () => Element }).elementFromPoint = () => host;
    vi.spyOn(document, 'elementFromPoint').mockReturnValue(host);

    expect(elementFromPointIgnoring(document, 10, 20, null)).toBe(host);
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

    expect(deepElementFromPoint(document, 10, 20)).toBe(leaf);
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

  // Covers the jsdom quirk where ShadowRoot lacks elementFromPoint; in a real
  // browser the method always exists, so the premise cannot be reproduced.
  it.skipIf(!isJSDOM)('stops at a host whose shadow root cannot hit-test (jsdom)', () => {
    const host = makeEl();
    host.attachShadow({ mode: 'open' });
    vi.spyOn(document, 'elementFromPoint').mockReturnValue(host);

    expect(deepElementFromPoint(document, 10, 20)).toBe(host);
  });

  it('returns null in a document that cannot hit-test at all', () => {
    // jsdom defines `elementFromPoint` on neither Document nor ShadowRoot. This
    // runs from the activation commit, outside every containment boundary and
    // after the pending listeners are gone, so throwing here would strand the
    // sensor and refuse every later pickup — it has to degrade to "no target".
    const doc = { elementFromPoint: undefined } as unknown as Document;

    expect(deepElementFromPoint(doc, 10, 20)).toBeNull();
    expect(elementFromPointIgnoring(doc, 10, 20, null)).toBeNull();
  });
});

describe('getElementScale', () => {
  afterEach(() => {
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

  // A computed `transform` is always a matrix, which is why that is the only form parsed —
  // and why jsdom, which echoes the declared string, can still exercise the real path.
  it('reads an ancestor matrix', () => {
    expect(getElementScale(makeNested('transform: matrix(2, 0, 0, 3, 0, 0)'))).toEqual({
      x: 2,
      y: 3,
    });
  });

  // A rotated element's rect is its bounding box: read as a rect-to-layout ratio, the
  // rotation would look like a large scale.
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

  it.skipIf(isJSDOM)('folds in a zoom, which is not a transform', () => {
    expect(getElementScale(makeNested('zoom: 2'))).toEqual({ x: 2, y: 2 });
  });

  // Only a real browser resolves the shorthand forms into the matrix the walk reads, and
  // only there does the `scale` longhand (CSS Transforms 2) have a computed value at all.
  describe.skipIf(isJSDOM)('with styles a browser has resolved', () => {
    it('reads an ancestor scale()', () => {
      expect(getElementScale(makeNested('transform: scale(2)'))).toEqual({ x: 2, y: 2 });
    });

    it('reads an ancestor rotate() as no scale', () => {
      const scale = getElementScale(makeNested('transform: rotate(45deg)'));
      expect(scale.x).toBeCloseTo(1, 5);
      expect(scale.y).toBeCloseTo(1, 5);
    });

    // Loosely, because the browser serializes the composed matrix to a few decimals and
    // the norm of a 45° row carries that rounding through.
    it('reads the scale under a rotate()', () => {
      const scale = getElementScale(makeNested('transform: rotate(45deg) scale(2)'));
      expect(scale.x).toBeCloseTo(2, 4);
      expect(scale.y).toBeCloseTo(2, 4);
    });

    // `scale`/`rotate`/`translate` do not fold into the computed `transform`, so the
    // longhand has to be read on its own — the hover-lift pattern uses it.
    it('reads the scale longhand', () => {
      expect(getElementScale(makeNested('scale: 1.5 2'))).toEqual({ x: 1.5, y: 2 });
    });

    it('reads the rotate longhand as no scale', () => {
      const scale = getElementScale(makeNested('rotate: 45deg'));
      expect(scale.x).toBeCloseTo(1, 5);
      expect(scale.y).toBeCloseTo(1, 5);
    });

    it.each([
      ['100grad', '90deg'],
      ['1.5707963267948966rad', '90deg'],
      ['0.25turn', '90deg'],
    ])('receives a computed %s rotate longhand in degrees', (declared, expected) => {
      const child = makeNested('');
      child.style.rotate = declared;

      expect(getComputedStyle(child).rotate).toBe(expected);
    });

    // A rotation cannot change a scale by itself, but it reorients which axis an
    // ancestor's scale lands on — dropped from the matrix, these come out swapped
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

    // An off-plane axis squashes what it paints — the same flattening the `matrix3d`
    // branch applies.
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

    // Multiplying zooms down the chain is only right because a computed `zoom` is the
    // element's *own* value, not the effective one — which jsdom, echoing whatever was
    // declared, cannot tell apart. An engine reporting the effective zoom would square
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
