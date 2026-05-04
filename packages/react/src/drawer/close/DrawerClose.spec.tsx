import { expectType } from '#test-utils';
import { Drawer } from '@base-ui/react/drawer';

<Drawer.Close />;
<Drawer.Close type="button" />;
<Drawer.Close
  nativeButton={false}
  render={<span />}
  ref={(node) => {
    expectType<HTMLElement | null, typeof node>(node);
  }}
/>;

// @ts-expect-error -- 'type' is not a valid prop when 'nativeButton' is false
<Drawer.Close nativeButton={false} type="button" />;
