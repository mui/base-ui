export function getStyleHookProps<T>(
  state: Record<string, T>,
  customMapping?: Record<string, (s: T) => Record<string, string> | null>,
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
      props[`data-${key.toLowerCase()}`] = `${value}`;
    }
  });

  return props;
}
