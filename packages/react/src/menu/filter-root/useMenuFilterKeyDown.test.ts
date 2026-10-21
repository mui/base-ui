import { expect, describe, it } from 'vitest';
import type * as React from 'react';
import { getMenuFilterKeyAction } from './useMenuFilterKeyDown';
import type { MenuFilterKeyAction } from './useMenuFilterKeyDown';

function key(value: string, init: Partial<React.KeyboardEvent> = {}) {
  return {
    key: value,
    which: 0,
    shiftKey: false,
    ctrlKey: false,
    altKey: false,
    metaKey: false,
    ...init,
  } as React.KeyboardEvent;
}

describe('getMenuFilterKeyAction', () => {
  it.each<[string, React.KeyboardEvent, boolean, boolean, MenuFilterKeyAction]>([
    ['IME composition', key('Enter', { which: 229 }), true, true, 'ignore'],
    ['Tab', key('Tab'), true, false, 'ignore'],
    ['Shift+Tab', key('Tab', { shiftKey: true }), false, false, 'close'],
    ['Enter on a highlight', key('Enter'), true, false, 'activate'],
    ['Enter without a highlight', key('Enter'), false, true, 'navigate'],
    ['a character', key('a'), true, false, 'edit'],
    ['Space on a highlight in an empty input', key(' '), true, false, 'item'],
    ['Space on a highlight with text', key(' '), true, true, 'edit'],
    ['Space without a highlight', key(' '), false, false, 'navigate'],
    ['Shift+Space on a highlight', key(' ', { shiftKey: true }), true, false, 'edit'],
    ['composing Space on a highlight', key(' ', { which: 229 }), true, false, 'ignore'],
    ['Shift+ArrowDown', key('ArrowDown', { shiftKey: true }), true, true, 'edit'],
    ['Ctrl+ArrowLeft', key('ArrowLeft', { ctrlKey: true }), true, true, 'edit'],
    ['Shift+Escape', key('Escape', { shiftKey: true }), true, true, 'navigate'],
    ['ArrowDown', key('ArrowDown'), false, true, 'navigate'],
    ['Home without a highlight', key('Home'), false, false, 'edit'],
    ['Home on a highlight in an empty input', key('Home'), true, false, 'navigate'],
    ['Home on a highlight in a non-empty input', key('Home'), true, true, 'edit'],
    ['ArrowRight on a submenu trigger', key('ArrowRight'), true, true, 'edit'],
    ['ArrowLeft on a submenu trigger', key('ArrowLeft'), true, false, 'item'],
    ['ArrowRight on an item in a non-empty input', key('ArrowRight'), true, true, 'edit'],
    ['ArrowLeft on an item in an empty input', key('ArrowLeft'), true, false, 'item'],
    ['ArrowLeft in a non-empty input', key('ArrowLeft'), false, true, 'edit'],
    ['ArrowLeft in an empty input', key('ArrowLeft'), false, false, 'navigate'],
    ['Escape', key('Escape'), true, true, 'navigate'],
  ])('vertical: %s', (_, event, hasActiveItem, hasValue, expected) => {
    expect(
      getMenuFilterKeyAction(event, {
        orientation: 'vertical',
        hasActiveItem,
        hasValue,
        isCaretAtBoundary: false,
      }),
    ).toBe(expected);
  });

  it.each<[string, React.KeyboardEvent, boolean, boolean, MenuFilterKeyAction]>([
    ['ArrowDown without a highlight', key('ArrowDown'), false, true, 'enter-list'],
    ['ArrowUp without a highlight', key('ArrowUp'), false, false, 'enter-list'],
    ['ArrowDown on a submenu trigger', key('ArrowDown'), true, true, 'item'],
    ['ArrowDown on an item in a non-empty input', key('ArrowDown'), true, true, 'item'],
    ['ArrowRight in a non-empty input', key('ArrowRight'), false, true, 'edit'],
    ['ArrowRight in an empty input', key('ArrowRight'), false, false, 'navigate'],
    ['ArrowRight on a highlight', key('ArrowRight'), true, true, 'edit'],
  ])('horizontal: %s', (_, event, hasActiveItem, hasValue, expected) => {
    expect(
      getMenuFilterKeyAction(event, {
        orientation: 'horizontal',
        hasActiveItem,
        hasValue,
        isCaretAtBoundary: false,
      }),
    ).toBe(expected);
  });
});
