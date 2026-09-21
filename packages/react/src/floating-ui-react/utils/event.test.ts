import { describe, expect, it, vi } from 'vitest';
import { isVirtualPointerEvent } from './event';

// The predicate short-circuits under jsdom, so pin the shape checks with the flag off.
vi.mock('@base-ui/utils/platform', async () => {
  const actual =
    await vi.importActual<typeof import('@base-ui/utils/platform')>('@base-ui/utils/platform');
  return {
    platform: {
      ...actual.platform,
      env: { ...actual.platform.env, jsdom: false },
      os: { ...actual.platform.os, android: false },
    },
  };
});

function pointerEvent(overrides: Partial<PointerEvent>): PointerEvent {
  return {
    type: 'pointerdown',
    width: 1,
    height: 1,
    pressure: 0,
    detail: 0,
    pointerType: 'mouse',
    ...overrides,
  } as PointerEvent;
}

describe('isVirtualPointerEvent', () => {
  it('recognizes a pressureless 1x1 mouse pointerdown as a screen reader press', () => {
    expect(isVirtualPointerEvent(pointerEvent({}))).toBe(true);
  });

  it('ignores a pressed mouse', () => {
    expect(isVirtualPointerEvent(pointerEvent({ pressure: 0.5 }))).toBe(false);
  });

  it('ignores the same shape on other pointer types', () => {
    expect(isVirtualPointerEvent(pointerEvent({ pointerType: 'touch' }))).toBe(false);
    expect(isVirtualPointerEvent(pointerEvent({ pointerType: 'pen' }))).toBe(false);
  });

  it('ignores the same shape on events other than pointerdown', () => {
    expect(isVirtualPointerEvent(pointerEvent({ type: 'pointerup' }))).toBe(false);
    expect(isVirtualPointerEvent(pointerEvent({ type: 'pointermove' }))).toBe(false);
  });

  it('recognizes an iOS VoiceOver touch', () => {
    expect(
      isVirtualPointerEvent(pointerEvent({ pointerType: 'touch', width: 0.333, height: 0.333 })),
    ).toBe(true);
  });
});
