export function clearPositionerStyles(
  positionerElement: HTMLElement,
  originalPositionerStyles: React.CSSProperties,
) {
  Object.assign(positionerElement.style, originalPositionerStyles);
}
