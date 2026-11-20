import { describe, it, expect, vi, afterEach } from 'vitest';
import { isJSDOM } from '#test-utils';
import { getElementScale, getElementZoom, isRtlElement } from './utils';
import { holdClosedShadowRoots, resetForTests as resetComposedTree } from './composedTree';

function makeEl(): HTMLElement {
  const el = document.createElement('div');
  document.body.appendChild(el);
  return el;
}

/**
 * `leaf` in the light DOM of `host`, assigned to a slot inside `wrapper` in its shadow
 * root. A closed root is held, as a registration inside it would.
 */
function makeSlotted(host: HTMLElement, mode: ShadowRootMode) {
  const wrapper = document.createElement('div');
  const slot = document.createElement('slot');
  wrapper.appendChild(slot);
  host.attachShadow({ mode }).appendChild(wrapper);
  const leaf = document.createElement('div');
  host.appendChild(leaf);
  holdClosedShadowRoots(wrapper);
  return { wrapper, slot, leaf };
}

afterEach(() => {
  resetComposedTree();
});

// A closed root hides `assignedSlot`, so these walks reach the slot only through a held root.
describe('isRtlElement', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  // A browser resolves the inherited `direction` on the leaf itself, so only a DOM that
  // doesn't (jsdom) walks up to find it.
  it.skipIf(!isJSDOM).each(['open', 'closed'] as const)(
    'reads the direction of a wrapper around the slot (%s root)',
    (mode) => {
      const { wrapper, leaf } = makeSlotted(makeEl(), mode);
      wrapper.style.direction = 'rtl';

      expect(isRtlElement(leaf)).toBe(true);
    },
  );
});

describe.skipIf(isJSDOM)('getElementZoom', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it.each(['open', 'closed'] as const)(
    'multiplies the zoom of a wrapper around the slot (%s root)',
    (mode) => {
      const { wrapper, leaf } = makeSlotted(makeEl(), mode);
      wrapper.style.zoom = '2';

      expect(getElementZoom(leaf)).toBe(2);
    },
  );
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

  it.each(['open', 'closed'] as const)(
    'walks through the slot instead of the light-DOM parent (%s root)',
    (mode) => {
      const host = makeNested('transform: matrix(2, 0, 0, 2, 0, 0)');
      const { wrapper, slot, leaf } = makeSlotted(host, mode);
      wrapper.style.transform = 'matrix(3, 0, 0, 3, 0, 0)';

      expect(leaf.assignedSlot).toBe(mode === 'open' ? slot : null);
      expect(getElementScale(leaf)).toEqual({ x: 6, y: 6 });
    },
  );

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
    // element's own value, not the effective one, which jsdom can't tell apart. An engine
    // reporting the effective zoom would square this to 36.
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
