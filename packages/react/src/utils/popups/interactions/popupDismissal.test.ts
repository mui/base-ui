import { describe, expect, it } from 'vitest';
import type { InteractionType } from '@base-ui/utils/useEnhancedClickHandler';
import type { FloatingUIOpenChangeDetails } from '../../../internals/types';
import { REASONS } from '../../../internals/reasons';
import { createEventEmitter } from '../createEventEmitter';
import { createAttribute } from '../createAttribute';
import {
  createDismissSession,
  createFocusReturnSession,
  endPressSessionOnClose,
  getInteractionType,
  getModalOutsidePressEvent,
  getPopupDismissal,
  recordCloseForReturnFocus,
  resolveReturnFocusElement,
  returnFocusOnClose,
} from './popupDismissal';

function createStore() {
  const events = createEventEmitter();
  return { context: { events }, setOpen() {} } as unknown as Parameters<
    typeof getPopupDismissal
  >[0];
}

function createDetails(overrides: Partial<FloatingUIOpenChangeDetails> = {}) {
  return {
    open: false,
    reason: REASONS.none,
    nativeEvent: new KeyboardEvent('keydown'),
    nested: false,
    ...overrides,
  } as FloatingUIOpenChangeDetails;
}

describe('getPopupDismissal', () => {
  it('returns one dismissal per popup', () => {
    const store = createStore();

    expect(getPopupDismissal(store)).toBe(getPopupDismissal(store));
    expect(getPopupDismissal(store)).not.toBe(getPopupDismissal(createStore()));
  });
});

describe('session factories', () => {
  it('creates fresh sessions for each adapter instance', () => {
    const session = createDismissSession();
    session.sawPressWhileOpen = true;

    expect(createDismissSession().sawPressWhileOpen).toBe(false);
    expect(createFocusReturnSession()).toEqual({
      preventReturnFocus: false,
      pointerDownOutside: false,
      lastInteractionType: '',
      closeType: '',
      pendingReturnFocus: null,
    });
  });
});

describe('getModalOutsidePressEvent', () => {
  it('dismisses on a mouse press start only when trapping focus without a backdrop', () => {
    expect(getModalOutsidePressEvent('trap-focus')).toEqual({ mouse: 'sloppy', touch: 'sloppy' });
    expect(getModalOutsidePressEvent(true)).toEqual({ mouse: 'intentional', touch: 'sloppy' });
    expect(getModalOutsidePressEvent(false)).toEqual({ mouse: 'intentional', touch: 'sloppy' });
    expect(getModalOutsidePressEvent('trap-focus', true)).toBe('intentional');
  });
});

describe('endPressSessionOnClose', () => {
  it('ends the press session on a close but not on an open', () => {
    const session = createDismissSession();
    session.sawPressWhileOpen = true;

    endPressSessionOnClose(session, createDetails({ open: true }));
    expect(session.sawPressWhileOpen).toBe(true);

    endPressSessionOnClose(session, createDetails({ open: false }));
    expect(session.sawPressWhileOpen).toBe(false);
  });
});

describe('getInteractionType', () => {
  it('reads the interaction type from the event', () => {
    expect(getInteractionType(new KeyboardEvent('keydown'))).toBe('keyboard');
    expect(getInteractionType(new FocusEvent('focusout'), 'touch')).toBe('touch');
    expect(getInteractionType(new FocusEvent('focusout'))).toBe('keyboard');
    expect(getInteractionType(new PointerEvent('pointerdown', { pointerType: 'pen' }))).toBe('pen');
    expect(getInteractionType(new MouseEvent('click', { detail: 0 }))).toBe('keyboard');
    expect(getInteractionType(new MouseEvent('click', { detail: 1 }))).toBe('mouse');
  });
});

describe('recordCloseForReturnFocus', () => {
  it('records the close type from the closing event', () => {
    const session = createFocusReturnSession();

    recordCloseForReturnFocus(session, createDetails(), document);

    expect(session.closeType).toBe('keyboard');
  });

  it('suppresses the return after a focus guard close or a hover mouseleave close', () => {
    const guard = document.createElement('span');
    guard.setAttribute(createAttribute('focus-guard'), '');
    const guardSession = createFocusReturnSession();
    const hoverSession = createFocusReturnSession();

    recordCloseForReturnFocus(
      guardSession,
      createDetails({
        reason: REASONS.focusOut,
        nativeEvent: new FocusEvent('focusout'),
        triggerElement: guard,
      }),
      document,
    );
    recordCloseForReturnFocus(
      hoverSession,
      createDetails({ reason: REASONS.triggerHover, nativeEvent: new MouseEvent('mouseleave') }),
      document,
    );

    expect(guardSession.preventReturnFocus).toBe(true);
    expect(hoverSession.preventReturnFocus).toBe(true);
  });

  it('returns focus after a nested or virtual outside press, and otherwise only when preventScroll is supported', () => {
    const session = createFocusReturnSession();
    const pointerDown = new PointerEvent('pointerdown', { pointerType: 'mouse', detail: 1 });

    session.preventReturnFocus = true;
    recordCloseForReturnFocus(
      session,
      createDetails({ reason: REASONS.outsidePress, nativeEvent: pointerDown, nested: true }),
      document,
    );
    expect(session.preventReturnFocus).toBe(false);

    session.preventReturnFocus = true;
    recordCloseForReturnFocus(
      session,
      createDetails({ reason: REASONS.outsidePress, nativeEvent: new MouseEvent('click') }),
      document,
    );
    expect(session.preventReturnFocus).toBe(false);

    const unsupported = {
      createElement: () => ({ focus() {} }),
    } as unknown as Document;
    recordCloseForReturnFocus(
      session,
      createDetails({ reason: REASONS.outsidePress, nativeEvent: pointerDown }),
      unsupported,
    );
    expect(session.preventReturnFocus).toBe(true);

    const supported = {
      createElement: () => ({
        focus(options: FocusOptions) {
          return options.preventScroll;
        },
      }),
    } as unknown as Document;
    recordCloseForReturnFocus(
      session,
      createDetails({ reason: REASONS.outsidePress, nativeEvent: pointerDown }),
      supported,
    );
    expect(session.preventReturnFocus).toBe(false);
  });
});

describe('resolveReturnFocusElement', () => {
  function setup() {
    const trigger = document.createElement('button');
    const previous = document.createElement('button');
    const fallback = document.createElement('button');
    document.body.append(trigger, previous, fallback);
    return {
      trigger,
      previous,
      fallback,
      cleanup: () => {
        trigger.remove();
        previous.remove();
        fallback.remove();
      },
    };
  }

  it('prefers the last trigger, or the previous focus for a programmatic open', () => {
    const { trigger, previous, fallback, cleanup } = setup();
    const base = {
      returnFocus: true,
      closeType: '' as const,
      lastTrigger: trigger,
      elementFocusedBeforeOpen: previous,
      getPreviouslyFocusedElement: () => fallback,
    };

    expect(resolveReturnFocusElement({ ...base, preferPreviousFocus: false })).toBe(trigger);
    expect(resolveReturnFocusElement({ ...base, preferPreviousFocus: true })).toBe(previous);

    trigger.remove();
    previous.remove();
    expect(resolveReturnFocusElement({ ...base, preferPreviousFocus: false })).toBe(fallback);
    cleanup();
  });

  it('returns nothing when return focus is off, and an explicit target otherwise', () => {
    const { trigger, fallback, cleanup } = setup();
    const target = { current: fallback };
    const base = {
      closeType: 'mouse' as const,
      lastTrigger: trigger,
      elementFocusedBeforeOpen: null,
      preferPreviousFocus: false,
      getPreviouslyFocusedElement: () => null,
    };

    expect(resolveReturnFocusElement({ ...base, returnFocus: false })).toBe(null);
    expect(resolveReturnFocusElement({ ...base, returnFocus: () => undefined })).toBe(null);
    expect(resolveReturnFocusElement({ ...base, returnFocus: target })).toBe(fallback);
    expect(resolveReturnFocusElement({ ...base, returnFocus: { current: null } })).toBe(trigger);
    cleanup();
  });
});

describe('returnFocusOnClose', () => {
  function setup() {
    const returnElement = document.createElement('button');
    const elsewhere = document.createElement('button');
    document.body.append(returnElement, elsewhere);
    const session = createFocusReturnSession();
    const snapshot = {
      returnFocus: true,
      explicitReturnFocus: undefined,
      returnElement,
      activeElement: document.body as Element | null,
      body: document.body,
      isFocusInsideFloatingTree: false,
      closeType: '' as InteractionType,
    };
    return {
      session,
      snapshot,
      elsewhere,
      cleanup: () => {
        returnElement.remove();
        elsewhere.remove();
      },
    };
  }

  it('returns focus without scrolling, visibly after a keyboard close', () => {
    const { session, snapshot, cleanup } = setup();

    expect(returnFocusOnClose(session, { cancelled: false }, snapshot)).toEqual({
      element: snapshot.returnElement,
      options: { preventScroll: true },
    });

    expect(
      returnFocusOnClose(session, { cancelled: false }, { ...snapshot, closeType: 'keyboard' }),
    ).toEqual({
      element: snapshot.returnElement,
      options: { preventScroll: true, focusVisible: true },
    });
    cleanup();
  });

  it('does not return focus when suppressed, cancelled or turned off', () => {
    const { session, snapshot, cleanup } = setup();

    expect(returnFocusOnClose(session, { cancelled: true }, snapshot)).toBe(null);
    expect(
      returnFocusOnClose(session, { cancelled: false }, { ...snapshot, returnFocus: false }),
    ).toBe(null);
    session.preventReturnFocus = true;
    expect(returnFocusOnClose(session, { cancelled: false }, snapshot)).toBe(null);
    cleanup();
  });

  it('respects focus that moved outside the floating tree, unless the target is explicit', () => {
    const { session, snapshot, elsewhere, cleanup } = setup();
    const moved = { ...snapshot, activeElement: elsewhere };

    expect(returnFocusOnClose(session, { cancelled: false }, moved)).toBe(null);
    expect(
      returnFocusOnClose(
        session,
        { cancelled: false },
        { ...moved, isFocusInsideFloatingTree: true },
      ),
    ).not.toBe(null);
    expect(
      returnFocusOnClose(session, { cancelled: false }, { ...moved, explicitReturnFocus: true }),
    ).not.toBe(null);
    cleanup();
  });
});
