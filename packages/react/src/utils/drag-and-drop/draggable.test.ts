import { isJSDOM } from '#test-utils';
import { describe, expect, it } from 'vitest';
import { applyDraggableStaticSetup } from './draggable';

describe('draggable static setup', () => {
  it.skipIf(isJSDOM)('restores inline gesture style priorities', () => {
    const element = document.createElement('div');
    element.style.setProperty('user-select', 'text', 'important');
    const cleanup = applyDraggableStaticSetup({ element });
    expect(element.style.userSelect).toBe('none');
    cleanup();
    expect(element.style.userSelect).toBe('text');
    expect(element.style.getPropertyPriority('user-select')).toBe('important');
  });
});
