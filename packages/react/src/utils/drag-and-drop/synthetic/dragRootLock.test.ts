import { isJSDOM } from '#test-utils';
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
    dragRootLock.unlock();
    // Restore without relying on `unlock`, so a bug in its restore path fails this
    // test instead of leaking styles into later ones.
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

  it('keeps an inline style the page changed while the lock was held', () => {
    const root = document.documentElement;
    root.style.touchAction = 'pan-y';
    root.style.overscrollBehavior = 'contain';

    dragRootLock.lock(document.body);
    // The page takes over this property mid-drag. Restoring the value saved at
    // lock time would overwrite it.
    root.style.touchAction = 'pinch-zoom';
    dragRootLock.unlock();

    expect(root.style.touchAction).toBe('pinch-zoom');
    expect(root.style.overscrollBehavior).toBe('contain');
  });

  it.skipIf(isJSDOM)('restores inline priorities after unlocking', () => {
    const root = document.documentElement;
    root.style.setProperty('user-select', 'text', 'important');
    dragRootLock.lock(document.body);
    dragRootLock.unlock();
    expect(root.style.getPropertyValue('user-select')).toBe('text');
    expect(root.style.getPropertyPriority('user-select')).toBe('important');
  });

  it('ignores a repeated lock while the single pointer session holds it', () => {
    const root = document.documentElement;
    root.style.touchAction = 'pan-x';

    dragRootLock.lock(document.body);
    dragRootLock.lock(document.body);
    expect(root.style.touchAction).toBe('none');

    dragRootLock.unlock();
    expect(root.style.touchAction).toBe('pan-x');

    expect(() => dragRootLock.unlock()).not.toThrow();
  });

  it('locks and restores <html> and <body> of the source and every ancestor document', () => {
    // iOS Safari and some Android browsers apply `touch-action` on `body`
    // independently of `html`, and an iframe drag can still scroll its host page,
    // so the lock covers all four roots.
    const frame = document.createElement('iframe');
    document.body.appendChild(frame);
    const innerDoc = frame.contentDocument!;
    const roots = [
      innerDoc.documentElement,
      innerDoc.body,
      document.documentElement,
      document.body,
    ];
    // jsdom doesn't implement `touchAction`, which reads `undefined` until it is
    // written. The lock restores such a property to an empty string.
    const before = roots.map((root) => root.style.touchAction ?? '');
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
      // access. The climb must stop there instead of letting the throw abort the
      // whole lock.
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
});
