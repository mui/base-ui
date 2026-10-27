import { expectType } from '../testUtils';
import { Store } from './Store';

// Store.create returns an instance of the class it is called on.
{
  const store = Store.create({ value: 1 });
  expectType<Store<{ value: number }>, typeof store>(store);
}
{
  class SubStore extends Store<{ value: number }> {
    isSub = true;
  }
  const sub = SubStore.create({ value: 1 });
  expectType<SubStore, typeof sub>(sub);
}
