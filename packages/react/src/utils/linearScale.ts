/**
 * Scales a value in [min, max] range to a value in [outputMin, outputMax] range.
 * By default the output is scaled to [0, 1] range.
 *
 * @param {number} value
 * @param {number} max The upper bound of the value's range
 * @param {number} min The lower bound of the value's range
 * @param {number} [outputMax=1] The upper bound of the scaled range
 * @param {number} [outputMin=0] The lower bound of the scaled range
 */
export function linearScale(
  value: number,
  max: number,
  min: number,
  outputMax: number = 1,
  outputMin: number = 0,
) {
  const defaultScaledValue = (value - min) / (max - min);

  return outputMax === 1 && outputMin === 0
    ? defaultScaledValue
    : outputMin + defaultScaledValue * (outputMax - outputMin);
}
