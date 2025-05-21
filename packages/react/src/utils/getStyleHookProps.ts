export type CustomStyleHookMapping<State> = {
  [Property in keyof State]?: (state: State[Property]) => Record<string, string> | null;
};

export function getStyleHookProps<State extends Record<string, any>>(
  state: State,
  customMapping?: CustomStyleHookMapping<State>,
) {
  let className = '';

  /* eslint-disable-next-line guard-for-in */
  for (const key in state) {
    const value = state[key];

    if (customMapping?.hasOwnProperty(key)) {
      // FIXME
      continue
    }

    if (value === true) {
      className += ' state-' + key.toLowerCase()
    } else if (value) {
      className += ' state-' + key.toLowerCase() + '--' + value
    }
  }

  return className;
}
