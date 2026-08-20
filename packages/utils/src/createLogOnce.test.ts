import { expect, vi } from 'vitest';
import { createLogOnce, reset } from './createLogOnce';

describe('createLogOnce', () => {
  beforeEach(() => {
    reset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates a logger with a custom prefix', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const logOnce = createLogOnce('warn', 'My Library');
    logOnce('message');
    logOnce('message');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('My Library: message');
  });

  it('creates a logger without a prefix', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const logOnce = createLogOnce('error');
    logOnce('message');
    expect(spy).toHaveBeenCalledWith('message');
  });

  it('joins multiple messages with a space', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const logOnce = createLogOnce('warn');
    logOnce('first', 'second');
    expect(spy).toHaveBeenCalledWith('first second');
  });

  it('deduplicates each severity independently', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    createLogOnce('warn')('message');
    createLogOnce('error')('message');
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });

  it('logs again after reset', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const logOnce = createLogOnce('warn');
    logOnce('message');
    reset();
    logOnce('message');
    expect(spy).toHaveBeenCalledTimes(2);
  });
});
