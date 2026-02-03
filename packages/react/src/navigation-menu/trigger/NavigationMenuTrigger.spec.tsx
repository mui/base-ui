import { NavigationMenu } from '@base-ui/react/navigation-menu';

<NavigationMenu.Trigger />;
<NavigationMenu.Trigger type="button" />;
<NavigationMenu.Trigger nativeButton={false} render={<span />} />;

// @ts-expect-error -- 'type' is not a valid prop when 'nativeButton' is false
<NavigationMenu.Trigger nativeButton={false} type="button" />;
