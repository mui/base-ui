import { expect } from 'vitest';

declare module 'vitest' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Match Vitest's type parameters for declaration merging.
  interface Matchers<R extends void | Promise<void> = void | Promise<void>, T = unknown> {
    toEqualDateTime(expected: any): R;
  }

  interface AsymmetricMatchersContaining {
    toEqualDateTime(expected: any): void;
  }
}

function cleanDate(value: any): Date {
  if (typeof value?.toJSDate === 'function') {
    return value.toJSDate();
  }

  if (typeof value === 'string') {
    return new Date(value);
  }

  return value;
}

function formatDate(value: Date): string {
  return `${value.getFullYear()}-${value.getMonth() + 1}-${value.getDate()}T${value.getHours()}:${value.getMinutes()}:${value.getSeconds()}.${value.getMilliseconds()}`;
}

expect.extend({
  toEqualDateTime(received, expected) {
    const actual = formatDate(cleanDate(received));
    const expectedFormatted = formatDate(cleanDate(expected));
    const pass = actual === expectedFormatted;

    return {
      pass,
      message: () =>
        pass
          ? `expected ${actual} not to equal ${expectedFormatted}`
          : `expected ${actual} to equal ${expectedFormatted}`,
    };
  },
});

export type {};
