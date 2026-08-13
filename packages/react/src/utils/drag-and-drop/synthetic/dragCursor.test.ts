import { afterEach, describe, expect, it, vi } from 'vitest';
import { isJSDOM } from '#test-utils';
import * as dragCursor from './dragCursor';

const DRAGGING_CLASS = 'baseui-dragging';
const STYLE_CLASS = 'baseui-dragging-styles';
const CURSOR_VAR = '--drag-cursor';

/**
 * The text of a `<style>` element's rules. The module inserts them through CSSOM,
 * which leaves `textContent` empty.
 */
function styleRuleText(style: HTMLStyleElement): string {
  return Array.from(style.sheet?.cssRules ?? [])
    .map((rule) => rule.cssText)
    .join('');
}

/** The scoped cursor rule injected at first use, or `null` when none is present. */
function scopedCursorRule(): string | null {
  for (const style of Array.from(document.head.querySelectorAll('style'))) {
    const text = styleRuleText(style);
    if (text.includes('cursor:')) {
      return text;
    }
  }
  return null;
}

function cursorStyleCount(): number {
  return Array.from(document.head.querySelectorAll('style')).filter((style) =>
    styleRuleText(style).includes('cursor:'),
  ).length;
}

function isDragging(): boolean {
  return document.documentElement.classList.contains(DRAGGING_CLASS);
}

function activeCursorVar(): string {
  return document.documentElement.style.getPropertyValue(CURSOR_VAR);
}

describe('dragCursor', () => {
  afterEach(() => {
    dragCursor.resetForTests();
  });

  it('injects a single scoped cursor rule at module use', () => {
    dragCursor.lock(document.body, 'grabbing');
    // Serialized from the CSSOM, so the `!important` the source declares is not
    // asserted here: jsdom drops the priority when it re-serializes a `var()`
    // declaration.
    expect(scopedCursorRule()).toContain(`html.${DRAGGING_CLASS}.${STYLE_CLASS} *`);
    expect(scopedCursorRule()).toContain(`cursor: var(${CURSOR_VAR}, grabbing)`);
    dragCursor.unlock();
  });

  it('inserts the rule through CSSOM without style text', () => {
    dragCursor.lock(document.body, 'grabbing');
    const styles = Array.from(document.head.querySelectorAll('style')).filter((style) =>
      styleRuleText(style).includes('cursor:'),
    );
    expect(styles).toHaveLength(1);
    // CSP still requires a matching nonce; this only verifies how the rule is
    // represented once the sheet has been accepted.
    expect(styles[0].textContent).toBe('');
    dragCursor.unlock();
  });

  it('sets the CSP nonce before attaching the stylesheet', () => {
    const frame = document.createElement('iframe');
    document.body.appendChild(frame);
    try {
      const innerDoc = frame.contentDocument!;
      const appendChild = innerDoc.head.appendChild.bind(innerDoc.head);
      const appendSpy = vi.spyOn(innerDoc.head, 'appendChild').mockImplementation((node: Node) => {
        expect((node as HTMLStyleElement).nonce).toBe('test-nonce');
        return appendChild(node);
      });

      dragCursor.lock(innerDoc.body, 'grabbing', { nonce: 'test-nonce' });

      expect(appendSpy).toHaveBeenCalledTimes(1);
      expect(innerDoc.head.querySelector('style')?.nonce).toBe('test-nonce');
      dragCursor.unlock();
    } finally {
      frame.remove();
    }
  });

  it.skipIf(isJSDOM)('applies the cursor rule under a nonce-only CSP', async () => {
    const frame = document.createElement('iframe');
    const loaded = new Promise<void>((resolve) => {
      frame.addEventListener('load', () => resolve(), { once: true });
    });
    frame.srcdoc =
      '<!doctype html><html><head>' +
      `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-drag-nonce'">` +
      '</head><body><div id="target">Target</div></body></html>';
    document.body.appendChild(frame);

    try {
      await loaded;
      const innerWindow = frame.contentWindow!;
      const innerDocument = frame.contentDocument!;
      const target = innerDocument.getElementById('target')!;

      dragCursor.lock(target, 'grabbing', { nonce: 'drag-nonce' });

      expect(innerDocument.head.querySelector('style')?.nonce).toBe('drag-nonce');
      expect(innerWindow.getComputedStyle(target).cursor).toBe('grabbing');
      dragCursor.unlock();
    } finally {
      frame.remove();
    }
  });

  it('does not create or activate its stylesheet when style elements are disabled', () => {
    const frame = document.createElement('iframe');
    document.body.appendChild(frame);
    try {
      const innerDoc = frame.contentDocument!;
      dragCursor.lock(innerDoc.body, 'grabbing', { disableStyleElements: true });

      expect(innerDoc.head.querySelector('style')).toBeNull();
      expect(innerDoc.documentElement).toHaveClass(DRAGGING_CLASS);
      expect(innerDoc.documentElement).not.toHaveClass(STYLE_CLASS);
      expect(innerDoc.documentElement.style.getPropertyValue(CURSOR_VAR)).toBe('grabbing');
      dragCursor.unlock();
    } finally {
      frame.remove();
    }
  });

  it('does not activate a previously injected internal rule for a disabled lock', () => {
    dragCursor.lock(document.body, 'grabbing');
    dragCursor.unlock();

    dragCursor.lock(document.body, 'grabbing', { disableStyleElements: true });
    expect(document.documentElement).toHaveClass(DRAGGING_CLASS);
    expect(document.documentElement).not.toHaveClass(STYLE_CLASS);
    dragCursor.unlock();
  });

  it('adds the dragging class and sets the cursor var on lock()', () => {
    dragCursor.lock(document.body, 'grabbing');
    expect(isDragging()).toBe(true);
    expect(activeCursorVar()).toBe('grabbing');
    dragCursor.unlock();
  });

  it('applies the cursor value it is given via the CSS var', () => {
    dragCursor.lock(document.body, 'move');
    expect(activeCursorVar()).toBe('move');
    dragCursor.unlock();
  });

  it('removes the class and clears the var on unlock()', () => {
    dragCursor.lock(document.body, 'grabbing');
    dragCursor.unlock();
    expect(isDragging()).toBe(false);
    expect(activeCursorVar()).toBe('');
  });

  it('restores a pre-existing inline --drag-cursor on unlock()', () => {
    document.documentElement.style.setProperty(CURSOR_VAR, 'copy');
    try {
      dragCursor.lock(document.body, 'grabbing');
      expect(activeCursorVar()).toBe('grabbing');

      dragCursor.unlock();
      // A consumer theming the default cursor via the variable keeps its value.
      expect(activeCursorVar()).toBe('copy');
    } finally {
      document.documentElement.style.removeProperty(CURSOR_VAR);
    }
  });

  it('preserves pre-existing root classes on unlock()', () => {
    document.documentElement.classList.add(DRAGGING_CLASS, STYLE_CLASS);
    try {
      dragCursor.lock(document.body, 'grabbing');
      dragCursor.unlock();
      expect(document.documentElement).toHaveClass(DRAGGING_CLASS, STYLE_CLASS);
    } finally {
      document.documentElement.classList.remove(DRAGGING_CLASS, STYLE_CLASS);
    }
  });

  it('does not re-inject the scoped rule across locks', () => {
    dragCursor.lock(document.body, 'grabbing');
    dragCursor.unlock();
    dragCursor.lock(document.body, 'move');
    expect(cursorStyleCount()).toBe(1);
    dragCursor.unlock();
  });

  it('nested locks share one activation and only unlock at depth 0', () => {
    dragCursor.lock(document.body, 'grabbing');
    dragCursor.lock(document.body, 'grabbing');
    expect(isDragging()).toBe(true);

    dragCursor.unlock();
    expect(isDragging()).toBe(true);

    dragCursor.unlock();
    expect(isDragging()).toBe(false);
  });

  it('only the first lock mutates the document root', () => {
    dragCursor.lock(document.body, 'grabbing');
    // A nested lock with a different cursor must not override the first.
    dragCursor.lock(document.body, 'move');
    expect(activeCursorVar()).toBe('grabbing');
    dragCursor.unlock();
    dragCursor.unlock();
  });

  it('unlock() without a matching lock() is a no-op', () => {
    expect(() => dragCursor.unlock()).not.toThrow();
    expect(isDragging()).toBe(false);
  });

  it("locks the source's own document when it lives in an iframe", () => {
    // The class, the variable and the scoped rule must all land on the iframe's
    // own root — the outer document's stylesheet cannot style a frame's content,
    // so locking the outer root would leave the dragged frame's cursor unchanged.
    const frame = document.createElement('iframe');
    document.body.appendChild(frame);
    try {
      const innerDoc = frame.contentDocument!;
      dragCursor.lock(innerDoc.body, 'grabbing');

      const innerRoot = innerDoc.documentElement;
      expect(innerRoot.classList.contains(DRAGGING_CLASS)).toBe(true);
      expect(innerRoot.style.getPropertyValue(CURSOR_VAR)).toBe('grabbing');
      expect(
        Array.from(innerDoc.head.querySelectorAll('style')).some((style) =>
          styleRuleText(style).includes('cursor:'),
        ),
      ).toBe(true);
      // The outer document is untouched.
      expect(isDragging()).toBe(false);
      expect(activeCursorVar()).toBe('');

      dragCursor.unlock();
      expect(innerRoot.classList.contains(DRAGGING_CLASS)).toBe(false);
      expect(innerRoot.style.getPropertyValue(CURSOR_VAR)).toBe('');
    } finally {
      frame.remove();
    }
  });
});
