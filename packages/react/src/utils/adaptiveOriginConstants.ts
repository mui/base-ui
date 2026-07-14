export const DEFAULT_SIDES = {
  sideX: 'left',
  sideY: 'top',
} as const;

export type AdaptiveOriginMiddleware = {
  name: string;
  fn: (...args: any[]) => any;
};
