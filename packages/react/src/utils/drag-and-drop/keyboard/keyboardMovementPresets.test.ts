import { describe, it, expect, afterEach } from 'vitest';
import { fixedStepKeyboardMovement, targetsOnlyKeyboardMovement } from './keyboardMovementPresets';
import type { DragKeyboardMoveDetails, DragPosition } from '../../../types/drag';

/** A uniform scale, spelled the way a computed `transform` always is. */
function scaleMatrix(scale: number): string {
  return `matrix(${scale}, 0, 0, ${scale}, 0, 0)`;
}

/**
 * A quarter turn, and the same turn composed with a 2× scale. Exact in floating point,
 * unlike the more obvious 45°.
 */
const ROTATED = 'matrix(0, 1, -1, 0, 0, 0)';
const ROTATED_AND_SCALED = 'matrix(0, 2, -2, 0, 0, 0)';

/**
 * A source under an ancestor carrying `transform`, which is what the presets read to convert
 * a step into client pixels. Declared as a matrix because that is what a browser's *computed*
 * `transform` is; jsdom hands the declared string back untouched.
 *
 * Attached to the document, because a real browser computes no style for a detached element
 * and would report every one of these as unscaled.
 */
function makeSource(transform?: string): HTMLElement {
  const element = document.createElement('div');
  if (transform !== undefined) {
    const parent = document.createElement('div');
    parent.style.transform = transform;
    parent.appendChild(element);
    document.body.appendChild(parent);
  }
  return element;
}

function makeDetails(
  overrides: {
    position?: DragPosition;
    direction?: DragPosition;
    shiftKey?: boolean;
    transform?: string;
  } = {},
): DragKeyboardMoveDetails {
  return {
    position: overrides.position ?? { x: 0, y: 0 },
    direction: overrides.direction ?? { x: 1, y: 0 },
    shiftKey: overrides.shiftKey ?? false,
    source: { element: makeSource(overrides.transform) },
  } as unknown as DragKeyboardMoveDetails;
}

describe('targetsOnlyKeyboardMovement', () => {
  it('takes a target suggestion', () => {
    const suggestion = { type: 'target', element: document.createElement('div') };
    expect(targetsOnlyKeyboardMovement({ suggestion } as unknown as DragKeyboardMoveDetails)).toBe(
      suggestion,
    );
  });

  it('refuses a press with no target ahead', () => {
    expect(
      targetsOnlyKeyboardMovement({
        suggestion: { type: 'step' },
      } as unknown as DragKeyboardMoveDetails),
    ).toBe(false);
  });
});

describe('fixedStepKeyboardMovement', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('nudges by the step in the pressed direction', () => {
    const move = fixedStepKeyboardMovement(20);
    expect(move(makeDetails({ position: { x: 100, y: 50 } }))).toEqual({ x: 120, y: 50 });
  });

  it('follows the direction vector on both axes', () => {
    const move = fixedStepKeyboardMovement(20);
    expect(move(makeDetails({ direction: { x: 0, y: -1 } }))).toEqual({ x: 0, y: -20 });
  });

  it('supports a rectangular step', () => {
    const move = fixedStepKeyboardMovement({ x: 30, y: 10 });
    expect(move(makeDetails({ direction: { x: 0, y: 1 } }))).toEqual({ x: 0, y: 10 });
    expect(move(makeDetails({ direction: { x: 1, y: 0 } }))).toEqual({ x: 30, y: 0 });
  });

  it('travels further while Shift is held', () => {
    const move = fixedStepKeyboardMovement(20);
    expect(move(makeDetails({ shiftKey: true }))).toEqual({ x: 80, y: 0 });
  });

  // The step is a distance on the surface, so at 50% zoom it is half as many client pixels.
  it('scales the step by the ancestor scale', () => {
    const move = fixedStepKeyboardMovement(20);
    expect(move(makeDetails({ transform: scaleMatrix(0.5) }))).toEqual({ x: 10, y: 0 });
    expect(move(makeDetails({ transform: scaleMatrix(2) }))).toEqual({ x: 40, y: 0 });
  });

  // A rotation is not a scale: a rotated source's *bounding box* is much larger than its
  // layout box, and the step must not inflate by that ratio.
  it('takes a rotation as no scale at all', () => {
    const move = fixedStepKeyboardMovement(20);
    expect(move(makeDetails({ transform: ROTATED }))).toEqual({ x: 20, y: 0 });
  });

  it('takes the scale a rotation is composed with', () => {
    const move = fixedStepKeyboardMovement(20);
    expect(move(makeDetails({ transform: ROTATED_AND_SCALED }))).toEqual({ x: 40, y: 0 });
  });

  // Unlike the default, it never consults the drop targets around it.
  it('ignores the suggestion entirely', () => {
    const move = fixedStepKeyboardMovement(20);
    const details = makeDetails();
    (details as { suggestion?: unknown }).suggestion = {
      type: 'target',
      element: document.createElement('div'),
    };
    expect(move(details)).toEqual({ x: 20, y: 0 });
  });
});
