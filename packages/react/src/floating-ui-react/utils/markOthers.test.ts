import { expect } from 'vitest';
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
