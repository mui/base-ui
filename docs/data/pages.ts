export interface RouteMetadata {
  pathname: string;
  title?: string;
  children?: readonly RouteMetadata[];
  planned?: boolean;
  unstable?: boolean;
}

const pages: readonly RouteMetadata[] = [
  {
    pathname: '/getting-started',
    title: 'Getting started',
    children: [
      { pathname: '/getting-started/overview', title: 'Overview' },
      { pathname: '/getting-started/quick-start', title: 'Quick start' },
      { pathname: '/getting-started/usage', title: 'Usage' },
      { pathname: '/getting-started/accessibility', title: 'Accessibility' },
      { pathname: '/getting-started/support', title: 'Support' },
    ],
  },
  {
    pathname: '/components',
    title: 'Components',
    children: [
      { pathname: '/components/react-accordion', title: 'Accordion' },
      { pathname: '/components/react-alert-dialog', title: 'Alert Dialog' },
      { pathname: '/components/react-checkbox', title: 'Checkbox' },
      { pathname: '/components/react-checkbox-group', title: 'Checkbox Group' },
      { pathname: '/components/react-collapsible', title: 'Collapsible' },
      { pathname: '/components/react-dialog', title: 'Dialog' },
      { pathname: '/components/react-field', title: 'Field' },
      { pathname: '/components/react-fieldset', title: 'Fieldset' },
      { pathname: '/components/react-form', title: 'Form' },
      { pathname: '/components/react-menu', title: 'Menu' },
      { pathname: '/components/react-number-field', title: 'Number Field' },
      { pathname: '/components/react-popover', title: 'Popover' },
      { pathname: '/components/react-preview-card', title: 'Preview Card' },
      { pathname: '/components/react-progress', title: 'Progress' },
      { pathname: '/components/react-radio-group', title: 'Radio Group' },
      { pathname: '/components/react-scroll-area', title: 'Scroll Area' },
      { pathname: '/components/react-separator', title: 'Separator' },
      { pathname: '/components/react-select', title: 'Select' },
      { pathname: '/components/react-slider', title: 'Slider' },
      { pathname: '/components/react-switch', title: 'Switch' },
      { pathname: '/components/react-tabs', title: 'Tabs' },
      { pathname: '/components/react-input', title: 'Input' },
      { pathname: '/components/react-tooltip', title: 'Tooltip' },
    ],
  },
  {
    pathname: '/guides',
    title: 'How-to guides',
    children: [
      {
        pathname: '/guides/next-js-app-router',
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
