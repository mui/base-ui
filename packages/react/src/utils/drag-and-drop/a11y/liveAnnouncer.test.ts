import { describe, it, expect } from 'vitest';
import { createElement, setupDragEngineTests } from '../../../../test/dnd';
import { getAnnouncer } from './liveAnnouncer';

setupDragEngineTests();

function getRegion(): HTMLElement | null {
  return document.querySelector('[role="status"]');
}

describe('liveAnnouncer', () => {
  it('creates a single polite live region and writes the message', () => {
    const el = createElement();
    getAnnouncer(el).announce('Picked up');

    const region = getRegion();
    expect(region).not.toBeNull();
    expect(region!.getAttribute('aria-live')).toBe('polite');
    expect(region!.getAttribute('aria-atomic')).toBe('true');
    expect(region!.textContent).toBe('Picked up');
  });

  it('reuses one region per document across calls', () => {
    const el = createElement();
    getAnnouncer(el).announce('first');
    getAnnouncer(el).announce('second');

    expect(document.querySelectorAll('[role="status"]')).toHaveLength(1);
    expect(getRegion()!.textContent).toBe('second');
  });

  it('uses the document element when the body does not exist', () => {
    const doc = document.implementation.createHTMLDocument('');
    doc.body.remove();
    const reference = doc.createElement('div');
    doc.documentElement.appendChild(reference);

    const announcer = getAnnouncer(reference);
    announcer.announce('Picked up before body');

    const region = doc.querySelector('[role="status"]');
    expect(region).not.toBeNull();
    expect(region!.parentElement).toBe(doc.documentElement);
    announcer.destroy();
  });

  it('changes the text node on every repeat of an identical message', () => {
    // Moving down, back up, and down again announces the same string each time.
    // A live region only fires when its content *changes*, so repeats have to
    // alternate an inaudible marker or the second move goes silent.
    const el = createElement();
    const announcer = getAnnouncer(el);

    announcer.announce('Moved to slot 2');
    const first = getRegion()!.firstChild as Text;
    const seen = [first.data];

    for (let i = 0; i < 3; i += 1) {
      announcer.announce('Moved to slot 2');
      // Same text node throughout: replacing it would drop the announcement.
      expect(getRegion()!.firstChild).toBe(first);
      expect(first.data).not.toBe(seen[seen.length - 1]);
      seen.push(first.data);
    }

    // The marker is zero-width, so every variant still reads as the message.
    for (const data of seen) {
      expect(data.replace(/\u200B/gu, '')).toBe('Moved to slot 2');
    }
  });

  it('writes immediately when no debounce is given', () => {
    const el = createElement();
    getAnnouncer(el).announce('now');
    expect(getRegion()!.textContent).toBe('now');
  });

  it('defers a debounced message off the synchronous path', () => {
    const el = createElement();
    const announcer = getAnnouncer(el);
    announcer.announce('immediate');
    announcer.announce('debounced', { debounceMs: 250 });
    // The debounced write has not landed yet — the immediate one still stands.
    expect(getRegion()!.textContent).toBe('immediate');
  });

  it('lands the debounced message after the delay', async () => {
    const el = createElement();
    const announcer = getAnnouncer(el);
    announcer.announce('immediate');
    announcer.announce('debounced', { debounceMs: 1 });
    expect(getRegion()!.textContent).toBe('immediate');

    await new Promise<void>((resolve) => {
      setTimeout(resolve, 10);
    });
    expect(getRegion()!.textContent).toBe('debounced');
  });

  it('drops a pending debounced message on cancelPending', async () => {
    const el = createElement();
    const announcer = getAnnouncer(el);
    announcer.announce('immediate');
    announcer.announce('debounced', { debounceMs: 1 });
    announcer.cancelPending();

    await new Promise<void>((resolve) => {
      setTimeout(resolve, 10);
    });
    // The pending write was cancelled, so the immediate message still stands.
    expect(getRegion()!.textContent).toBe('immediate');
  });

  it('ignores keyboardAnnouncements after destroy and removes the region', () => {
    const el = createElement();
    const announcer = getAnnouncer(el);
    announcer.announce('before');
    expect(getRegion()).not.toBeNull();

    announcer.destroy();
    expect(getRegion()).toBeNull();

    announcer.announce('after');
    expect(getRegion()).toBeNull();
  });
});
