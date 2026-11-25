import { describe, expect, it } from 'vitest';
import {
  getFirstNavigableItem,
  getLastNavigableItem,
  getNextNavigableItem,
  getPreviousNavigableItem,
} from '../../tree/store/treeNavigation';
import { getStopKeyIntent } from './getStopKeyIntent';
import type { StopKeyFacts } from './getStopKeyIntent';

interface Input extends Partial<StopKeyFacts> {
  key?: string | undefined;
  altKey?: boolean | undefined;
  ctrlKey?: boolean | undefined;
  metaKey?: boolean | undefined;
  shiftKey?: boolean | undefined;
  defaultPrevented?: boolean | undefined;
  isComposing?: boolean | undefined;
}

// The second of three stops, in a row of a single cell.
const BASE: StopKeyFacts = {
  isRtl: false,
  isCell: false,
  disabledFocusable: false,
  keys: {},
  keepsCaret: false,
  index: 1,
  count: 3,
  inColumn: false,
};

/** The intent of an ArrowRight, unless `input` says otherwise, on the stop described by `BASE`. */
function intentOf(input: Input) {
  const {
    key = 'ArrowRight',
    altKey = false,
    ctrlKey = false,
    metaKey = false,
    shiftKey = false,
    defaultPrevented = false,
    isComposing = false,
    ...facts
  } = input;
  return getStopKeyIntent(
    { key, altKey, ctrlKey, metaKey, shiftKey, defaultPrevented, nativeEvent: { isComposing } },
    { ...BASE, ...facts },
  );
}

describe('getStopKeyIntent', () => {
  it.each([
    { name: 'ArrowRight moves to the next stop', input: {}, intent: { type: 'stop', index: 2 } },
    {
      name: 'ArrowLeft moves to the previous stop',
      input: { key: 'ArrowLeft' },
      intent: { type: 'stop', index: 0 },
    },
    {
      name: 'ArrowLeft on the first stop returns to the row',
      input: { key: 'ArrowLeft', index: 0 },
      intent: { type: 'focus-row', stopPropagation: false },
    },
    {
      name: 'ArrowRight on the last stop stays',
      input: { index: 2 },
      intent: { type: 'none' },
    },
    {
      name: 'ArrowLeft moves forward in a right-to-left row',
      input: { key: 'ArrowLeft', isRtl: true },
      intent: { type: 'stop', index: 2 },
    },
    {
      name: 'ArrowRight from an element that is no stop moves to the first stop',
      input: { index: -1 },
      intent: { type: 'stop', index: 0 },
    },
    {
      name: 'a control that keeps the horizontal arrows keeps them',
      input: { keys: { horizontal: 'control' } },
      intent: { type: 'control' },
    },
    {
      name: 'a text field keeps an arrow that moves its caret',
      input: { keepsCaret: true },
      intent: { type: 'control' },
    },
  ] as const)('$name', ({ input, intent }) => {
    expect(intentOf(input)).toEqual(intent);
  });

  it.each([
    {
      name: 'ArrowDown in a row of a single cell goes to the row',
      input: { key: 'ArrowDown' },
      intent: { type: 'row' },
    },
    {
      name: 'ArrowDown in a row of several cells stays in the column',
      input: { key: 'ArrowDown', inColumn: true },
      intent: { type: 'column', row: getNextNavigableItem },
    },
    {
      name: 'ArrowUp in a row of several cells stays in the column',
      input: { key: 'ArrowUp', inColumn: true },
      intent: { type: 'column', row: getPreviousNavigableItem },
    },
    {
      name: 'a control that keeps the vertical arrows keeps them',
      input: { key: 'ArrowDown', inColumn: true, keys: { vertical: 'control' } },
      intent: { type: 'control' },
    },
  ] as const)('$name', ({ input, intent }) => {
    expect(intentOf(input)).toEqual(intent);
  });

  it.each([
    {
      name: 'Home moves to the first stop',
      input: { key: 'Home' },
      intent: { type: 'stop', index: 0 },
    },
    {
      name: 'End moves to the last stop',
      input: { key: 'End' },
      intent: { type: 'stop', index: 2 },
    },
    {
      name: 'Home in a row without stops returns to the row',
      input: { key: 'Home', count: 0, index: -1 },
      intent: { type: 'focus-row', stopPropagation: false },
    },
    {
      name: 'Ctrl+Home in a row of several cells moves to the first row of the column',
      input: { key: 'Home', ctrlKey: true, inColumn: true },
      intent: { type: 'column', row: getFirstNavigableItem },
    },
    {
      name: 'Cmd+End in a row of several cells moves to the last row of the column',
      input: { key: 'End', metaKey: true, inColumn: true },
      intent: { type: 'column', row: getLastNavigableItem },
    },
    {
      name: 'Ctrl+Home in a row of a single cell stays with the control',
      input: { key: 'Home', ctrlKey: true },
      intent: { type: 'control' },
    },
    {
      name: 'Ctrl+Shift+Home stays with the control',
      input: { key: 'Home', ctrlKey: true, shiftKey: true, inColumn: true },
      intent: { type: 'control' },
    },
    {
      name: 'a control that keeps Home and End keeps Ctrl+Home too',
      input: { key: 'Home', ctrlKey: true, inColumn: true, keys: { homeEnd: 'control' } },
      intent: { type: 'control' },
    },
  ] as const)('$name', ({ input, intent }) => {
    expect(intentOf(input)).toEqual(intent);
  });

  it.each([
    {
      name: 'Escape returns to the row and stops there',
      input: { key: 'Escape' },
      intent: { type: 'focus-row', stopPropagation: true },
    },
    {
      name: 'a control that keeps Escape keeps it',
      input: { key: 'Escape', keys: { escape: 'control' } },
      intent: { type: 'control' },
    },
    {
      name: 'Space on a cell goes to the row',
      input: { key: ' ', isCell: true },
      intent: { type: 'row' },
    },
    {
      name: 'Shift+Space on a cell stays with the browser',
      input: { key: ' ', isCell: true, shiftKey: true },
      intent: { type: 'control' },
    },
    { name: 'Space on a control stays with it', input: { key: ' ' }, intent: { type: 'control' } },
    {
      name: 'a printable key stays with the control',
      input: { key: 'a' },
      intent: { type: 'control' },
    },
    {
      name: 'a modified arrow stays with the control',
      input: { altKey: true },
      intent: { type: 'control' },
    },
    {
      name: 'a key that composes text stays with the control',
      input: { isComposing: true },
      intent: { type: 'control' },
    },
    {
      name: 'a key the control prevented stays with it',
      input: { defaultPrevented: true },
      intent: { type: 'control' },
    },
    {
      name: 'a disabled control that stays focusable still navigates',
      input: { defaultPrevented: true, disabledFocusable: true },
      intent: { type: 'stop', index: 2 },
    },
  ] as const)('$name', ({ input, intent }) => {
    expect(intentOf(input)).toEqual(intent);
  });
});
