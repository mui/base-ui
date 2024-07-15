import type { MuiPage } from 'docs/src/MuiPage';

const pages: readonly MuiPage[] = [
  {
    pathname: '/base-ui/getting-started-group',
    title: 'Getting started',
    children: [
      { pathname: '/base-ui/getting-started', title: 'Overview' },
      { pathname: '/base-ui/getting-started/quickstart', title: 'Quickstart' },
      { pathname: '/base-ui/getting-started/usage', title: 'Usage' },
      { pathname: '/base-ui/getting-started/accessibility', title: 'Accessibility' },
      { pathname: '/base-ui/getting-started/support' },
    ],
  },
  {
    pathname: '/base-ui/react-',
    title: 'Components',
    children: [
      { pathname: '/base-ui/all-components', title: 'All components' },
      {
        pathname: '/base-ui/components/inputs',
        subheader: 'inputs',
        children: [
          // { pathname: '/base-ui/react-autocomplete', title: 'Autocomplete' },
          { pathname: '/base-ui/react-checkbox', title: 'Checkbox' },
          { pathname: '/base-ui/react-number-field', title: 'Number Field' },
          // { pathname: '/base-ui/react-radio-group', title: 'Radio Group', planned: true },
          // { pathname: '/base-ui/react-select', title: 'Select' },
          { pathname: '/base-ui/react-slider', title: 'Slider' },
          { pathname: '/base-ui/react-switch', title: 'Switch' },
        ],
      },
      {
        pathname: '/base-ui/components/data-display',
        subheader: 'data-display',
        children: [
          { pathname: '/base-ui/react-popover', title: 'Popover' },
          { pathname: '/base-ui/react-preview-card', title: 'Preview Card' },
          { pathname: '/base-ui/react-tooltip', title: 'Tooltip' },
          { pathname: '/base-ui/react-field', title: 'Field' },
        ],
      },
      {
        pathname: '/base-ui/components/feedback',
        subheader: 'feedback',
        children: [
          { pathname: '/base-ui/react-alert-dialog', title: 'Alert Dialog' },
          { pathname: '/base-ui/react-dialog', title: 'Dialog' },
          { pathname: '/base-ui/react-progress', title: 'Progress' },
        ],
      },
      {
        pathname: '/base-ui/components/navigation',
        subheader: 'navigation',
        children: [
          { pathname: '/base-ui/react-menu', title: 'Menu' },
          // { pathname: '/base-ui/react-table-pagination', title: 'Table Pagination' },
          { pathname: '/base-ui/react-tabs', title: 'Tabs' },
        ],
      },
      // {
      //   pathname: '/base-ui/components/utils',
      //   subheader: 'utils',
      //   children: [
      //     { pathname: '/base-ui/react-click-away-listener', title: 'Click-Away Listener' },
      //     { pathname: '/base-ui/react-focus-trap', title: 'Focus Trap' },
      //     { pathname: '/base-ui/react-form-control', title: 'Form Control' },
      //     { pathname: '/base-ui/react-no-ssr', title: 'No-SSR' },
      //     { pathname: '/base-ui/react-popup', title: 'Popup', unstable: true },
      //     { pathname: '/base-ui/react-portal', title: 'Portal' },
      //     { pathname: '/base-ui/react-textarea-autosize', title: 'Textarea Autosize' },
      //   ],
      // },
    ],
  },
  /* {
    title: 'APIs',
    pathname: '/base-ui/api',
    children: pagesApi,
  }, */
  {
    pathname: '/base-ui/guides',
    title: 'How-to guides',
    children: [
      {
        pathname: '/base-ui/guides/next-js-app-router',
        title: 'Next.js App Router',
      },
    ],
  },
];

export default pages;
