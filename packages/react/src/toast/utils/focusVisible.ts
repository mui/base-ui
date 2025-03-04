export function isFocusVisible(element: Element | null) {
  let result = false;
  try {
    result = element?.matches(':focus-visible') ?? true;
  } catch (error) {
    result = true;
  }
  return result;
}
