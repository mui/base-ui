/**
 * Excludes infinite animations, whose finished promises never resolve while they run.
 */
export function getFiniteAnimations(element: Element, options?: GetAnimationsOptions): Animation[] {
  return element.getAnimations(options).filter((animation) => {
    const timing = animation.effect?.getTiming();
    return timing?.duration !== Infinity && timing?.iterations !== Infinity;
  });
}
