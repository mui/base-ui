import { expect, describe, it } from 'vitest';
import type * as React from 'react';
import { getMenuFilterKeyAction, type MenuFilterKeyAction } from './useMenuFilterKeyDown';

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
    ['Space', key(' '), true, false, 'edit'],
    ['Shift+ArrowDown', key('ArrowDown', { shiftKey: true }), true, true, 'edit'],
    ['Ctrl+ArrowLeft', key('ArrowLeft', { ctrlKey: true }), true, true, 'edit'],
    ['Shift+Escape', key('Escape', { shiftKey: true }), true, true, 'navigate'],
    ['ArrowDown', key('ArrowDown'), false, true, 'navigate'],
    ['Home without a highlight', key('Home'), false, false, 'edit'],
    ['Home on a highlight', key('Home'), true, true, 'navigate'],
    ['ArrowRight on a highlight', key('ArrowRight'), true, true, 'submenu'],
    ['ArrowLeft on a highlight', key('ArrowLeft'), true, false, 'submenu'],
    ['ArrowLeft in a non-empty input', key('ArrowLeft'), false, true, 'edit'],
    ['ArrowLeft in an empty input', key('ArrowLeft'), false, false, 'navigate'],
    ['Escape', key('Escape'), true, true, 'navigate'],
  ])('vertical: %s', (_, event, hasActiveItem, hasValue, expected) => {
    expect(getMenuFilterKeyAction(event, 'vertical', false, hasActiveItem, hasValue)).toBe(
      expected,
    );
  });

  it.each<[string, React.KeyboardEvent, boolean, boolean, MenuFilterKeyAction]>([
    ['ArrowDown without a highlight', key('ArrowDown'), false, true, 'enter-list'],
    ['ArrowUp without a highlight', key('ArrowUp'), false, false, 'enter-list'],
    ['ArrowDown on a highlight', key('ArrowDown'), true, true, 'submenu'],
    ['ArrowRight in a non-empty input', key('ArrowRight'), false, true, 'edit'],
    ['ArrowRight in an empty input', key('ArrowRight'), false, false, 'navigate'],
    ['ArrowRight on a highlight', key('ArrowRight'), true, true, 'navigate'],
  ])('horizontal: %s', (_, event, hasActiveItem, hasValue, expected) => {
    expect(getMenuFilterKeyAction(event, 'horizontal', false, hasActiveItem, hasValue)).toBe(
      expected,
    );
  });
});
