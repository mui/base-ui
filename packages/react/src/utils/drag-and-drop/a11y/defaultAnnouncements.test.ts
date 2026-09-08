import { describe, it, expect } from 'vitest';
import { buildDefaultAnnouncements } from './defaultAnnouncements';
import { enUS } from '../../../locale-enUS';
import { createKind } from '../dragKind';
import type {
  DragInput,
  DropTargetRecord,
  DragKeyboardAnnouncementParameters,
} from '../../../types/drag';

function makeTarget(label?: string): DropTargetRecord {
  return {
    element: document.createElement('div'),
    label,
    kind: undefined,
    payload: undefined,
    getLocalPoint: () => ({ x: 0, y: 0 }),
    getSnappedLocalPoint: () => ({ x: 0, y: 0 }),
  };
}

function makeParameters(
  dropTargets: readonly DropTargetRecord[] = [],
): DragKeyboardAnnouncementParameters {
  const input: DragInput = {
    button: -1,
    buttons: 0,
    clientX: 0,
    clientY: 0,
    pageX: 0,
    pageY: 0,
    pointerType: 'mouse',
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    metaKey: false,
  };
  return {
    source: {
      element: document.createElement('div'),
      label: 'Card',
      kind: createKind('card').id,
      dragHandle: null,
      payload: undefined,
    },
    location: {
      initial: { input, dropTargets: [] },
      current: { input, dropTargets },
      previous: { input, dropTargets: [] },
    },
  };
}

describe('buildDefaultAnnouncements', () => {
  it('keeps moved silent with the stock locales (no position phrase)', () => {
    const announcements = buildDefaultAnnouncements(enUS);
    expect(announcements.moved(makeParameters())).toBeNull();
  });

  it('lets a locale overriding dragAnnouncementMoved announce plain moves', () => {
    const announcements = buildDefaultAnnouncements({
      ...enUS,
      dragAnnouncementMoved: ({ label }) => `Moved ${label}`,
    });
    expect(announcements.moved(makeParameters())).toBe('Moved Card');
  });

  it('names the hovered labeled target in moved', () => {
    const announcements = buildDefaultAnnouncements(enUS);
    expect(announcements.moved(makeParameters([makeTarget('To-do')]))).toBe('Card on To-do');
  });

  it('keeps moved silent when no hovered target declares a label', () => {
    const announcements = buildDefaultAnnouncements(enUS);
    // A target is hovered, but with no label there is nothing to name — the
    // stock locales render a null position phrase as silence.
    expect(announcements.moved(makeParameters([makeTarget()]))).toBeNull();
  });

  it('names the innermost labeled target, skipping an unlabeled inner target', () => {
    const announcements = buildDefaultAnnouncements(enUS);
    // The stack is innermost-first: an unlabeled slot sits under the cursor
    // inside a labeled list, and the list keeps being announced.
    const stack = [makeTarget(), makeTarget('Shopping list')];
    expect(announcements.moved(makeParameters(stack))).toBe('Card on Shopping list');
  });

  it('names the labeled target in dropped', () => {
    const announcements = buildDefaultAnnouncements(enUS);
    expect(announcements.dropped(makeParameters([makeTarget('To-do')]))).toBe(
      'Dropped Card on To-do.',
    );
  });

  it('falls back to the hasDropTarget wording when no target is labeled', () => {
    const announcements = buildDefaultAnnouncements(enUS);
    // An unlabeled target still received the drop; only the name is missing.
    expect(announcements.dropped(makeParameters([makeTarget()]))).toBe('Dropped Card.');
    // No target at all announces the miss.
    expect(announcements.dropped(makeParameters())).toBe('Dropped Card. No drop target.');
  });
});
