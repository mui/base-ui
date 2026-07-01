import { expectType } from '#test-utils';
import { Menu } from '@base-ui/react/menu';

// `Menu.LinkItem` exposes the native `<a>` props in its `render` callback.
<Menu.LinkItem
  render={(props) => {
    expectType<string | undefined, typeof props.href>(props.href);
    return <a {...props} />;
  }}
/>;
