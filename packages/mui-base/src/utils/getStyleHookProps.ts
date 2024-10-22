export type CustomStyleHookMapping<State> = {
  [Property in keyof State]?: (state: State[Property]) => Record<string, string> | null;
};

export function getStyleHookProps<State extends Record<string, any>>(
  state: State,
  customMapping?: CustomStyleHookMapping<State>,
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

    if (value === true) {
      props[`data-${key.toLowerCase()}`] = '';
    } else if (value) {
      props[`data-${key.toLowerCase()}`] = value.toString();
    }
  });

  return props;
}
