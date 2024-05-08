interface Stringifyable {
  toString(): string;
}

export function getStyleHookProps<State extends Record<string, Stringifyable>>(
  state: State,
  customMapping?: Partial<Record<keyof State, (s: Stringifyable) => Record<string, string> | null>>,
) {
  let props: Record<string, string> = {};

  Object.entries(state).forEach(([key, value]) => {
    if (customMapping?.hasOwnProperty(key)) {
      const customProps = customMapping[key]!(value);
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
