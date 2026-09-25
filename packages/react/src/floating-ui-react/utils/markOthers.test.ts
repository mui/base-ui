import { expect, afterEach, test } from 'vitest';
import { markOthers } from './markOthers';

afterEach(() => {
  document.body.innerHTML = '';
});

test('single call', () => {
  const other = document.createElement('div');
  document.body.appendChild(other);
  const target = document.createElement('div');
  document.body.appendChild(target);

  const cleanup = markOthers([target], { ariaHidden: true });

  expect(other.getAttribute('aria-hidden')).toBe('true');

  cleanup();

  expect(other.getAttribute('aria-hidden')).toBe(null);
});

test('multiple calls', () => {
  const other = document.createElement('div');
  document.body.appendChild(other);
  const target = document.createElement('div');
  document.body.appendChild(target);

  const cleanup = markOthers([target], { ariaHidden: true });

  expect(other.getAttribute('aria-hidden')).toBe('true');

  const nextTarget = document.createElement('div');
  document.body.appendChild(nextTarget);

  const nextCleanup = markOthers([nextTarget], { ariaHidden: true });

  expect(target.getAttribute('aria-hidden')).toBe('true');
  expect(nextTarget.getAttribute('aria-hidden')).toBe(null);

  document.body.removeChild(nextTarget);

  nextCleanup();

  expect(target.getAttribute('aria-hidden')).toBe(null);
  expect(other.getAttribute('aria-hidden')).toBe('true');

  cleanup();

  expect(other.getAttribute('aria-hidden')).toBe(null);

  document.body.appendChild(nextTarget);
});

test('out of order cleanup', () => {
  const other = document.createElement('div');
  document.body.appendChild(other);
  const target = document.createElement('div');
  target.setAttribute('data-testid', '');
  document.body.appendChild(target);

  const cleanup = markOthers([target], { ariaHidden: true });

  expect(other.getAttribute('aria-hidden')).toBe('true');

  const nextTarget = document.createElement('div');
  document.body.appendChild(nextTarget);

  const nextCleanup = markOthers([nextTarget], { ariaHidden: true });

  expect(target.getAttribute('aria-hidden')).toBe('true');
  expect(nextTarget.getAttribute('aria-hidden')).toBe(null);

  cleanup();

  expect(nextTarget.getAttribute('aria-hidden')).toBe(null);
  expect(target.getAttribute('aria-hidden')).toBe('true');
  expect(other.getAttribute('aria-hidden')).toBe('true');

  nextCleanup();

  expect(nextTarget.getAttribute('aria-hidden')).toBe(null);
  expect(other.getAttribute('aria-hidden')).toBe(null);
  expect(target.getAttribute('aria-hidden')).toBe(null);
});

test('multiple cleanups with differing controlAttribute', () => {
  const other = document.createElement('div');
  document.body.appendChild(other);
  const target = document.createElement('div');
  target.setAttribute('data-testid', '1');
  document.body.appendChild(target);

  const cleanup = markOthers([target], { ariaHidden: true });

  expect(other.getAttribute('aria-hidden')).toBe('true');

  const target2 = document.createElement('div');
  target2.setAttribute('data-testid', '2');
  document.body.appendChild(target2);

  const cleanup2 = markOthers([target2]);

  expect(target.getAttribute('aria-hidden')).not.toBe('true');
  expect(target.getAttribute('data-base-ui-inert')).toBe('');

  cleanup();

  expect(other.getAttribute('aria-hidden')).toBe(null);

  cleanup2();

  expect(target.getAttribute('data-base-ui-inert')).toBe(null);
});

test('keeps aria-hidden until the last aria-hidden lock releases, alongside marker-only locks', () => {
  const other = document.createElement('div');
  document.body.appendChild(other);

  const A = document.createElement('div');
  document.body.appendChild(A);

  const B = document.createElement('div');
  document.body.appendChild(B);

  const C = document.createElement('div');
  document.body.appendChild(C);

  const cleanupA = markOthers([A], { ariaHidden: true });
  const cleanupB = markOthers([B], { ariaHidden: true });
  const cleanupC = markOthers([C]);

  expect(other.getAttribute('aria-hidden')).toBe('true');
  expect(other.getAttribute('data-base-ui-inert')).toBe('');

  cleanupC();

  expect(other.getAttribute('aria-hidden')).toBe('true');
  expect(other.getAttribute('data-base-ui-inert')).toBe('');

  cleanupB();

  expect(other.getAttribute('aria-hidden')).toBe('true');
  expect(other.getAttribute('data-base-ui-inert')).toBe('');

  cleanupA();

  expect(other.hasAttribute('aria-hidden')).toBe(false);
  expect(other.hasAttribute('data-base-ui-inert')).toBe(false);
});

test('preserves externally owned aria-hidden during overlapping aria-hidden locks', () => {
  const keep = document.createElement('div');
  const outside = document.createElement('div');
  outside.setAttribute('aria-hidden', 'true');
  document.body.append(keep, outside);

  let cleanupFirst: (() => void) | undefined;
  let cleanupSecond: (() => void) | undefined;

  try {
    cleanupFirst = markOthers([keep], { ariaHidden: true, mark: false });
    cleanupSecond = markOthers([keep], { ariaHidden: true, mark: false });

    expect(outside).toHaveAttribute('aria-hidden', 'true');

    cleanupFirst();
    cleanupFirst = undefined;

    expect(outside).toHaveAttribute('aria-hidden', 'true');

    cleanupSecond();
    cleanupSecond = undefined;

    expect(outside).toHaveAttribute('aria-hidden', 'true');
  } finally {
    cleanupSecond?.();
    cleanupFirst?.();
  }
});

test('does not let mark-only overlap disturb control cleanup bookkeeping', () => {
  const keep = document.createElement('div');
  const outside = document.createElement('div');
  document.body.append(keep, outside);

  let cleanupMarkOnly: (() => void) | undefined;
  let cleanupControlOnly: (() => void) | undefined;

  try {
    cleanupMarkOnly = markOthers([keep], { mark: true });
    cleanupControlOnly = markOthers([keep], { ariaHidden: true, mark: false });

    expect(outside).toHaveAttribute('data-base-ui-inert');
    expect(outside).toHaveAttribute('aria-hidden', 'true');

    cleanupMarkOnly();
    cleanupMarkOnly = undefined;

    expect(outside).not.toHaveAttribute('data-base-ui-inert');
    expect(outside).toHaveAttribute('aria-hidden', 'true');

    cleanupControlOnly();
    cleanupControlOnly = undefined;

    expect(outside).not.toHaveAttribute('data-base-ui-inert');
    expect(outside).not.toHaveAttribute('aria-hidden');
  } finally {
    cleanupControlOnly?.();
    cleanupMarkOnly?.();
  }
});

test('re-reads externally owned aria-hidden once every lock has released', () => {
  const keep = document.createElement('div');
  const outside = document.createElement('div');
  document.body.append(keep, outside);

  const cleanupFirst = markOthers([keep], { ariaHidden: true });
  expect(outside).toHaveAttribute('aria-hidden', 'true');
  cleanupFirst();
  expect(outside).not.toHaveAttribute('aria-hidden');

  outside.setAttribute('aria-hidden', 'true');
  const cleanupSecond = markOthers([keep], { ariaHidden: true });
  cleanupSecond();
  expect(outside).toHaveAttribute('aria-hidden', 'true');

  outside.removeAttribute('aria-hidden');
  const cleanupThird = markOthers([keep], { ariaHidden: true });
  expect(outside).toHaveAttribute('aria-hidden', 'true');
  cleanupThird();
  expect(outside).not.toHaveAttribute('aria-hidden');
});

test('re-reads externally owned aria-hidden while an unrelated lock stays held', () => {
  const keep = document.createElement('div');
  const outside = document.createElement('div');
  outside.setAttribute('aria-hidden', 'true');
  document.body.append(keep, outside);

  // Keeps the lock count above zero so the bookkeeping is never reset wholesale.
  const cleanupHeld = markOthers([keep, outside], { ariaHidden: true });

  try {
    const cleanupFirst = markOthers([keep], { ariaHidden: true });
    cleanupFirst();
    expect(outside).toHaveAttribute('aria-hidden', 'true');

    outside.removeAttribute('aria-hidden');
    const cleanupSecond = markOthers([keep], { ariaHidden: true });
    expect(outside).toHaveAttribute('aria-hidden', 'true');
    cleanupSecond();
    expect(outside).not.toHaveAttribute('aria-hidden');
  } finally {
    cleanupHeld();
  }
});

test('leaves live regions, their ancestors, and scripts exposed', () => {
  const keep = document.createElement('div');
  const liveRegion = document.createElement('div');
  liveRegion.setAttribute('aria-live', 'polite');
  const liveWrapper = document.createElement('div');
  const nestedLiveRegion = document.createElement('div');
  nestedLiveRegion.setAttribute('aria-live', 'assertive');
  const liveSibling = document.createElement('div');
  liveWrapper.append(nestedLiveRegion, liveSibling);
  const script = document.createElement('script');
  document.body.append(keep, liveRegion, liveWrapper, script);

  const cleanup = markOthers([keep], { ariaHidden: true, mark: false });

  expect(liveRegion).not.toHaveAttribute('aria-hidden');
  expect(liveWrapper).not.toHaveAttribute('aria-hidden');
  expect(nestedLiveRegion).not.toHaveAttribute('aria-hidden');
  expect(liveSibling).toHaveAttribute('aria-hidden', 'true');
  expect(script).not.toHaveAttribute('aria-hidden');

  cleanup();

  expect(liveSibling).not.toHaveAttribute('aria-hidden');
});

test('does not recurse infinitely with target inside anchor in shadow root', () => {
  const host = document.createElement('div');
  document.body.appendChild(host);

  const shadowRoot = host.attachShadow({ mode: 'open' });
  const anchor = document.createElement('a');
  anchor.href = 'https://floating-ui.com';

  const target = document.createElement('button');
  anchor.appendChild(target);
  shadowRoot.appendChild(anchor);

  const cleanup = markOthers([target], { ariaHidden: true });

  // The host contains the target, so it must not have been hidden.
  expect(host).not.toHaveAttribute('aria-hidden');

  cleanup();
});

test('uses shadow root host as avoid element when parent chain includes anchor', () => {
  const outside = document.createElement('div');
  document.body.appendChild(outside);

  const host = document.createElement('div');
  document.body.appendChild(host);

  const shadowRoot = host.attachShadow({ mode: 'open' });
  const anchor = document.createElement('a');
  anchor.href = 'https://floating-ui.com';

  const target = document.createElement('button');
  anchor.appendChild(target);
  shadowRoot.appendChild(anchor);

  const cleanup = markOthers([target], { ariaHidden: true });

  expect(outside.getAttribute('aria-hidden')).toBe('true');
  expect(host.getAttribute('aria-hidden')).toBe(null);

  cleanup();

  expect(outside.getAttribute('aria-hidden')).toBe(null);
});
