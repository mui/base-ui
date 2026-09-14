/**
 * Excludes infinite animations, whose finished promises never resolve while they run.
 */
export function getFiniteAnimations(element: Element, options?: GetAnimationsOptions): Animation[] {
  return element
    .getAnimations(options)
    .filter((animation) => animation.effect?.getTiming().iterations !== Infinity);
}
