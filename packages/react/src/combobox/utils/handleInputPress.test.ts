import { expect, vi } from 'vitest';
import type * as React from 'react';
import { handleInputPress } from './handleInputPress';
import type { ComboboxStore } from '../store';

describe('handleInputPress', () => {
  it('handles an event whose target is not an Element', () => {
    const focus = vi.fn();
    const preventDefault = vi.fn();
    const currentTarget = document.createElement('div');
    const textNode = document.createTextNode('padding');
    const nativeEvent = { target: textNode } as unknown as MouseEvent;
    const event = {
      currentTarget,
      nativeEvent,
      preventDefault,
    } as unknown as React.MouseEvent<HTMLElement>;
    const store = {
      state: {
        inputRef: { current: { focus } },
        openOnInputClick: false,
      },
    } as unknown as ComboboxStore;

    handleInputPress(event, store, false, false);

    expect(preventDefault).toHaveBeenCalledOnce();
    expect(focus).toHaveBeenCalledOnce();
  });
});
