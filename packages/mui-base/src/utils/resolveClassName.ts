/**
 * If the provided className is a string, it will be returned as is.
 * Otherwise, the function will call the className function with the ownerState as the first argument.
 *
 * @param className
 * @param ownerState
 */
export function resolveClassName<OwnerState>(
  className: string | ((state: OwnerState) => string) | undefined,
  ownerState: OwnerState,
) {
  return typeof className === 'function' ? className(ownerState) : className;
}
