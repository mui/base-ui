export {};

declare global {
  interface Env {
    NODE_ENV?: 'production';
  }

  interface Process {
    env: Env;
  }

  const process: Process;
}
