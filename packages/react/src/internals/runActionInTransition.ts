import * as React from 'react';

export type TransitionAction<Args extends readonly unknown[]> = (
  ...args: Args
) => void | PromiseLike<unknown>;

export function runActionInTransition<Args extends readonly unknown[]>(
  action: TransitionAction<Args>,
  ...args: Args
) {
  async function run() {
    await action(...args);
  }

  if (React.startTransition) {
    React.startTransition(run);
    return;
  }

  void run();
}
