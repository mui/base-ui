interface Stringifyable {
  toString(): string;
}

export function getStyleHookProps(
  state: Record<string, Stringifyable>,
  customMapping?: Record<string, (s: Stringifyable) => Record<string, string> | null>,
) {
  let props: Record<string, string> = {};

  Object.entries(state).forEach(([key, value]) => {
    if (customMapping?.hasOwnProperty(key)) {
      const customProps = customMapping[key](value);
      if (customProps != null) {
        props = { ...props, ...customProps };
      }

      return;
    }

    if (value !== false) {
      props[`data-${key.toLowerCase()}`] = value.toString();
    }
  });

  return props;
}

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
