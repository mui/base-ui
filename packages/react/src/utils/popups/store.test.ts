import { describe, expect, it } from 'vitest';
import {
  createInitialPopupStoreState,
  popupStoreSelectors,
  triggerPayloadSelector,
  type PopupStoreState,
} from './store';

function createState(state: Partial<PopupStoreState<unknown>>) {
  return {
    ...createInitialPopupStoreState(),
    activeTriggerId: 'trigger',
    ...state,
  };
}

describe('triggerPayloadSelector', () => {
  it('hides payload while open without an active trigger', () => {
    expect(
      triggerPayloadSelector(
        createState({
          activeTriggerId: null,
          mounted: true,
          open: true,
          payload: 1,
        }),
      ),
    ).toBe(undefined);
  });

  it('preserves payload while a closed popup remains mounted for exit', () => {
    expect(
      triggerPayloadSelector(
        createState({
          activeTriggerId: null,
          mounted: true,
          open: false,
          payload: 1,
        }),
      ),
    ).toBe(1);
  });

  it('hides unowned payload after the popup unmounts', () => {
    expect(
      triggerPayloadSelector(
        createState({
          activeTriggerId: null,
          mounted: false,
          open: false,
          payload: 1,
        }),
      ),
    ).toBe(undefined);
  });

  it('exposes payload owned by an active trigger', () => {
    expect(
      triggerPayloadSelector(
        createState({
          mounted: true,
          open: true,
          payload: 1,
        }),
      ),
    ).toBe(1);
  });
});

describe('popupStoreSelectors', () => {
  it('returns raw payload for handle-backed popups without a trigger', () => {
    expect(
      popupStoreSelectors.payload(
        createState({
          activeTriggerId: null,
          mounted: true,
          open: true,
          payload: 1,
        }),
      ),
    ).toBe(1);
  });

  describe('isOpenedByTrigger', () => {
    it('uses the controlled open state when present', () => {
      expect(
        popupStoreSelectors.isOpenedByTrigger(
          createState({
            open: false,
            openProp: true,
          }),
          'trigger',
        ),
      ).toBe(true);

      expect(
        popupStoreSelectors.isOpenedByTrigger(
          createState({
            open: true,
            openProp: false,
          }),
          'trigger',
        ),
      ).toBe(false);
    });

    it('uses the internal open state when uncontrolled', () => {
      expect(
        popupStoreSelectors.isOpenedByTrigger(
          createState({
            open: true,
          }),
          'trigger',
        ),
      ).toBe(true);

      expect(
        popupStoreSelectors.isOpenedByTrigger(
          createState({
            open: false,
          }),
          'trigger',
        ),
      ).toBe(false);
    });

    it('requires the trigger to be active', () => {
      expect(
        popupStoreSelectors.isOpenedByTrigger(
          createState({
            open: false,
            openProp: true,
          }),
          'other-trigger',
        ),
      ).toBe(false);
    });
  });
});
