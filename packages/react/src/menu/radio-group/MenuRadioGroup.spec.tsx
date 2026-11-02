import { expectType } from '#test-utils';
import { ContextMenu } from '@base-ui/react/context-menu';
import { Menu } from '@base-ui/react/menu';

type Sort = 'name' | 'date';

declare const sort: Sort;

<Menu.RadioGroup
  value={sort}
  onValueChange={(value) => {
    expectType<Sort, typeof value>(value);
  }}
/>;

<Menu.RadioGroup
  defaultValue={'name' as const}
  onValueChange={(value) => {
    expectType<'name', typeof value>(value);
  }}
/>;

<ContextMenu.RadioGroup
  value={sort}
  onValueChange={(value) => {
    expectType<Sort, typeof value>(value);
  }}
/>;

<Menu.RadioGroup
  onValueChange={(value) => {
    expectType<any, typeof value>(value);
  }}
/>;

// @ts-expect-error value must match the inferred group value type
<Menu.RadioGroup value={sort} onValueChange={(value: 'other') => {}} />;
