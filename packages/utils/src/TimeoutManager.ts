export class TimeoutManager {
  private timeoutIds: Map<string, number> = new Map();

  private intervalIds: Map<string, number> = new Map();

  startTimeout = (key: string, delay: number, fn: () => void) => {
    this.clearTimeout(key);
    const id = setTimeout(() => {
      this.timeoutIds.delete(key);
      fn();
    }, delay) as unknown as number; /* Node.js types are enabled in development */

    this.timeoutIds.set(key, id);
  };

  startInterval = (key: string, delay: number, fn: () => void) => {
    this.clearInterval(key);
    const id = setInterval(
      fn,
      delay,
    ) as unknown as number; /* Node.js types are enabled in development */

    this.intervalIds.set(key, id);
  };

  clearTimeout = (key: string) => {
    const id = this.timeoutIds.get(key);
    if (id != null) {
      clearTimeout(id);
      this.timeoutIds.delete(key);
    }
  };

  clearInterval = (key: string) => {
    const id = this.intervalIds.get(key);
    if (id != null) {
      clearInterval(id);
      this.intervalIds.delete(key);
    }
  };

  clearAll = () => {
    this.timeoutIds.forEach(clearTimeout);
    this.timeoutIds.clear();

    this.intervalIds.forEach(clearInterval);
    this.intervalIds.clear();
  };
}
