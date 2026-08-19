/**
 * Well-known `Symbol.dispose`. Resolves to the native well-known symbol when
 * the runtime ships the explicit resource management proposal; otherwise falls
 * back to `Symbol.for('Symbol.dispose')`, the same registry symbol used by the
 * fallback stacks below, so `DisposableStack#use` finds the method.
 *
 * Consumers should key dispose methods on this constant —
 * `class Foo { [disposeSymbol]() {} }` — rather than `Symbol.dispose`, so the
 * class works on runtimes without the proposal.
 */
export const disposeSymbol: unique symbol = (
  typeof Symbol.dispose === 'symbol' ? Symbol.dispose : Symbol.for('Symbol.dispose')
) as never;

/**
 * Well-known `Symbol.asyncDispose`. See {@link disposeSymbol} for the
 * native/fallback resolution rules.
 */
export const asyncDisposeSymbol: unique symbol = (
  typeof Symbol.asyncDispose === 'symbol' ? Symbol.asyncDispose : Symbol.for('Symbol.asyncDispose')
) as never;

/** Object disposable via {@link disposeSymbol}. Mirrors `Disposable` from `esnext.disposable`. */
export interface Disposable {
  [disposeSymbol](): void;
}

/** Object disposable via {@link asyncDisposeSymbol}. Mirrors `AsyncDisposable` from `esnext.disposable`. */
export interface AsyncDisposable {
  [asyncDisposeSymbol](): PromiseLike<void>;
}

/**
 * Mirrors the `DisposableStack` interface from `esnext.disposable`, declared
 * locally so consumers don't need that lib in their TypeScript config.
 */
export interface DisposableStack {
  readonly disposed: boolean;
  dispose(): void;
  use<T extends Disposable | null | undefined>(value: T): T;
  adopt<T>(value: T, onDispose: (value: T) => void): T;
  defer(onDispose: () => void): void;
  move(): DisposableStack;
  [disposeSymbol](): void;
}

export interface DisposableStackConstructor {
  new (): DisposableStack;
  readonly prototype: DisposableStack;
}

/**
 * Mirrors the `AsyncDisposableStack` interface from `esnext.disposable`, declared
 * locally so consumers don't need that lib in their TypeScript config.
 */
export interface AsyncDisposableStack {
  readonly disposed: boolean;
  disposeAsync(): Promise<void>;
  use<T extends AsyncDisposable | Disposable | null | undefined>(value: T): T;
  adopt<T>(value: T, onDisposeAsync: (value: T) => PromiseLike<void> | void): T;
  defer(onDisposeAsync: () => PromiseLike<void> | void): void;
  move(): AsyncDisposableStack;
  [asyncDisposeSymbol](): Promise<void>;
}

export interface AsyncDisposableStackConstructor {
  new (): AsyncDisposableStack;
  readonly prototype: AsyncDisposableStack;
}

const NativeSuppressedError: (new (error: unknown, suppressed: unknown) => Error) | undefined =
  typeof SuppressedError === 'function' ? SuppressedError : undefined;

/**
 * Builds a `SuppressedError` (native when available, otherwise a compatible
 * `{ error, suppressed }` Error) so {@link unwrapSuppressedErrors} can flatten
 * the chain produced when several disposers throw.
 */
function createSuppressedError(error: unknown, suppressed: unknown): unknown {
  if (NativeSuppressedError) {
    return new NativeSuppressedError(error, suppressed);
  }
  const wrapper = /* minify-error-disabled */ new Error('An error was suppressed during disposal.');
  return Object.assign(wrapper, { name: 'SuppressedError', error, suppressed });
}

function assertNotDisposed(disposed: boolean): void {
  if (disposed) {
    throw /* minify-error-disabled */ new ReferenceError(
      'Base UI: The disposable stack is disposed.',
    );
  }
}

/**
 * Minimal fallback for `DisposableStack`, used on runtimes that do not ship the
 * explicit resource management proposal. Implements the subset of the proposal
 * we use — `use`, `adopt`, `defer`, `move`, `dispose`, `disposed` and
 * `[Symbol.dispose]` — so no ponyfill has to be bundled.
 */
class FallbackDisposableStack {
  private stack: Array<() => void> = [];

  private isDisposed = false;

  get disposed(): boolean {
    return this.isDisposed;
  }

  use<T>(value: T): T {
    assertNotDisposed(this.isDisposed);
    if (value != null) {
      const method = (value as Record<symbol, unknown>)[disposeSymbol];
      if (typeof method !== 'function') {
        throw /* minify-error-disabled */ new TypeError('Base UI: The value is not disposable.');
      }
      this.stack.push(() => (method as () => void).call(value));
    }
    return value;
  }

  adopt<T>(value: T, onDispose: (value: T) => void): T {
    assertNotDisposed(this.isDisposed);
    this.stack.push(() => onDispose(value));
    return value;
  }

  defer(onDispose: () => void): void {
    assertNotDisposed(this.isDisposed);
    this.stack.push(onDispose);
  }

  move(): FallbackDisposableStack {
    assertNotDisposed(this.isDisposed);
    const next = new FallbackDisposableStack();
    next.stack = this.stack;
    this.stack = [];
    this.isDisposed = true;
    return next;
  }

  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this.isDisposed = true;
    let hasError = false;
    let error: unknown;
    // Dispose in reverse (LIFO) order, aggregating failures into a SuppressedError chain.
    for (let i = this.stack.length - 1; i >= 0; i -= 1) {
      try {
        this.stack[i]();
      } catch (caught) {
        error = hasError ? createSuppressedError(caught, error) : caught;
        hasError = true;
      }
    }
    this.stack = [];
    if (hasError) {
      throw error;
    }
  }

  [disposeSymbol](): void {
    this.dispose();
  }
}

/**
 * Minimal fallback for `AsyncDisposableStack`. See {@link FallbackDisposableStack};
 * disposers may return promises and are awaited sequentially in LIFO order.
 */
class FallbackAsyncDisposableStack {
  private stack: Array<() => unknown> = [];

  private isDisposed = false;

  get disposed(): boolean {
    return this.isDisposed;
  }

  use<T>(value: T): T {
    assertNotDisposed(this.isDisposed);
    if (value != null) {
      const record = value as Record<symbol, unknown>;
      const method = record[asyncDisposeSymbol] ?? record[disposeSymbol];
      if (typeof method !== 'function') {
        throw /* minify-error-disabled */ new TypeError(
          'Base UI: The value is not async disposable.',
        );
      }
      this.stack.push(() => (method as () => unknown).call(value));
    }
    return value;
  }

  adopt<T>(value: T, onDisposeAsync: (value: T) => unknown): T {
    assertNotDisposed(this.isDisposed);
    this.stack.push(() => onDisposeAsync(value));
    return value;
  }

  defer(onDisposeAsync: () => unknown): void {
    assertNotDisposed(this.isDisposed);
    this.stack.push(onDisposeAsync);
  }

  move(): FallbackAsyncDisposableStack {
    assertNotDisposed(this.isDisposed);
    const next = new FallbackAsyncDisposableStack();
    next.stack = this.stack;
    this.stack = [];
    this.isDisposed = true;
    return next;
  }

  async disposeAsync(): Promise<void> {
    if (this.isDisposed) {
      return;
    }
    this.isDisposed = true;
    let hasError = false;
    let error: unknown;
    for (let i = this.stack.length - 1; i >= 0; i -= 1) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await this.stack[i]();
      } catch (caught) {
        error = hasError ? createSuppressedError(caught, error) : caught;
        hasError = true;
      }
    }
    this.stack = [];
    if (hasError) {
      throw error;
    }
  }

  [asyncDisposeSymbol](): Promise<void> {
    return this.disposeAsync();
  }
}

/**
 * Spec-compliant `DisposableStack`. Prefers the platform's native class when
 * present; falls back to a minimal built-in implementation otherwise.
 */

export const DisposableStack: DisposableStackConstructor =
  (globalThis.DisposableStack as unknown as DisposableStackConstructor | undefined) ??
  (FallbackDisposableStack as unknown as DisposableStackConstructor);

/**
 * Spec-compliant `AsyncDisposableStack`. Prefers the platform's native class
 * when present; falls back to a minimal built-in implementation otherwise.
 */

export const AsyncDisposableStack: AsyncDisposableStackConstructor =
  (globalThis.AsyncDisposableStack as unknown as AsyncDisposableStackConstructor | undefined) ??
  (FallbackAsyncDisposableStack as unknown as AsyncDisposableStackConstructor);

/**
 * Unwraps a `SuppressedError` chain (as produced by `DisposableStack.dispose()`
 * when multiple disposers throw) into a flat list, outermost failure first.
 * Returns `[error]` unchanged if it isn't a `SuppressedError`.
 */
export function unwrapSuppressedErrors(error: unknown): unknown[] {
  const failures: unknown[] = [];
  let current: unknown = error;
  while (
    typeof current === 'object' &&
    current !== null &&
    'error' in current &&
    'suppressed' in current
  ) {
    failures.push((current as { error: unknown }).error);
    current = (current as { suppressed: unknown }).suppressed;
  }
  failures.push(current);
  return failures;
}
