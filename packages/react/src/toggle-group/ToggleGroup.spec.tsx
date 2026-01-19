import { expectType } from '#test-utils';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import { Toggle } from '@base-ui/react/toggle';

const values = ['left', 'right'] as const;

<ToggleGroup
  defaultValue={values}
  onValueChange={(groupValue) => {
    expectType<Array<'left' | 'right'>, typeof groupValue>(groupValue);
  }}
>
  <Toggle value="left" />
  <Toggle value="right" />
</ToggleGroup>;

<ToggleGroup<'left' | 'right'>
  onValueChange={(groupValue) => {
    expectType<Array<'left' | 'right'>, typeof groupValue>(groupValue);
  }}
/>;

// @ts-expect-error - Value must extend string
<ToggleGroup value={[1]} />;
// @ts-expect-error - Value must extend string
<ToggleGroup defaultValue={[2]} />;
