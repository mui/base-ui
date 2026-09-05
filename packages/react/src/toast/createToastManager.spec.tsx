import { expectType } from '#test-utils';
import { createToastManager } from './createToastManager';

type ToastPayload = {
  id: string;
  count: number;
};

const typedManager = createToastManager<ToastPayload>();

const typedAddId = typedManager.add({
  title: 'typed',
  data: {
    id: 'typed',
    count: 1,
  },
});
expectType<string, typeof typedAddId>(typedAddId);

typedManager.add({
  title: 'wrong-shape',
  data: {
    id: 'test',
    // @ts-expect-error - message is not a valid property
    message: 'not a number',
  },
});

typedManager.add({
  title: 'wrong-shape',
  // @ts-expect-error - count is a missing property
  data: {
    id: 'test',
  },
});

typedManager.update('typed', {
  data: {
    id: 'typed-update',
    count: 2,
  },
});

typedManager.update('typed', {
  // @ts-expect-error - id is a missing property, `data` replaces the whole value
  data: {
    count: 2,
  },
});

typedManager.update('typed', (prevToast) => {
  expectType<ToastPayload | undefined, typeof prevToast.data>(prevToast.data);
  return { data: { id: 'typed-update', count: 2 } };
});

// @ts-expect-error - count is a missing property, the updater returns the whole value
typedManager.update('typed', () => ({ data: { id: 'typed-update' } }));

typedManager.promise(Promise.resolve(2), {
  loading: 'loading',
  success: (value) => ({
    title: `${value}`,
    data: {
      id: 'typed-success',
      count: value,
    },
  }),
  error: 'error',
});

const legacyManager = createToastManager();

const legacyAddId = legacyManager.add<ToastPayload>({
  title: 'legacy',
  data: {
    id: 'legacy',
    count: 3,
  },
});
expectType<string, typeof legacyAddId>(legacyAddId);

legacyManager.update<ToastPayload>('legacy', {
  data: {
    id: 'legacy-update',
    count: 4,
  },
});

legacyManager.update<ToastPayload>('legacy', (prevToast) => ({
  data: { id: 'legacy', count: (prevToast.data?.count ?? 0) + 1 },
}));

legacyManager.promise<number, ToastPayload>(Promise.resolve(5), {
  loading: 'loading',
  success: (value) => ({
    title: `${value}`,
    data: {
      id: 'legacy-success',
      count: value,
    },
  }),
  error: 'error',
});

type CallableData = () => string;
const callableManager = createToastManager<CallableData>();

callableManager.add({ data: () => 'initial' });

callableManager.update('callable', { data: () => 'replacement' });

callableManager.update('callable', (prevToast) => {
  expectType<CallableData | undefined, typeof prevToast.data>(prevToast.data);
  return { data: prevToast.data };
});

callableManager.promise(Promise.resolve(1), {
  loading: { data: () => 'loading' },
  success: { data: () => 'done' },
  error: 'failed',
});
