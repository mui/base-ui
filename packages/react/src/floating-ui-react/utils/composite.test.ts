import { afterEach, describe, it, expect } from 'vitest';
import type { ListStepOptions } from './composite';
import {
  getMaxListIndex,
  getMinListIndex,
  getNextListIndex,
  isElementVisible,
  isHiddenByStyles,
  isListIndexDisabled,
} from './composite';

afterEach(() => {
  document.body.innerHTML = '';
});

it('treats hidden visibility styles as hidden', () => {
  const hidden = document.createElement('div');
  const collapsed = document.createElement('div');
  const visible = document.createElement('div');

  hidden.style.visibility = 'hidden';
  collapsed.style.visibility = 'collapse';

  document.body.append(hidden, collapsed, visible);

  expect(isHiddenByStyles(getComputedStyle(hidden))).toBe(true);
  expect(isHiddenByStyles(getComputedStyle(collapsed))).toBe(true);
  expect(isHiddenByStyles(getComputedStyle(visible))).toBe(false);
});

it('uses CSS visibility fallbacks when checkVisibility is unavailable', () => {
  const visible = document.createElement('button');
  const displayHidden = document.createElement('button');
  const displayContents = document.createElement('button');
  const contentHidden = document.createElement('button');

  displayHidden.style.display = 'none';
  displayContents.style.display = 'contents';
  contentHidden.style.contentVisibility = 'hidden';
  Object.defineProperty(displayContents, 'checkVisibility', {
    configurable: true,
    value: undefined,
  });
  Object.defineProperty(contentHidden, 'checkVisibility', {
    configurable: true,
    value: undefined,
  });
  document.body.append(visible, displayHidden, displayContents, contentHidden);

  expect(isElementVisible(visible)).toBe(true);
  expect(isElementVisible(displayHidden)).toBe(false);
  expect(isElementVisible(displayContents)).toBe(false);
  expect(isElementVisible(contentHidden)).toBe(true);
});

it('always treats natively disabled elements as disabled, unlike aria-disabled ones', () => {
  const nativeDisabled = document.createElement('button');
  nativeDisabled.disabled = true;
  const ariaDisabled = document.createElement('button');
  ariaDisabled.setAttribute('aria-disabled', 'true');

  document.body.append(nativeDisabled, ariaDisabled);
  const list = [nativeDisabled, ariaDisabled];

  expect(isListIndexDisabled(list, 0)).toBe(true);
  expect(isListIndexDisabled(list, 1)).toBe(true);

  // An empty `disabledIndices` marks every item as enabled, but natively
  // disabled elements can never receive focus, so they stay disabled.
  expect(isListIndexDisabled(list, 0, [])).toBe(true);
  expect(isListIndexDisabled(list, 1, [])).toBe(false);

  expect(isListIndexDisabled(list, 0, () => false)).toBe(true);
  expect(isListIndexDisabled(list, 1, () => false)).toBe(false);
});

describe('getNextListIndex', () => {
  function items(count: number) {
    return Array.from({ length: count }, () =>
      document.body.appendChild(document.createElement('div')),
    );
  }

  const step = { loopFocus: true, allowEscape: false };

  function nextIndex(
    list: HTMLElement[],
    currentIndex: number,
    options: Omit<ListStepOptions, 'minIndex' | 'maxIndex'>,
  ) {
    const listRef = { current: list };
    return getNextListIndex(list, currentIndex, {
      ...options,
      minIndex: getMinListIndex(listRef, options.disabledIndices),
      maxIndex: getMaxListIndex(listRef, options.disabledIndices),
    });
  }

  it('steps to the adjacent index', () => {
    expect(nextIndex(items(3), 0, { ...step, decrement: false })).toEqual({
      index: 1,
      wrapped: false,
    });
    expect(nextIndex(items(3), 1, { ...step, decrement: true })).toEqual({
      index: 0,
      wrapped: false,
    });
  });

  it('wraps at either end when looping', () => {
    expect(nextIndex(items(3), 2, { ...step, decrement: false })).toEqual({
      index: 0,
      wrapped: true,
    });
    expect(nextIndex(items(3), 0, { ...step, decrement: true })).toEqual({
      index: 2,
      wrapped: true,
    });
  });

  it('stays at either end without looping', () => {
    const options = { loopFocus: false, allowEscape: false };
    expect(nextIndex(items(3), 2, { ...options, decrement: false }).index).toBe(2);
    expect(nextIndex(items(3), 0, { ...options, decrement: true }).index).toBe(0);
  });

  it('leaves the list at either end when escaping is allowed', () => {
    const options = { loopFocus: true, allowEscape: true };
    expect(nextIndex(items(3), 2, { ...options, decrement: false }).index).toBe(-1);
    expect(nextIndex(items(3), 0, { ...options, decrement: true }).index).toBe(-1);
  });

  it('enters the list at the far end from outside it', () => {
    const options = { loopFocus: true, allowEscape: true };
    expect(nextIndex(items(3), -1, { ...options, decrement: false }).index).toBe(0);
    expect(nextIndex(items(3), -1, { ...options, decrement: true }).index).toBe(2);
  });

  it('skips disabled indices', () => {
    expect(
      nextIndex(items(4), 0, { ...step, decrement: false, disabledIndices: [1, 2] }).index,
    ).toBe(3);
  });
});
