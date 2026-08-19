export function roundToDecimalPlaces(value: number, decimals: number) {
  return Math.round(value * 10 ** decimals) / 10 ** decimals;
}
