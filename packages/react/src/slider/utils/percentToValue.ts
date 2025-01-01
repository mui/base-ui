export function percentToValue(percent: number, min: number, max: number) {
  return (max - min) * percent + min;
}
