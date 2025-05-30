let devMessageSet: Set<string> | undefined;
if (process.env.NODE_ENV !== 'production') {
  devMessageSet = new Set();
}

export function warn(...messages: string[]) {
  const message = `Floating UI: ${messages.join(' ')}`;
  if (!devMessageSet?.has(message)) {
    devMessageSet?.add(message);
    console.warn(message);
  }
}

export function error(...messages: string[]) {
  const message = `Floating UI: ${messages.join(' ')}`;
  if (!devMessageSet?.has(message)) {
    devMessageSet?.add(message);
    console.error(message);
  }
}
