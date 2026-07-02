import { expectType } from '#test-utils';
import { NavigationMenu } from '@base-ui/react/navigation-menu';

// `NavigationMenu.Link` exposes the native `<a>` props in its `render` callback.
<NavigationMenu.Link
  render={(props) => {
    expectType<string | undefined, typeof props.href>(props.href);
    return <a {...props} />;
  }}
/>;
