import { describe, it, expect, vi } from 'vitest';
import { createDragPreviewHandle } from './dragPreviewDeclaration';
import type { DragPreviewDeclaration } from './dragPreviewDeclaration';

function createDeclaration(): DragPreviewDeclaration {
  return { getSettings: () => ({}), render: () => null };
}

describe('createDragPreviewHandle', () => {
  it('publishes a declaration and reports it', () => {
    const handle = createDragPreviewHandle();
    expect(handle.getDeclaration()).toBe(null);

    const declaration = createDeclaration();
    handle.declare(declaration);

    expect(handle.getDeclaration()).toBe(declaration);
  });

  it('warns and takes the last declaration when a second preview part declares', () => {
    const handle = createDragPreviewHandle();
    handle.declare(createDeclaration());
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Warns instead of throwing, like a duplicate `Draggable.Handle`. A wrapper
    // that composes its own preview around a consumer-passed one is a plausible
    // mistake, and crashing the app over it is out of proportion.
    const second = createDeclaration();
    expect(() => handle.declare(second)).not.toThrow();
    expect(String(spy.mock.calls[0][0])).toMatch(/more than one preview part/);
    // The last one mounted wins, so the outcome is deterministic.
    expect(handle.getDeclaration()).toBe(second);

    spy.mockRestore();
  });

  it('lets a declaration be replaced once its own cleanup has run', () => {
    const handle = createDragPreviewHandle();
    const cleanup = handle.declare(createDeclaration());

    cleanup();
    expect(handle.getDeclaration()).toBe(null);

    const next = createDeclaration();
    expect(() => handle.declare(next)).not.toThrow();
    expect(handle.getDeclaration()).toBe(next);
  });

  it('cleanup is identity-guarded, so a Strict Mode remount keeps the live declaration', () => {
    const handle = createDragPreviewHandle();
    // Strict Mode runs effects twice, and the first part's cleanup can run after
    // the remounted part has declared. Clearing unconditionally there would drop
    // the live declaration and leave the draggable with no preview.
    const staleCleanup = handle.declare(createDeclaration());
    staleCleanup();

    const remounted = createDeclaration();
    handle.declare(remounted);
    staleCleanup();

    expect(handle.getDeclaration()).toBe(remounted);
  });
});
