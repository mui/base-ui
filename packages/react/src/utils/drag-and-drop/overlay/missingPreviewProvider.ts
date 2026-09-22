/** Throw when custom preview content has no provider to render it. */
export function throwMissingPreviewProvider(): never {
  throw new Error(
    'Base UI: custom drag preview content has no <Draggable.Provider> ancestor, ' +
      'so React cannot render it. Add a <Draggable.Provider> above the <Draggable.Root>, ' +
      'or above the component that calls useDragDropManager() for an imperative registration. ' +
      'See https://base-ui.com/react/utils/draggable.',
  );
}
