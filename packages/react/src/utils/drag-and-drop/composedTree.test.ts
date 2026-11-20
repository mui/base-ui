import { describe, it, expect, vi, afterEach } from 'vitest';
import { isJSDOM } from '#test-utils';
import {
  deepElementFromPoint,
  elementFromPointIgnoring,
  getComposedParentElement,
  holdClosedShadowRoots,
  resetForTests,
} from './composedTree';

function makeEl(): HTMLElement {
  const el = document.createElement('div');
  document.body.appendChild(el);
  return el;
}

afterEach(() => {
  vi.restoreAllMocks();
  resetForTests();
  document.body.replaceChildren();
});

describe('elementFromPointIgnoring', () => {
  it('returns the hit element directly when it is not the preview', () => {
    const underlying = makeEl();
    const preview = makeEl();
    const spy = vi.spyOn(document, 'elementFromPoint').mockReturnValue(underlying);

    expect(elementFromPointIgnoring(document, 10, 20, preview)).toBe(underlying);
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

    expect(elementFromPointIgnoring(document, 10, 20, preview)).toBe(underlying);
    expect(spy).toHaveBeenCalledTimes(2);
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
    // jsdom's ShadowRoot has no elementFromPoint, so stub the browser behavior.
    (shadow as unknown as { elementFromPoint: () => Element }).elementFromPoint = () => inner;
    vi.spyOn(document, 'elementFromPoint').mockReturnValue(host);

    // A document-level hit stops at the shadow host. Without the descent, a drop
    // target inside the shadow tree would never be entered.
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

  it('descends through the closed roots a registration holds, ancestors included', () => {
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

    expect(deepElementFromPoint(document, 10, 20)).toBe(outerHost);

    holdClosedShadowRoots(leaf);

    expect(deepElementFromPoint(document, 10, 20)).toBe(leaf);
  });

  // jsdom's ShadowRoot lacks elementFromPoint. Browsers always have it, so this
  // case can't be reproduced there.
  it.skipIf(!isJSDOM)('stops at a host whose shadow root cannot hit-test (jsdom)', () => {
    const host = makeEl();
    host.attachShadow({ mode: 'open' });
    vi.spyOn(document, 'elementFromPoint').mockReturnValue(host);

    expect(deepElementFromPoint(document, 10, 20)).toBe(host);
  });

  it.each([
    ['NaN', NaN, 20],
    ['infinite', 10, Infinity],
  ])('reports nothing for a %s coordinate instead of hit-testing it', (_, x, y) => {
    // Browsers reject a non-finite coordinate with a `TypeError`. A modifier
    // producing one would otherwise throw on every frame and strand the drag.
    const spy = vi.spyOn(document, 'elementFromPoint').mockReturnValue(makeEl());

    expect(deepElementFromPoint(document, x, y)).toBeNull();
    expect(elementFromPointIgnoring(document, x, y, null)).toBeNull();
    expect(spy).not.toHaveBeenCalled();
  });

  it('returns null in a document that cannot hit-test at all', () => {
    // This runs from the activation commit, outside every containment boundary and
    // after the pending listeners are removed. A throw would leave the sensor stuck
    // and refuse every later pickup.
    const doc = { elementFromPoint: undefined } as unknown as Document;

    expect(deepElementFromPoint(doc, 10, 20)).toBeNull();
    expect(elementFromPointIgnoring(doc, 10, 20, null)).toBeNull();
  });
});

describe('getComposedParentElement', () => {
  function makeSlotted(mode: ShadowRootMode) {
    const host = makeEl();
    const root = host.attachShadow({ mode });
    const wrapper = document.createElement('div');
    const slot = document.createElement('slot');
    wrapper.appendChild(slot);
    root.appendChild(wrapper);
    const child = document.createElement('span');
    host.appendChild(child);
    return { host, wrapper, slot, child };
  }

  it('enters the assigned slot of an open shadow root', () => {
    const { slot, child } = makeSlotted('open');

    expect(getComposedParentElement(child)).toBe(slot);
  });

  it('enters the slot of a closed shadow root, which assignedSlot hides, while it is held', () => {
    const { host, wrapper, slot, child } = makeSlotted('closed');

    expect(child.assignedSlot).toBeNull();
    expect(getComposedParentElement(child)).toBe(host);

    const release = holdClosedShadowRoots(wrapper);
    expect(getComposedParentElement(child)).toBe(slot);

    release();
    expect(getComposedParentElement(child)).toBe(host);
  });

  it('keeps a closed root until every registration in it releases', () => {
    const { host, wrapper, slot, child } = makeSlotted('closed');
    const releaseWrapper = holdClosedShadowRoots(wrapper);
    const releaseSlot = holdClosedShadowRoots(slot);

    // A repeated release, as from a cleanup React already ran, counts once.
    releaseWrapper();
    releaseWrapper();
    expect(getComposedParentElement(child)).toBe(slot);

    releaseSlot();
    expect(getComposedParentElement(child)).toBe(host);
  });

  it('climbs to the host when no slot in the held closed root takes the element', () => {
    const { host, wrapper } = makeSlotted('closed');
    const unslotted = document.createElement('span');
    unslotted.slot = 'missing';
    host.appendChild(unslotted);
    holdClosedShadowRoots(wrapper);

    expect(getComposedParentElement(unslotted)).toBe(host);
  });
});
