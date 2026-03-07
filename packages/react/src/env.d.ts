export {};

declare global {
  interface Env {
    NODE_ENV?: 'production' | undefined;
  }

  interface Process {
    env: Env;
  }

  const process: Process;
}
