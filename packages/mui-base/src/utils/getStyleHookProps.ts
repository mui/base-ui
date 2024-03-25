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
