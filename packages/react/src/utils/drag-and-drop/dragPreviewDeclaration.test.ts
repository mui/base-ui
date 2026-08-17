import { describe, it, expect, vi } from 'vitest';
import { createDragPreviewHandle, type DragPreviewDeclaration } from './dragPreviewDeclaration';

function createDeclaration(): DragPreviewDeclaration {
  return { render: () => null, createPreviewElement: () => null };
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

    // Warns rather than throws, matching the duplicate-`Draggable.Handle`
    // mistake: a wrapper composing its own preview around a consumer-passed one
    // is plausible, and white-screening production over it is out of proportion.
    const second = createDeclaration();
    expect(() => handle.declare(second)).not.toThrow();
    expect(String(spy.mock.calls[0][0])).toMatch(/more than one preview part/);
    // Last mounted wins, so the outcome is at least deterministic.
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
    // Strict Mode double-invokes effects: the first part's cleanup runs *after*
    // the remounted part has already declared. Clearing unconditionally there
    // would drop the live declaration and leave the draggable with no preview.
    const staleCleanup = handle.declare(createDeclaration());
    staleCleanup();

    const remounted = createDeclaration();
    handle.declare(remounted);
    staleCleanup();

    expect(handle.getDeclaration()).toBe(remounted);
  });
});
