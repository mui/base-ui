import { useRefWithInit } from './useRefWithInit';

interface HookInstance<Args extends any[], Value> {
  use: (...args: Args) => Value;
}
interface HookShape<Args extends any[], Value> {
  new (...args: Args): HookInstance<Args, Value>;
  prototype: HookInstance<Args, Value>;
}

type UseValue<T> = T extends HookShape<any, infer V> ? V : never;

export abstract class Hook {
  static setup(klass: any) {
    (klass as any).use = Hook.use.bind(klass) as any;
    (klass as any).create = create.bind(null, klass) as any;
  }
  static create: Function;

  static use<Args extends any[], T extends HookShape<Args, any>>(
    klass: T,
    ...args: Args
  ): UseValue<T>;
  static use(klass: unknown, a1: unknown, a2: unknown, a3: unknown) {
    if (!(klass as any).create) {
      Hook.setup(klass);
    }
    const instance = useRefWithInit((klass as any).create, a1, a2, a3).current as any;
    const result = instance.use(a1, a2, a3);
    return result ?? instance;
  }

  hooks: HookInstance<any, any>[] | undefined;

  constructor() {
    this.hooks = undefined;
  }

  hook<H>(instance: H): H {
    this.hooks ??= [];
    this.hooks.push(instance as any);
    return instance;
  }

  use(..._args: any[]) {}
}

function create(klass: unknown, a1: unknown, a2: unknown, a3: unknown) {
  return new (klass as any)(a1, a2, a3);
}
