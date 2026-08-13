import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import * as dragRootLock from './dragRootLock';

const LOCKED_STYLES = [
  'touchAction',
  'userSelect',
  'webkitUserSelect',
  'webkitTouchCallout',
  'overscrollBehavior',
] as const;

function snapshotStyles(el: HTMLElement): Record<string, string> {
  const saved: Record<string, string> = {};
  for (const prop of LOCKED_STYLES) {
    saved[prop] = ((el.style as any)[prop] as string) ?? '';
  }
  return saved;
}

function restoreStyles(el: HTMLElement, saved: Record<string, string>): void {
  for (const prop of LOCKED_STYLES) {
    (el.style as any)[prop] = saved[prop];
  }
}

describe('dragRootLock', () => {
  let originals: { html: Record<string, string>; body: Record<string, string> };

  beforeEach(() => {
    originals = {
      html: snapshotStyles(document.documentElement),
      body: snapshotStyles(document.body),
    };
  });

  afterEach(() => {
    dragRootLock.resetForTests();
    // Restore `<html>` *and* `<body>` independently of `resetForTests`: the lock
    // writes to both, so a regression in the module's own restore path must fail
    // its test rather than leak body styles into every later one.
    restoreStyles(document.documentElement, originals.html);
    restoreStyles(document.body, originals.body);
  });

  it('applies the full lock on first lock() call', () => {
    dragRootLock.lock(document.body);
    const root = document.documentElement;
    expect(root.style.touchAction).toBe('none');
    expect(root.style.userSelect).toBe('none');
    expect((root.style as any).webkitUserSelect).toBe('none');
    expect((root.style as any).webkitTouchCallout).toBe('none');
    expect(root.style.overscrollBehavior).toBe('none');
    dragRootLock.unlock();
  });

  it('restores previous values on unlock()', () => {
    const root = document.documentElement;
    root.style.touchAction = 'pan-y';
    root.style.userSelect = 'text';

    dragRootLock.lock(document.body);
    expect(root.style.touchAction).toBe('none');
    dragRootLock.unlock();

    expect(root.style.touchAction).toBe('pan-y');
    expect(root.style.userSelect).toBe('text');
  });

  it('nested locks share a single snapshot and only unlock at depth 0', () => {
    const root = document.documentElement;
    root.style.touchAction = 'pan-x';

    dragRootLock.lock(document.body);
    dragRootLock.lock(document.body);
    expect(root.style.touchAction).toBe('none');

    dragRootLock.unlock();
    expect(root.style.touchAction).toBe('none');

    dragRootLock.unlock();
    expect(root.style.touchAction).toBe('pan-x');
  });

  it('locks and restores <html> and <body> of the source and every ancestor document', () => {
    // iOS Safari and some Android browsers honour `touch-action` on `body`
    // independently of `html`, and an iframe drag can still scroll its host page,
    // so the lock covers all four roots — asserting only the source's `<html>`
    // would stay green while touch dragging in a frame kept scrolling.
    const frame = document.createElement('iframe');
    document.body.appendChild(frame);
    const innerDoc = frame.contentDocument!;
    const roots = [
      innerDoc.documentElement,
      innerDoc.body,
      document.documentElement,
      document.body,
    ];
    const before = roots.map((root) => root.style.touchAction);
    innerDoc.documentElement.style.touchAction = 'pan-y';

    try {
      dragRootLock.lock(innerDoc.body);
      for (const root of roots) {
        expect(root.style.touchAction).toBe('none');
        expect(root.style.userSelect).toBe('none');
        expect(root.style.overscrollBehavior).toBe('none');
      }

      dragRootLock.unlock();
      expect(innerDoc.documentElement.style.touchAction).toBe('pan-y');
      for (let i = 1; i < roots.length; i += 1) {
        expect(roots[i].style.touchAction).toBe(before[i]);
      }
    } finally {
      frame.remove();
    }
  });

  it('still locks the inner document when the ancestor is cross-origin', () => {
    const frame = document.createElement('iframe');
    document.body.appendChild(frame);
    try {
      const innerDoc = frame.contentDocument!;
      // A cross-origin ancestor throws a `SecurityError` on `frameElement`
      // access; the climb must treat that as the top of the reachable chain
      // rather than letting the throw abort the whole lock.
      Object.defineProperty(frame.contentWindow!, 'frameElement', {
        configurable: true,
        get() {
          throw new DOMException(
            'Blocked a frame from accessing a cross-origin frame.',
            'SecurityError',
          );
        },
      });

      dragRootLock.lock(innerDoc.body);

      expect(innerDoc.documentElement.style.touchAction).toBe('none');
      expect(innerDoc.body.style.touchAction).toBe('none');
      // The outer document is unreachable, so its roots stay untouched.
      expect(document.documentElement.style.touchAction).toBe(originals.html.touchAction);
      expect(document.body.style.touchAction).toBe(originals.body.touchAction);

      dragRootLock.unlock();
      expect(innerDoc.documentElement.style.getPropertyValue('touch-action')).toBe('');
      expect(innerDoc.body.style.getPropertyValue('touch-action')).toBe('');
    } finally {
      frame.remove();
    }
  });

  it('unlock() without a matching lock() is a no-op', () => {
    dragRootLock.unlock();
    expect(document.documentElement.style.touchAction).toBe(originals.html.touchAction);
  });

  it('resetForTests() restores the inline styles the lock wrote', () => {
    const root = document.documentElement;
    root.style.touchAction = 'pan-y';
    root.style.userSelect = 'text';

    dragRootLock.lock(document.body);
    expect(root.style.touchAction).toBe('none');

    dragRootLock.resetForTests();

    expect(root.style.touchAction).toBe('pan-y');
    expect(root.style.userSelect).toBe('text');
  });
});
