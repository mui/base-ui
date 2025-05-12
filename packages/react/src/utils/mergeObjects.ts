export function mergeObjects<A extends object | undefined, B extends object | undefined>(
  a: A,
  b: B,
) {
  if (a && !b) {
    return a;
  }
  if (!a && b) {
    return b;
  }
  if (b || a) {
    return { ...a, ...b };
  }
  return undefined;
}
