import { describe, it, expect, vi } from 'vitest';
import { generateId } from '@base-ui/utils/generateId';
import { createElement, setupDragEngineTests } from '../../../../test/dnd';
import { ensureKeyboardInstructions } from './keyboardInstructions';

setupDragEngineTests();

describe('ensureKeyboardInstructions', () => {
  it('creates the instructions node in the document body and returns its id', () => {
    const el = createElement();
    const { id } = ensureKeyboardInstructions(el, 'Press Space, then move with the arrow keys.');

    const node = document.getElementById(id);
    expect(node).not.toBeNull();
    expect(node!.parentElement).toBe(document.body);
    expect(node!.textContent).toContain('arrow keys');
  });

  it('reuses one node per distinct instruction string', () => {
    const a = createElement();
    const b = createElement();

    const holdA = ensureKeyboardInstructions(a, 'Custom instructions');
    const holdB = ensureKeyboardInstructions(b, 'Custom instructions');

    expect(holdA.id).toBe(holdB.id);
    expect(document.querySelectorAll(`#${holdA.id}`)).toHaveLength(1);
  });

  it('falls back to the document for a detached element instead of throwing', () => {
    // Imperative registration can run before insertion: the detached element is
    // its own root, which has no `getElementById`.
    const detached = document.createElement('div');

    const { id } = ensureKeyboardInstructions(detached, 'Press Space to pick up.');

    const node = document.getElementById(id);
    expect(node).not.toBeNull();
    expect(node!.parentElement).toBe(document.body);
  });

  it('uses the document element for a detached element when the body does not exist', () => {
    const doc = document.implementation.createHTMLDocument('');
    doc.body.remove();
    const detached = doc.createElement('div');

    const hold = ensureKeyboardInstructions(detached, 'Press Space to pick up.');

    const node = doc.getElementById(hold.id);
    expect(node).not.toBeNull();
    expect(node!.parentElement).toBe(doc.documentElement);
    hold.release();
  });

  it('keeps the node until the last hold on the text is released', () => {
    const a = createElement();
    const b = createElement();
    const text = 'Two holders';

    const holdA = ensureKeyboardInstructions(a, text);
    const holdB = ensureKeyboardInstructions(b, text);

    holdA.release();
    expect(document.getElementById(holdA.id)).not.toBeNull();

    holdB.release();
    expect(document.getElementById(holdA.id)).toBeNull();
  });

  it('ignores a repeated release rather than dropping another holder’s node', () => {
    const a = createElement();
    const b = createElement();
    const text = 'Idempotent release';

    const holdA = ensureKeyboardInstructions(a, text);
    const holdB = ensureKeyboardInstructions(b, text);

    holdA.release();
    holdA.release();

    expect(document.getElementById(holdB.id)).not.toBeNull();
  });

  it('creates the node inside a shadow root so the idref resolves there', () => {
    const host = createElement();
    const shadow = host.attachShadow({ mode: 'open' });
    const inner = document.createElement('div');
    shadow.appendChild(inner);

    const { id } = ensureKeyboardInstructions(inner, 'Shadow instructions');

    expect(shadow.getElementById(id)).not.toBeNull();
    // An ARIA IDREF cannot cross the boundary, so the node must not be in the
    // light document instead.
    expect(document.getElementById(id)).toBeNull();
  });

  it('counts holds per root, so releasing one root leaves the other intact', () => {
    const host = createElement();
    const shadow = host.attachShadow({ mode: 'open' });
    const inner = document.createElement('div');
    shadow.appendChild(inner);
    const light = createElement();
    const text = 'Shared across roots';

    const shadowHold = ensureKeyboardInstructions(inner, text);
    const lightHold = ensureKeyboardInstructions(light, text);

    shadowHold.release();

    expect(shadow.getElementById(shadowHold.id)).toBeNull();
    expect(document.getElementById(lightHold.id)).not.toBeNull();

    lightHold.release();
    expect(document.getElementById(lightHold.id)).toBeNull();
  });

  it('does not adopt or remove a consumer element whose id collides', () => {
    const random = vi.spyOn(Math, 'random').mockReturnValue(0.123456);
    const prefix = 'base-ui-dnd-keyboard-instructions';
    const previousId = generateId(prefix);
    const separator = previousId.lastIndexOf('-');
    const nextCounter = Number(previousId.slice(separator + 1)) + 1;
    const consumer = createElement();
    consumer.id = `${previousId.slice(0, separator + 1)}${nextCounter}`;
    consumer.textContent = 'Consumer content';

    const hold = ensureKeyboardInstructions(consumer, 'Drag instructions');

    expect(hold.id).not.toBe(consumer.id);
    expect(document.getElementById(hold.id)?.textContent).toBe('Drag instructions');
    hold.release();
    expect(document.getElementById(consumer.id)).toBe(consumer);
    expect(consumer.textContent).toBe('Consumer content');
    random.mockRestore();
  });
});
