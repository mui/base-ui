import { expect, vi } from 'vitest';
import { reset, warn } from './warn';
import { error } from './error';

describe('warn', () => {
  beforeEach(() => {
    reset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logs a message once with the Base UI prefix', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    warn('message');
    warn('message');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('Base UI: message');
  });

  it('joins multiple messages with a space', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    warn('first', 'second');
    expect(spy).toHaveBeenCalledWith('Base UI: first second');
  });

  it('logs again after reset', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    warn('message');
    reset();
    warn('message');
    expect(spy).toHaveBeenCalledTimes(2);
  });
});

describe('error', () => {
  beforeEach(() => {
    reset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logs a message once with the Base UI prefix', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    error('message');
    error('message');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('Base UI: message');
  });

  it('deduplicates warnings and errors independently', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    warn('message');
    error('message');
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });
});
