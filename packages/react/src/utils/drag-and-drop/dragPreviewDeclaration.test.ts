import { describe, it, expect, vi } from 'vitest';
import { createDragPreviewHandle } from './dragPreviewDeclaration';
import type { DragPreviewDeclaration } from './dragPreviewDeclaration';

function createDeclaration(): DragPreviewDeclaration {
  return { getSettings: () => ({}), render: () => null };
}

describe('createDragPreviewHandle', () => {
  it('warns and takes the last declaration when a second preview part declares', () => {
    const handle = createDragPreviewHandle();
    handle.declare(createDeclaration());
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Warns instead of throwing, like a duplicate `Draggable.Handle`. A wrapper
    // that composes its own preview around a consumer-passed one is a plausible
    // mistake, and crashing the app over it is out of proportion.
    const second = createDeclaration();
    handle.declare(second);
    expect(String(spy.mock.calls[0][0])).toMatch(/more than one preview part/);
    // The last one mounted wins, so the outcome is deterministic.
    expect(handle.preview.render).toBe(second.render);

    spy.mockRestore();
  });

  it('lets a declaration be replaced once its own cleanup has run', () => {
    const handle = createDragPreviewHandle();
    const cleanup = handle.declare(createDeclaration());

    cleanup();
    expect(handle.preview.render).toBeUndefined();

    const next = createDeclaration();
    handle.declare(next);
    expect(handle.preview.render).toBe(next.render);
  });

  it('keeps a newer declaration when an older cleanup runs again', () => {
    const handle = createDragPreviewHandle();
    // An older part's cleanup can run after another part has declared, for
    // example when the earlier of two parts unmounts. Clearing unconditionally
    // there would drop the live declaration and leave the draggable with no preview.
    const staleCleanup = handle.declare(createDeclaration());
    staleCleanup();

    const remounted = createDeclaration();
    handle.declare(remounted);
    staleCleanup();

    expect(handle.preview.render).toBe(remounted.render);
  });
});
