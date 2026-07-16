export const DEFAULT_SIDES = {
  sideX: 'left',
  sideY: 'top',
} as const;

// Self-contained stand-in for Floating UI's `Middleware` type. Referencing the real type in
// store state makes `tsc` declaration emit reference `Platform`/`detectOverflow` from
// `@floating-ui/core` internals, which fails as non-portable (TS2883) in consuming builds.
export type AdaptiveOriginMiddleware = {
  name: string;
  fn: (...args: any[]) => any;
};
