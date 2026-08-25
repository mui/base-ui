import { expectType } from '#test-utils';
import { Tabs } from '@base-ui/react/tabs';

const stringValue = 'tab-1';
const nullableValue: string | null = 'tab-1';

<Tabs.Root
  value={stringValue}
  onValueChange={(value) => {
    expectType<string | null, typeof value>(value);
  }}
/>;

<Tabs.Root
  defaultValue={1}
  onValueChange={(value) => {
    expectType<number | null, typeof value>(value);
  }}
/>;

<Tabs.Root<'a' | 'b'> value="a" />;

<Tabs.Root<'a' | 'b'>
  onValueChange={(value) => {
    expectType<'a' | 'b' | null, typeof value>(value);
  }}
/>;

<Tabs.Root<string | null>
  value={nullableValue}
  onValueChange={(value) => {
    expectType<string | null, typeof value>(value);
  }}
/>;

<Tabs.Root
  onValueChange={(value) => {
    // Backward-compatible default: no explicit generic keeps permissive `any`.
    expectType<any, typeof value>(value);
  }}
/>;

// @ts-expect-error value must match explicit generic type
<Tabs.Root<'a' | 'b'> value="c" />;

type TabsChangeHandler = NonNullable<Tabs.Root.Props<'a'>['onValueChange']>;
type TabsDefaultChangeHandler = NonNullable<Tabs.Root.Props['onValueChange']>;

const handleValueChange: TabsChangeHandler = (value) => {
  expectType<'a' | null, typeof value>(value);
};

<Tabs.Root<'a'> onValueChange={handleValueChange} />;

const handleDefaultValueChange: TabsDefaultChangeHandler = (value) => {
  expectType<any, typeof value>(value);
};

<Tabs.Root onValueChange={handleDefaultValueChange} />;

export function Wrapper<Value>(props: Tabs.Root.Props<Value>) {
  return <Tabs.Root {...props} />;
}
