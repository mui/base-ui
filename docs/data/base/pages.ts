export interface RouteMetadata {
  pathname: string;
  title?: string;
  children?: readonly RouteMetadata[];
  planned?: boolean;
  unstable?: boolean;
}

const pages: readonly RouteMetadata[] = [
  {
    pathname: '/base-ui-react/getting-started',
    title: 'Getting started',
    children: [
      { pathname: '/base-ui-react/getting-started/overview', title: 'Overview' },
      { pathname: '/base-ui-react/getting-started/quickstart', title: 'Quickstart' },
      { pathname: '/base-ui-react/getting-started/usage', title: 'Usage' },
      { pathname: '/base-ui-react/getting-started/accessibility', title: 'Accessibility' },
      { pathname: '/base-ui-react/getting-started/support', title: 'Support' },
    ],
  },
  {
    pathname: '/base-ui-react/components',
    title: 'Components',
    children: [
      { pathname: '/base-ui-react/components/alert-dialog', title: 'Alert Dialog' },
      { pathname: '/base-ui-react/components/checkbox', title: 'Checkbox' },
      { pathname: '/base-ui-react/components/dialog', title: 'Dialog' },
      { pathname: '/base-ui-react/components/menu', title: 'Menu' },
      { pathname: '/base-ui-react/components/number-field', title: 'Number Field' },
      { pathname: '/base-ui-react/components/popover', title: 'Popover' },
      { pathname: '/base-ui-react/components/preview-card', title: 'Preview Card' },
      { pathname: '/base-ui-react/components/progress', title: 'Progress' },
      { pathname: '/base-ui-react/components/slider', title: 'Slider' },
      { pathname: '/base-ui-react/components/switch', title: 'Switch' },
      { pathname: '/base-ui-react/components/tabs', title: 'Tabs' },
      { pathname: '/base-ui-react/components/tooltip', title: 'Tooltip' },
    ],
  },
  {
    pathname: '/base-ui-react/guides',
    title: 'How-to guides',
    children: [
      {
        pathname: '/base-ui-react/guides/next-js-app-router',
        title: 'Next.js App Router',
      },
    ],
  },
];

export default pages;

function extractSlug(pathname: string) {
  return pathname.split('/').pop()!;
}

export function getSlugs(parentPath: string) {
  const slugs: string[] = [];

  const categoryPages = pages.find((page) => page.pathname === parentPath);
  categoryPages?.children?.forEach((level2Page) => {
    if (level2Page.children) {
      slugs.push(...level2Page.children.map((page) => extractSlug(page.pathname)));
    } else {
      slugs.push(extractSlug(level2Page.pathname));
    }
  });

  return slugs;
}
