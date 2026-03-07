/* eslint-disable react-hooks/rules-of-hooks */
import { expectType } from '#test-utils';
import { useToastActions } from './useToastActions';

type ToastPayload = {
  id: string;
  count: number;
};

const typedActions = useToastActions<ToastPayload>();

const typedAddId = typedActions.add({
  title: 'typed',
  data: {
    id: 'typed',
    count: 1,
  },
});
expectType<string, typeof typedAddId>(typedAddId);

typedActions.add({
  title: 'wrong-shape',
  data: {
    id: 'test',
    // @ts-expect-error - message is not a valid property
    message: 'not a number',
  },
});

typedActions.add({
  title: 'wrong-shape',
  // @ts-expect-error - count is a missing property
  data: {
    id: 'test',
  },
});

typedActions.update('typed', {
  data: {
    id: 'typed-update',
    count: 2,
  },
});

typedActions.promise(Promise.resolve(2), {
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

const legacyActions = useToastActions();

const legacyAddId = legacyActions.add<ToastPayload>({
  title: 'legacy',
  data: {
    id: 'legacy',
    count: 3,
  },
});
expectType<string, typeof legacyAddId>(legacyAddId);

legacyActions.update<ToastPayload>('legacy', {
  data: {
    id: 'legacy-update',
    count: 4,
  },
});

legacyActions.promise<number, ToastPayload>(Promise.resolve(5), {
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
