import { afterEach, describe, expect, it, vi } from 'vitest';
import { getPseudoElementBounds } from './getPseudoElementBounds';

const platformFlags = vi.hoisted(() => ({ jsdom: true }));

vi.mock('@base-ui/utils/platform', async () => {
  const actual =
    await vi.importActual<typeof import('@base-ui/utils/platform')>('@base-ui/utils/platform');

  return {
    ...actual,
    platform: {
      ...actual.platform,
      env: {
        ...actual.platform.env,
        get jsdom() {
          return platformFlags.jsdom;
        },
      },
    },
  };
});

describe('getPseudoElementBounds', () => {
  afterEach(() => {
    platformFlags.jsdom = true;
    vi.restoreAllMocks();
  });

  it('does not read pseudo-element styles in jsdom', () => {
    const element = createElementWithRect({ x: 100, y: 50, width: 20, height: 10 });
    const getComputedStyle = vi.spyOn(window, 'getComputedStyle');

    expect(getPseudoElementBounds(element)).toMatchObject({
      left: 100,
      right: 120,
      top: 50,
      bottom: 60,
    });
    expect(getComputedStyle).not.toHaveBeenCalled();
  });

  it('includes pseudo-element bounds outside jsdom', () => {
    platformFlags.jsdom = false;
    vi.spyOn(window, 'getComputedStyle').mockImplementation((_element, pseudoElt) => {
      if (pseudoElt === '::before') {
        return createComputedStyle({ content: '""', width: '40px', height: '30px' });
      }
      return createComputedStyle({ content: 'none', width: '0px', height: '0px' });
    });

    const element = createElementWithRect({ x: 100, y: 50, width: 20, height: 10 });

    expect(getPseudoElementBounds(element)).toEqual({
      left: 90,
      right: 130,
      top: 40,
      bottom: 70,
    });
  });
});

function createElementWithRect(rect: DOMRectInit) {
  const element = document.createElement('div');
  element.getBoundingClientRect = () => DOMRect.fromRect(rect);
  return element;
}

function createComputedStyle(values: Partial<CSSStyleDeclaration>) {
  const styles = document.createElement('div').style;
  Object.assign(styles, values);
  return styles;
}
