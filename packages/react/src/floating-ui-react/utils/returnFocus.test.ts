import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { InteractionType } from '@base-ui/utils/useEnhancedClickHandler';
import { REASONS } from '../../internals/reasons';
import type { FloatingFocusManagerProps } from '../components/FloatingFocusManager';
import {
  addPreviouslyFocusedElement,
  getCloseIntent,
  getReturnFocusAction,
  getReturnTarget,
  SETTLE_RELEASE,
  SETTLE_TASK,
} from './returnFocus';
import type { ReturnFocusSession } from './returnFocus';
import type { CloseRequest } from '../components/FloatingRootStore';

type ElementName =
  | 'trigger'
  | 'inside'
  | 'insideInput'
  | 'outside'
  | 'outsideInput'
  | 'final'
  | 'otherTrigger'
  | 'collapsedTrigger'
  | 'expandedText'
  | 'otherInside'
  | 'body';

let elements: Record<ElementName, HTMLElement>;

beforeEach(() => {
  document.body.innerHTML = `
    <div id="page">
      <button id="trigger">Trigger</button>
      <button id="outside">Outside</button>
      <input id="outsideInput" />
      <button id="final">Final focus</button>
      <button id="otherTrigger" aria-expanded="true">Other trigger</button>
      <button id="collapsedTrigger" aria-expanded="false">Collapsed trigger</button>
      <div aria-expanded="true"><span id="expandedText">Expanded container</span></div>
    </div>
    <div id="positioner">
      <div id="popup">
        <button id="inside">Inside</button>
        <input id="insideInput" />
      </div>
    </div>
    <div id="other" data-open>
      <button id="otherInside">Other inside</button>
    </div>
  `;
  const get = (id: string) => document.getElementById(id)!;
  elements = {
    trigger: get('trigger'),
    inside: get('inside'),
    insideInput: get('insideInput'),
    outside: get('outside'),
    outsideInput: get('outsideInput'),
    final: get('final'),
    otherTrigger: get('otherTrigger'),
    collapsedTrigger: get('collapsedTrigger'),
    expandedText: get('expandedText'),
    otherInside: get('otherInside'),
    body: document.body,
  };
});

afterEach(() => {
  document.body.innerHTML = '';
});

// A pressed mouse, so Chromium doesn't read it as a screen reader's virtual press.
const pointerdown = () =>
  new PointerEvent('pointerdown', { pointerType: 'mouse', pressure: 0.5, buttons: 1 });
const click = () => new PointerEvent('click', { pointerType: 'mouse', detail: 1 });
const escape = () => new KeyboardEvent('keydown', { key: 'Escape' });
const enter = () => new KeyboardEvent('keydown', { key: 'Enter' });
const focusout = () => new FocusEvent('focusout');
const mouseleave = () => new MouseEvent('mouseleave');
const touchend = () => new TouchEvent('touchend');

function request(
  reason: string,
  event: Event,
  extra?: { nested?: boolean; moved?: boolean; target?: ElementName },
) {
  if (extra?.target) {
    // Sets the event's target: the element an outside press landed on.
    elements[extra.target].dispatchEvent(event);
  }
  return {
    details: { open: false, reason, nativeEvent: event, nested: !!extra?.nested },
    moved: !!extra?.moved,
  } satisfies CloseRequest;
}

function createSession(overrides?: Partial<ReturnFocusSession>): ReturnFocusSession {
  return {
    reference: elements.trigger,
    before: elements.trigger,
    preferBefore: false,
    managed: true,
    parent: null,
    ...overrides,
  };
}

interface Row {
  name: string;
  request?: () => CloseRequest;
  /** A pointer was still pressed when the close committed. */
  pressed?: boolean;
  /** `focus({ preventScroll })` is unsupported (Chrome on Android). */
  noPreventScroll?: boolean;
  /** Where focus is when the return runs. Inside the popup unless stated. */
  focus?: ElementName;
  /** Whether focus was inside when the close committed. Defaults to where it is now. */
  ownedFocusAtClose?: boolean;
  /** `finalFocus`: an explicit ref to `final`, `false`, or the default. */
  returnFocus?: 'final' | false;
  /** The internal `explicitReturnFocus` override. */
  explicit?: boolean;
  /** A passive session: a hover-opened Popover. */
  passive?: boolean;
  /** The popup opened again before the return ran. */
  reopened?: boolean;
  webkit?: boolean;
  /** Another modal popup has hidden the page (the trigger) from assistive tech. */
  pageHidden?: boolean;
  settle?: typeof SETTLE_RELEASE | typeof SETTLE_TASK;
  expected: { focus: ElementName; focusVisible?: true } | { blur: ElementName } | null;
}

// plan-c's "Per close path" table. Each row is what the return job sees once the close has
// committed (and an outside press has settled).
const rows: Row[] = [
  // Escape, item presses, close buttons
  {
    name: 'Escape with focus inside',
    request: () => request(REASONS.escapeKey, escape()),
    expected: { focus: 'trigger', focusVisible: true },
  },
  {
    name: 'a mouse press on a close button',
    request: () => request(REASONS.closePress, click()),
    expected: { focus: 'trigger' },
  },
  {
    name: 'Enter on an item',
    request: () => request(REASONS.itemPress, enter()),
    expected: { focus: 'trigger', focusVisible: true },
  },
  {
    name: 'an item press with an explicit finalFocus',
    request: () => request(REASONS.itemPress, click()),
    returnFocus: 'final',
    expected: { focus: 'final' },
  },
  {
    name: 'a trigger toggle click (the trigger already has focus)',
    request: () => request(REASONS.triggerPress, click()),
    focus: 'trigger',
    expected: { focus: 'trigger' },
  },
  {
    name: 'a trigger toggle click with an explicit finalFocus',
    request: () => request(REASONS.triggerPress, click()),
    focus: 'trigger',
    returnFocus: 'final',
    expected: { focus: 'final' },
  },
  {
    name: 'a keyboard close that already moved focus to the trigger (Menu Shift+Tab)',
    request: () => request(REASONS.escapeKey, escape()),
    focus: 'trigger',
    expected: { focus: 'trigger', focusVisible: true },
  },

  // Outside presses settle before they're decided
  {
    name: 'a sloppy outside press on blank space, still pressed at the close',
    request: () => request(REASONS.outsidePress, pointerdown()),
    pressed: true,
    focus: 'body',
    ownedFocusAtClose: true,
    settle: SETTLE_RELEASE,
    expected: { focus: 'trigger' },
  },
  {
    name: 'a sloppy outside press on an input',
    request: () => request(REASONS.outsidePress, pointerdown()),
    pressed: true,
    focus: 'outsideInput',
    ownedFocusAtClose: true,
    settle: SETTLE_RELEASE,
    expected: null,
  },
  {
    name: 'a sloppy outside press on an input with an explicit finalFocus',
    request: () => request(REASONS.outsidePress, pointerdown()),
    pressed: true,
    focus: 'outsideInput',
    ownedFocusAtClose: true,
    returnFocus: 'final',
    settle: SETTLE_RELEASE,
    expected: { focus: 'final' },
  },
  {
    name: 'an outside press that opened another popup, which took focus, with an explicit finalFocus',
    request: () => request(REASONS.outsidePress, click(), { target: 'otherTrigger' }),
    focus: 'otherInside',
    ownedFocusAtClose: true,
    returnFocus: 'final',
    settle: SETTLE_TASK,
    expected: null,
  },
  {
    name: 'an outside press on an input while another popup stays open, with an explicit finalFocus',
    request: () => request(REASONS.outsidePress, pointerdown(), { target: 'outsideInput' }),
    pressed: true,
    focus: 'outsideInput',
    ownedFocusAtClose: true,
    returnFocus: 'final',
    settle: SETTLE_RELEASE,
    expected: { focus: 'final' },
  },
  {
    name: 'an outside press that opened another popup whose trigger still has focus',
    request: () => request(REASONS.outsidePress, pointerdown(), { target: 'otherTrigger' }),
    pressed: true,
    focus: 'otherTrigger',
    ownedFocusAtClose: true,
    returnFocus: 'final',
    settle: SETTLE_RELEASE,
    expected: null,
  },
  {
    name: 'an outside press into another popup that was already open, with an explicit finalFocus',
    request: () => request(REASONS.outsidePress, pointerdown(), { target: 'otherInside' }),
    pressed: true,
    focus: 'otherInside',
    ownedFocusAtClose: true,
    returnFocus: 'final',
    settle: SETTLE_RELEASE,
    expected: { focus: 'final' },
  },
  {
    name: 'a close that is not an outside press, with focus in a popup the press opened',
    request: () => request(REASONS.itemPress, click(), { target: 'otherTrigger' }),
    focus: 'otherInside',
    ownedFocusAtClose: true,
    returnFocus: 'final',
    expected: { focus: 'final' },
  },
  {
    name: 'an outside press on a plain button that opened another popup, which took focus',
    request: () => request(REASONS.outsidePress, pointerdown(), { target: 'outside' }),
    pressed: true,
    focus: 'otherInside',
    ownedFocusAtClose: true,
    returnFocus: 'final',
    settle: SETTLE_RELEASE,
    expected: null,
  },
  {
    name: 'an outside press on a collapsed control, with an explicit finalFocus',
    request: () => request(REASONS.outsidePress, pointerdown(), { target: 'collapsedTrigger' }),
    pressed: true,
    focus: 'collapsedTrigger',
    ownedFocusAtClose: true,
    returnFocus: 'final',
    settle: SETTLE_RELEASE,
    expected: { focus: 'final' },
  },
  {
    name: 'an outside press on text inside an expanded container, with an explicit finalFocus',
    request: () => request(REASONS.outsidePress, pointerdown(), { target: 'expandedText' }),
    pressed: true,
    focus: 'outside',
    ownedFocusAtClose: true,
    returnFocus: 'final',
    settle: SETTLE_RELEASE,
    expected: { focus: 'final' },
  },
  {
    name: 'an outside press on an expanded control that left focus on the body',
    request: () => request(REASONS.outsidePress, click(), { target: 'otherTrigger' }),
    focus: 'body',
    ownedFocusAtClose: false,
    settle: SETTLE_TASK,
    expected: { focus: 'trigger' },
  },
  {
    name: 'an outside press that opened another popup while focus is still in this popup',
    request: () => request(REASONS.outsidePress, pointerdown(), { target: 'otherTrigger' }),
    pressed: true,
    returnFocus: 'final',
    settle: SETTLE_RELEASE,
    expected: { focus: 'final' },
  },
  {
    name: 'a sloppy outside press released before the close committed',
    request: () => request(REASONS.outsidePress, pointerdown()),
    focus: 'body',
    ownedFocusAtClose: true,
    settle: SETTLE_TASK,
    expected: { focus: 'trigger' },
  },
  {
    name: 'an outside tap on blank space',
    request: () => request(REASONS.outsidePress, touchend()),
    focus: 'body',
    ownedFocusAtClose: true,
    settle: SETTLE_TASK,
    expected: { focus: 'trigger' },
  },
  {
    name: 'an outside tap on a button',
    request: () => request(REASONS.outsidePress, touchend()),
    focus: 'outside',
    ownedFocusAtClose: true,
    settle: SETTLE_TASK,
    expected: null,
  },
  {
    name: 'an intentional outside click on an input',
    request: () => request(REASONS.outsidePress, click()),
    focus: 'outsideInput',
    settle: SETTLE_TASK,
    expected: null,
  },
  {
    name: 'an outside press without preventScroll support (Android)',
    request: () => request(REASONS.outsidePress, pointerdown()),
    pressed: true,
    noPreventScroll: true,
    focus: 'body',
    ownedFocusAtClose: true,
    settle: SETTLE_RELEASE,
    expected: null,
  },
  {
    name: 'a nested outside press without preventScroll support',
    request: () => request(REASONS.outsidePress, pointerdown(), { nested: true }),
    pressed: true,
    noPreventScroll: true,
    focus: 'body',
    ownedFocusAtClose: true,
    settle: SETTLE_RELEASE,
    expected: { focus: 'trigger' },
  },
  {
    name: 'an outside press whose popup reopened while it settled',
    request: () => request(REASONS.outsidePress, pointerdown()),
    pressed: true,
    focus: 'body',
    ownedFocusAtClose: true,
    reopened: true,
    settle: SETTLE_RELEASE,
    expected: null,
  },

  // Focus moved away: the destination wins (#5733)
  {
    name: 'Tab out through a focus guard, with an explicit finalFocus',
    request: () => request(REASONS.focusOut, focusout()),
    focus: 'outside',
    returnFocus: 'final',
    expected: null,
  },
  {
    name: 'a focus-out that left focus unchanged (Field blur tests)',
    request: () => request(REASONS.focusOut, focusout()),
    expected: null,
  },
  {
    name: 'a focus-out after which focus genuinely came back inside',
    request: () => request(REASONS.focusOut, focusout(), { moved: true }),
    expected: { focus: 'trigger', focusVisible: true },
  },
  {
    name: 'a focus-out flushed synchronously by the consumer, with an explicit finalFocus',
    request: () => request(REASONS.focusOut, focusout()),
    focus: 'outside',
    ownedFocusAtClose: false,
    returnFocus: 'final',
    expected: null,
  },

  // Suppressed closes
  {
    // Also when the consumer defers it: the request lives until the close commits.
    name: 'a hover-leave with focus inside',
    request: () => request(REASONS.triggerHover, mouseleave()),
    expected: null,
  },
  {
    name: 'a hover-leave with an input focused inside, on WebKit',
    request: () => request(REASONS.triggerHover, mouseleave()),
    focus: 'insideInput',
    webkit: true,
    expected: { blur: 'insideInput' },
  },
  {
    name: 'a hover-leave with a button focused inside, on WebKit',
    request: () => request(REASONS.triggerHover, mouseleave()),
    webkit: true,
    expected: null,
  },
  {
    name: 'a sibling menu opened',
    request: () => request(REASONS.siblingOpen, pointerdown()),
    expected: null,
  },

  // No request: prop-driven, component-local, or invalidated by input
  {
    name: 'a prop-driven close with focus inside',
    expected: { focus: 'trigger' },
  },
  {
    name: 'a prop-driven close after focus moved elsewhere (#2607)',
    focus: 'outside',
    expected: null,
  },
  {
    name: 'a prop-driven close after focus moved elsewhere, with an explicit finalFocus (#5527)',
    focus: 'outside',
    returnFocus: 'final',
    expected: { focus: 'final' },
  },
  {
    name: 'a prop-driven close after focus was lost to the body',
    focus: 'body',
    expected: { focus: 'trigger' },
  },
  {
    name: 'a close with finalFocus={false}',
    request: () => request(REASONS.escapeKey, escape()),
    returnFocus: false,
    expected: null,
  },
  {
    name: 'a close with an internal (non-explicit) target after focus moved elsewhere',
    focus: 'outside',
    returnFocus: 'final',
    explicit: false,
    expected: null,
  },
  {
    name: 'a close with focus inside, on WebKit with an input focused',
    focus: 'insideInput',
    webkit: true,
    returnFocus: false,
    expected: { blur: 'insideInput' },
  },

  // Reopened in the close commit (`:1845`, `handle.open()` from a layout effect)
  {
    name: 'Escape, reopened before the return ran',
    request: () => request(REASONS.escapeKey, escape()),
    reopened: true,
    pageHidden: true,
    expected: { focus: 'trigger', focusVisible: true },
  },

  // Another modal popup opened in the same interaction (Menu item opening a Dialog)
  {
    name: 'an item press that opened a modal Dialog',
    request: () => request(REASONS.itemPress, click()),
    focus: 'body',
    ownedFocusAtClose: true,
    pageHidden: true,
    expected: null,
  },
  {
    name: 'an item press that opened a modal Dialog, with an explicit finalFocus',
    request: () => request(REASONS.itemPress, click()),
    focus: 'body',
    ownedFocusAtClose: true,
    pageHidden: true,
    returnFocus: 'final',
    expected: { focus: 'final' },
  },

  // Passive session: a hover-opened Popover
  {
    name: 'a passive session closed with Escape after focus moved inside',
    request: () => request(REASONS.escapeKey, escape()),
    passive: true,
    expected: { focus: 'trigger', focusVisible: true },
  },
  {
    name: 'a passive session unmounted in the close commit with focus inside',
    request: () => request(REASONS.closePress, click()),
    passive: true,
    focus: 'body',
    ownedFocusAtClose: true,
    expected: { focus: 'trigger' },
  },
  {
    name: 'a passive session with focus on the body that was not inside at the close',
    request: () => request(REASONS.escapeKey, escape()),
    passive: true,
    focus: 'body',
    ownedFocusAtClose: false,
    expected: null,
  },
];

describe('focus return decision', () => {
  it.each(rows)('$name', (row) => {
    const popup = document.getElementById('popup')!;
    if (row.pageHidden) {
      document.getElementById('page')!.setAttribute('aria-hidden', 'true');
    }
    const activeElement = elements[row.focus ?? 'inside'];
    const ownsFocus = popup.contains(activeElement);

    const intent = getCloseIntent(row.request?.(), '', !!row.pressed, () => !row.noPreventScroll);
    expect(intent?.settle).toBe(row.settle);

    let returnFocus: FloatingFocusManagerProps['returnFocus'] = true;
    if (row.returnFocus === 'final') {
      returnFocus = { current: elements.final };
    } else if (row.returnFocus === false) {
      returnFocus = false;
    }

    const action = getReturnFocusAction(
      createSession({ managed: !row.passive }),
      intent,
      returnFocus,
      row.explicit,
      activeElement,
      ownsFocus,
      row.ownedFocusAtClose ?? ownsFocus,
      !!row.reopened,
      !!row.webkit,
    );

    let expected: unknown = null;
    if (row.expected && 'focus' in row.expected) {
      expected = [
        elements[row.expected.focus],
        row.expected.focusVisible
          ? { preventScroll: true, focusVisible: true }
          : { preventScroll: true },
      ];
    } else if (row.expected) {
      expected = [elements[row.expected.blur]];
    }
    expect(action).toStrictEqual(expected);
  });
});

describe('close intent', () => {
  it.each<{ name: string; event: () => Event; interactionType: InteractionType; type: string }>([
    { name: 'a key', event: escape, interactionType: 'mouse', type: 'keyboard' },
    { name: 'a pointer press', event: pointerdown, interactionType: 'keyboard', type: 'mouse' },
    { name: 'a tap', event: touchend, interactionType: '', type: 'touch' },
    {
      name: 'a focus move after a press',
      event: focusout,
      interactionType: 'touch',
      type: 'touch',
    },
    {
      name: 'a focus move without a press',
      event: focusout,
      interactionType: '',
      type: 'keyboard',
    },
    {
      name: 'a programmatic close',
      event: () => new Event('base-ui'),
      interactionType: '',
      type: '',
    },
  ])('classifies $name as "$type"', ({ event, interactionType, type }) => {
    const intent = getCloseIntent(
      request(REASONS.none, event()),
      interactionType,
      false,
      () => true,
    );
    expect(intent?.type).toBe(type);
  });

  it('probes preventScroll support only for an outside press', () => {
    const preventScroll = vi.fn(() => true);
    getCloseIntent(request(REASONS.escapeKey, escape()), '', false, preventScroll);
    expect(preventScroll).not.toHaveBeenCalled();
  });
});

describe('return target', () => {
  function getTarget(
    session: Partial<ReturnFocusSession>,
    returnFocus: FloatingFocusManagerProps['returnFocus'] = true,
  ) {
    return getReturnTarget(createSession(session), returnFocus, 'keyboard');
  }

  // The trigger of a nested popup sits inside its closing parent.
  function closeParentOfTrigger() {
    const closingParent = document.createElement('div');
    closingParent.setAttribute('inert', '');
    closingParent.append(elements.trigger);
    document.body.append(closingParent);
  }

  it('is the reference', () => {
    expect(getTarget({ before: elements.outside })).toBe(elements.trigger);
  });

  it('is the element focused before a programmatic open', () => {
    expect(getTarget({ before: elements.outside, preferBefore: true })).toBe(elements.outside);
  });

  it('is the reference after a programmatic open from the body', () => {
    expect(getTarget({ before: document.body, preferBefore: true })).toBe(elements.trigger);
  });

  it('skips a reference inside a closing (inert) popup', () => {
    closeParentOfTrigger();
    expect(getTarget({ before: elements.outside })).toBe(elements.outside);
  });

  it('skips a disconnected reference', () => {
    elements.trigger.remove();
    expect(getTarget({ before: elements.outside })).toBe(elements.outside);
  });

  it('falls back to the closed ancestor’s target when its own are unusable', () => {
    closeParentOfTrigger();
    const parentLink = { current: () => elements.outside };
    expect(getTarget({ parent: parentLink })).toBe(elements.outside);
  });

  it('prefers the parent link over the focused-before history', () => {
    addPreviouslyFocusedElement(elements.final);
    closeParentOfTrigger();
    const parentLink = { current: () => elements.outside };
    expect(getTarget({ before: document.body, parent: parentLink })).toBe(elements.outside);
  });

  it('ignores the parent link while the parent is open', () => {
    addPreviouslyFocusedElement(elements.final);
    elements.trigger.remove();
    expect(getTarget({ before: document.body, parent: { current: null } })).toBe(elements.final);
  });

  it('falls back to the latest usable focused-before element without a parent link', () => {
    const older = document.createElement('button');
    const newer = document.createElement('button');
    document.body.append(older, newer);
    addPreviouslyFocusedElement(older);
    addPreviouslyFocusedElement(newer);
    newer.setAttribute('inert', '');
    elements.trigger.remove();
    expect(getTarget({ before: document.body })).toBe(older);
  });

  it('is an explicit element when it is usable', () => {
    expect(getTarget({}, { current: elements.final })).toBe(elements.final);
  });

  it('is the default when the explicit element is unusable', () => {
    elements.final.setAttribute('inert', '');
    expect(getTarget({}, { current: elements.final })).toBe(elements.trigger);
  });

  it('passes the close type to a function and uses its result', () => {
    const returnFocus = vi.fn(() => elements.final);
    expect(getTarget({}, returnFocus)).toBe(elements.final);
    expect(returnFocus).toHaveBeenCalledWith('keyboard');
  });

  it.each([
    { result: null, expected: 'trigger' },
    { result: true, expected: 'trigger' },
    { result: false, expected: null },
    { result: undefined, expected: null },
  ] as const)('treats a function returning $result as $expected', ({ result, expected }) => {
    expect(getTarget({}, () => result)).toBe(expected && elements[expected]);
  });

  it('is focused through its first tabbable descendant', () => {
    const wrapper = document.createElement('div');
    wrapper.append(elements.final);
    document.body.append(wrapper);
    const session = createSession({ reference: wrapper });
    const action = getReturnFocusAction(
      session,
      null,
      true,
      undefined,
      elements.inside,
      true,
      true,
      false,
      false,
    );
    expect(action).toStrictEqual([elements.final, { preventScroll: true }]);
  });
});
