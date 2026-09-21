import { describe, it, expect, afterEach, vi } from 'vitest';
import { capturePreviewStyles } from './previewStyles';

/** A stylesheet whose rules are unreadable, as a cross-origin sheet's are. */
function createUnreadableSheet(href: string | null): CSSStyleSheet {
  return {
    disabled: false,
    href,
    get cssRules(): CSSRuleList {
      throw new DOMException('Cannot access rules', 'SecurityError');
    },
  } as unknown as CSSStyleSheet;
}

function createTrees() {
  const source = document.createElement('div');
  source.className = 'Card';
  source.innerHTML = '<span class="Child">A</span><span class="Child">B</span>';
  document.body.appendChild(source);
  const clone = source.cloneNode(true) as HTMLElement;
  const sourceNodes = [source, ...Array.from(source.querySelectorAll('*'))];
  const cloneNodes = [clone, ...Array.from(clone.querySelectorAll('*'))];
  return { source, clone, sourceNodes, cloneNodes };
}

describe('capturePreviewStyles', () => {
  afterEach(() => {
    delete (document as { adoptedStyleSheets?: unknown }).adoptedStyleSheets;
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  /** jsdom has no `adoptedStyleSheets`; expose the sheet through it as a browser would. */
  function adopt(sheet: CSSStyleSheet) {
    Object.defineProperty(document, 'adoptedStyleSheets', {
      value: [sheet],
      configurable: true,
      writable: true,
    });
  }

  it('skips a cross-origin sheet instead of dumping every computed style', () => {
    adopt(createUnreadableSheet('https://fonts.googleapis.com/css2?family=Inter'));
    const { source, clone, sourceNodes, cloneNodes } = createTrees();
    const measure = vi.spyOn(window, 'getComputedStyle');

    const styles = capturePreviewStyles(source, sourceNodes, clone, cloneNodes);
    document.body.appendChild(clone);
    styles.restore();

    expect(measure).not.toHaveBeenCalled();
    for (const node of cloneNodes) {
      expect((node as HTMLElement).getAttribute('style')).toBeNull();
    }
    styles.destroy();
  });

  it('falls back to a computed-style snapshot for a same-origin sheet that hides its rules', () => {
    adopt(createUnreadableSheet(null));
    const { source, clone, sourceNodes, cloneNodes } = createTrees();
    // jsdom's pseudo-element declarations are not iterable; a browser's are.
    const measure = vi.spyOn(window, 'getComputedStyle').mockImplementation(
      () =>
        ({
          content: 'none',
          getPropertyValue: () => '',
          *[Symbol.iterator]() {
            yield 'color';
          },
        }) as unknown as CSSStyleDeclaration,
    );

    capturePreviewStyles(source, sourceNodes, clone, cloneNodes);

    // Snapshots are read from the source tree, never from the detached clone.
    const measured = new Set(measure.mock.calls.map(([node]) => node));
    for (const node of sourceNodes) {
      expect(measured.has(node)).toBe(true);
    }
    for (const node of cloneNodes) {
      expect(measured.has(node)).toBe(false);
    }
  });
});
