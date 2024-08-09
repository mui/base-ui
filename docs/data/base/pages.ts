export interface RouteMetadata {
  pathname: string;
  title?: string;
  children?: readonly RouteMetadata[];
  planned?: boolean;
  unstable?: boolean;
}

const pages: readonly RouteMetadata[] = [
  {
    pathname: '/base-ui-react/getting-started-group',
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
      {
        pathname: '/base-ui-react/components/inputs',
        title: 'Inputs',
        children: [
          // { pathname: '/base-ui-react/autocomplete', title: 'Autocomplete' },
          { pathname: '/base-ui-react/components/checkbox', title: 'Checkbox' },
          { pathname: '/base-ui-react/components/number-field', title: 'Number Field' },
          // { pathname: '/base-ui-react/radio-group', title: 'Radio Group', planned: true },
          // { pathname: '/base-ui-react/select', title: 'Select' },
          { pathname: '/base-ui-react/components/slider', title: 'Slider' },
          { pathname: '/base-ui-react/components/switch', title: 'Switch' },
        ],
      },
      {
        pathname: '/base-ui-react/components/data-display',
        title: 'Data display',
        children: [
          { pathname: '/base-ui-react/components/popover', title: 'Popover' },
          { pathname: '/base-ui-react/components/preview-card', title: 'Preview Card' },
          { pathname: '/base-ui-react/components/tooltip', title: 'Tooltip' },
        ],
      },
      {
        pathname: '/base-ui-react/components/feedback',
        title: 'Feedback',
        children: [
          { pathname: '/base-ui-react/components/alert-dialog', title: 'Alert Dialog' },
          { pathname: '/base-ui-react/components/dialog', title: 'Dialog' },
          { pathname: '/base-ui-react/components/progress', title: 'Progress' },
        ],
      },
      {
        pathname: '/base-ui-react/components/navigation',
        title: 'Navigation',
        children: [
          { pathname: '/base-ui-react/components/menu', title: 'Menu' },
          // { pathname: '/base-ui-react/table-pagination', title: 'Table Pagination' },
          { pathname: '/base-ui-react/components/tabs', title: 'Tabs' },
        ],
      },
      // {
      //   pathname: '/base-ui-react/components/utils',
      //   title: 'utils',
      //   children: [
      //     { pathname: '/base-ui-react/click-away-listener', title: 'Click-Away Listener' },
      //     { pathname: '/base-ui-react/focus-trap', title: 'Focus Trap' },
      //     { pathname: '/base-ui-react/form-control', title: 'Form Control' },
      //     { pathname: '/base-ui-react/no-ssr', title: 'No-SSR' },
      //     { pathname: '/base-ui-react/popup', title: 'Popup', unstable: true },
      //     { pathname: '/base-ui-react/portal', title: 'Portal' },
      //     { pathname: '/base-ui-react/textarea-autosize', title: 'Textarea Autosize' },
      //   ],
      // },
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
