export interface FileItem {
  id: string;
  label: string;
  children?: FileItem[];
}

export function isFolder(item: FileItem | undefined): boolean {
  return item?.children !== undefined;
}

export const BASE_UI_FILES: FileItem[] = [
  {
    id: '.circleci',
    label: '.circleci',
    children: [{ id: '.circleci/config.yml', label: 'config.yml' }],
  },
  {
    id: '.github',
    label: '.github',
    children: [
      {
        id: '.github/ISSUE_TEMPLATE',
        label: 'ISSUE_TEMPLATE',
        children: [
          { id: '.github/ISSUE_TEMPLATE/bug_report.md', label: 'bug_report.md' },
          {
            id: '.github/ISSUE_TEMPLATE/feature_request.md',
            label: 'feature_request.md',
          },
        ],
      },
      {
        id: '.github/workflows',
        label: 'workflows',
        children: [
          { id: '.github/workflows/ci.yml', label: 'ci.yml' },
          { id: '.github/workflows/release.yml', label: 'release.yml' },
        ],
      },
      { id: '.github/CODEOWNERS', label: 'CODEOWNERS' },
      { id: '.github/dependabot.yml', label: 'dependabot.yml' },
      { id: '.github/PULL_REQUEST_TEMPLATE.md', label: 'PULL_REQUEST_TEMPLATE.md' },
    ],
  },
  {
    id: '.vscode',
    label: '.vscode',
    children: [
      { id: '.vscode/extensions.json', label: 'extensions.json' },
      { id: '.vscode/settings.json', label: 'settings.json' },
    ],
  },
  {
    id: 'docs',
    label: 'docs',
    children: [
      {
        id: 'docs/public',
        label: 'public',
        children: [{ id: 'docs/public/favicon.ico', label: 'favicon.ico' }],
      },
      {
        id: 'docs/src',
        label: 'src',
        children: [
          {
            id: 'docs/src/app',
            label: 'app',
            children: [
              { id: 'docs/src/app/layout.tsx', label: 'layout.tsx' },
              { id: 'docs/src/app/page.tsx', label: 'page.tsx' },
            ],
          },
          {
            id: 'docs/src/components',
            label: 'components',
            children: [
              { id: 'docs/src/components/Header.tsx', label: 'Header.tsx' },
              { id: 'docs/src/components/Sidebar.tsx', label: 'Sidebar.tsx' },
              { id: 'docs/src/components/CodeBlock.tsx', label: 'CodeBlock.tsx' },
            ],
          },
          {
            id: 'docs/src/icons',
            label: 'icons',
            children: [{ id: 'docs/src/icons/index.ts', label: 'index.ts' }],
          },
          {
            id: 'docs/src/utils',
            label: 'utils',
            children: [{ id: 'docs/src/utils/index.ts', label: 'index.ts' }],
          },
          { id: 'docs/src/mdx-components.tsx', label: 'mdx-components.tsx' },
        ],
      },
      { id: 'docs/next.config.mjs', label: 'next.config.mjs' },
      { id: 'docs/package.json', label: 'package.json' },
      { id: 'docs/postcss.config.js', label: 'postcss.config.js' },
      { id: 'docs/tsconfig.json', label: 'tsconfig.json' },
    ],
  },
  {
    id: 'packages',
    label: 'packages',
    children: [
      {
        id: 'packages/react',
        label: 'react',
        children: [
          {
            id: 'packages/react/src',
            label: 'src',
            children: [
              {
                id: 'packages/react/src/accordion',
                label: 'accordion',
                children: [
                  {
                    id: 'packages/react/src/accordion/header',
                    label: 'header',
                    children: [
                      {
                        id: 'packages/react/src/accordion/header/AccordionHeader.tsx',
                        label: 'AccordionHeader.tsx',
                      },
                      {
                        id: 'packages/react/src/accordion/header/AccordionHeader.test.tsx',
                        label: 'AccordionHeader.test.tsx',
                      },
                    ],
                  },
                  {
                    id: 'packages/react/src/accordion/item',
                    label: 'item',
                    children: [
                      {
                        id: 'packages/react/src/accordion/item/AccordionItem.tsx',
                        label: 'AccordionItem.tsx',
                      },
                      {
                        id: 'packages/react/src/accordion/item/AccordionItem.test.tsx',
                        label: 'AccordionItem.test.tsx',
                      },
                    ],
                  },
                  {
                    id: 'packages/react/src/accordion/panel',
                    label: 'panel',
                    children: [
                      {
                        id: 'packages/react/src/accordion/panel/AccordionPanel.tsx',
                        label: 'AccordionPanel.tsx',
                      },
                    ],
                  },
                  {
                    id: 'packages/react/src/accordion/root',
                    label: 'root',
                    children: [
                      {
                        id: 'packages/react/src/accordion/root/AccordionRoot.tsx',
                        label: 'AccordionRoot.tsx',
                      },
                      {
                        id: 'packages/react/src/accordion/root/AccordionRoot.test.tsx',
                        label: 'AccordionRoot.test.tsx',
                      },
                      {
                        id: 'packages/react/src/accordion/root/AccordionRootContext.ts',
                        label: 'AccordionRootContext.ts',
                      },
                    ],
                  },
                  {
                    id: 'packages/react/src/accordion/trigger',
                    label: 'trigger',
                    children: [
                      {
                        id: 'packages/react/src/accordion/trigger/AccordionTrigger.tsx',
                        label: 'AccordionTrigger.tsx',
                      },
                    ],
                  },
                  {
                    id: 'packages/react/src/accordion/index.ts',
                    label: 'index.ts',
                  },
                  {
                    id: 'packages/react/src/accordion/index.parts.ts',
                    label: 'index.parts.ts',
                  },
                ],
              },
              {
                id: 'packages/react/src/alert-dialog',
                label: 'alert-dialog',
                children: [
                  {
                    id: 'packages/react/src/alert-dialog/index.ts',
                    label: 'index.ts',
                  },
                  {
                    id: 'packages/react/src/alert-dialog/index.parts.ts',
                    label: 'index.parts.ts',
                  },
                ],
              },
              {
                id: 'packages/react/src/button',
                label: 'button',
                children: [
                  {
                    id: 'packages/react/src/button/Button.tsx',
                    label: 'Button.tsx',
                  },
                  {
                    id: 'packages/react/src/button/Button.test.tsx',
                    label: 'Button.test.tsx',
                  },
                  { id: 'packages/react/src/button/index.ts', label: 'index.ts' },
                ],
              },
              {
                id: 'packages/react/src/checkbox',
                label: 'checkbox',
                children: [
                  {
                    id: 'packages/react/src/checkbox/root',
                    label: 'root',
                    children: [
                      {
                        id: 'packages/react/src/checkbox/root/CheckboxRoot.tsx',
                        label: 'CheckboxRoot.tsx',
                      },
                      {
                        id: 'packages/react/src/checkbox/root/CheckboxRoot.test.tsx',
                        label: 'CheckboxRoot.test.tsx',
                      },
                    ],
                  },
                  {
                    id: 'packages/react/src/checkbox/indicator',
                    label: 'indicator',
                    children: [
                      {
                        id: 'packages/react/src/checkbox/indicator/CheckboxIndicator.tsx',
                        label: 'CheckboxIndicator.tsx',
                      },
                    ],
                  },
                  { id: 'packages/react/src/checkbox/index.ts', label: 'index.ts' },
                ],
              },
              {
                id: 'packages/react/src/collapsible',
                label: 'collapsible',
                children: [
                  {
                    id: 'packages/react/src/collapsible/index.ts',
                    label: 'index.ts',
                  },
                ],
              },
              {
                id: 'packages/react/src/combobox',
                label: 'combobox',
                children: [
                  {
                    id: 'packages/react/src/combobox/root',
                    label: 'root',
                    children: [
                      {
                        id: 'packages/react/src/combobox/root/ComboboxRoot.tsx',
                        label: 'ComboboxRoot.tsx',
                      },
                      {
                        id: 'packages/react/src/combobox/root/ComboboxRoot.test.tsx',
                        label: 'ComboboxRoot.test.tsx',
                      },
                      {
                        id: 'packages/react/src/combobox/root/ComboboxRootContext.tsx',
                        label: 'ComboboxRootContext.tsx',
                      },
                    ],
                  },
                  {
                    id: 'packages/react/src/combobox/input',
                    label: 'input',
                    children: [
                      {
                        id: 'packages/react/src/combobox/input/ComboboxInput.tsx',
                        label: 'ComboboxInput.tsx',
                      },
                    ],
                  },
                  {
                    id: 'packages/react/src/combobox/item',
                    label: 'item',
                    children: [
                      {
                        id: 'packages/react/src/combobox/item/ComboboxItem.tsx',
                        label: 'ComboboxItem.tsx',
                      },
                    ],
                  },
                  {
                    id: 'packages/react/src/combobox/popup',
                    label: 'popup',
                    children: [
                      {
                        id: 'packages/react/src/combobox/popup/ComboboxPopup.tsx',
                        label: 'ComboboxPopup.tsx',
                      },
                    ],
                  },
                  { id: 'packages/react/src/combobox/index.ts', label: 'index.ts' },
                ],
              },
              {
                id: 'packages/react/src/context-menu',
                label: 'context-menu',
                children: [
                  {
                    id: 'packages/react/src/context-menu/index.ts',
                    label: 'index.ts',
                  },
                ],
              },
              {
                id: 'packages/react/src/dialog',
                label: 'dialog',
                children: [
                  { id: 'packages/react/src/dialog/index.ts', label: 'index.ts' },
                  {
                    id: 'packages/react/src/dialog/index.parts.ts',
                    label: 'index.parts.ts',
                  },
                ],
              },
              {
                id: 'packages/react/src/field',
                label: 'field',
                children: [{ id: 'packages/react/src/field/index.ts', label: 'index.ts' }],
              },
              {
                id: 'packages/react/src/form',
                label: 'form',
                children: [{ id: 'packages/react/src/form/index.ts', label: 'index.ts' }],
              },
              {
                id: 'packages/react/src/input',
                label: 'input',
                children: [{ id: 'packages/react/src/input/index.ts', label: 'index.ts' }],
              },
              {
                id: 'packages/react/src/menu',
                label: 'menu',
                children: [
                  { id: 'packages/react/src/menu/index.ts', label: 'index.ts' },
                  {
                    id: 'packages/react/src/menu/index.parts.ts',
                    label: 'index.parts.ts',
                  },
                ],
              },
              {
                id: 'packages/react/src/popover',
                label: 'popover',
                children: [{ id: 'packages/react/src/popover/index.ts', label: 'index.ts' }],
              },
              {
                id: 'packages/react/src/progress',
                label: 'progress',
                children: [{ id: 'packages/react/src/progress/index.ts', label: 'index.ts' }],
              },
              {
                id: 'packages/react/src/select',
                label: 'select',
                children: [
                  { id: 'packages/react/src/select/index.ts', label: 'index.ts' },
                  {
                    id: 'packages/react/src/select/index.parts.ts',
                    label: 'index.parts.ts',
                  },
                ],
              },
              {
                id: 'packages/react/src/slider',
                label: 'slider',
                children: [{ id: 'packages/react/src/slider/index.ts', label: 'index.ts' }],
              },
              {
                id: 'packages/react/src/switch',
                label: 'switch',
                children: [{ id: 'packages/react/src/switch/index.ts', label: 'index.ts' }],
              },
              {
                id: 'packages/react/src/tabs',
                label: 'tabs',
                children: [{ id: 'packages/react/src/tabs/index.ts', label: 'index.ts' }],
              },
              {
                id: 'packages/react/src/toast',
                label: 'toast',
                children: [{ id: 'packages/react/src/toast/index.ts', label: 'index.ts' }],
              },
              {
                id: 'packages/react/src/toggle',
                label: 'toggle',
                children: [{ id: 'packages/react/src/toggle/index.ts', label: 'index.ts' }],
              },
              {
                id: 'packages/react/src/tooltip',
                label: 'tooltip',
                children: [{ id: 'packages/react/src/tooltip/index.ts', label: 'index.ts' }],
              },
              {
                id: 'packages/react/src/tree',
                label: 'tree',
                children: [{ id: 'packages/react/src/tree/index.ts', label: 'index.ts' }],
              },
              { id: 'packages/react/src/index.ts', label: 'index.ts' },
            ],
          },
          { id: 'packages/react/package.json', label: 'package.json' },
        ],
      },
      {
        id: 'packages/utils',
        label: 'utils',
        children: [
          {
            id: 'packages/utils/src',
            label: 'src',
            children: [
              {
                id: 'packages/utils/src/store',
                label: 'store',
                children: [
                  { id: 'packages/utils/src/store/Store.ts', label: 'Store.ts' },
                  {
                    id: 'packages/utils/src/store/ReactStore.ts',
                    label: 'ReactStore.ts',
                  },
                  {
                    id: 'packages/utils/src/store/ReactStore.test.tsx',
                    label: 'ReactStore.test.tsx',
                  },
                  {
                    id: 'packages/utils/src/store/useStore.ts',
                    label: 'useStore.ts',
                  },
                  {
                    id: 'packages/utils/src/store/createSelector.ts',
                    label: 'createSelector.ts',
                  },
                  { id: 'packages/utils/src/store/index.ts', label: 'index.ts' },
                ],
              },
              {
                id: 'packages/utils/src/useControlled.ts',
                label: 'useControlled.ts',
              },
              {
                id: 'packages/utils/src/useControlled.test.tsx',
                label: 'useControlled.test.tsx',
              },
              {
                id: 'packages/utils/src/useMergedRefs.ts',
                label: 'useMergedRefs.ts',
              },
              {
                id: 'packages/utils/src/useMergedRefs.test.tsx',
                label: 'useMergedRefs.test.tsx',
              },
              { id: 'packages/utils/src/useId.ts', label: 'useId.ts' },
              { id: 'packages/utils/src/useId.test.tsx', label: 'useId.test.tsx' },
              { id: 'packages/utils/src/generateId.ts', label: 'generateId.ts' },
              { id: 'packages/utils/src/owner.ts', label: 'owner.ts' },
              {
                id: 'packages/utils/src/useStableCallback.ts',
                label: 'useStableCallback.ts',
              },
              {
                id: 'packages/utils/src/useAnimationFrame.ts',
                label: 'useAnimationFrame.ts',
              },
              {
                id: 'packages/utils/src/visuallyHidden.ts',
                label: 'visuallyHidden.ts',
              },
              { id: 'packages/utils/src/warn.ts', label: 'warn.ts' },
            ],
          },
          { id: 'packages/utils/package.json', label: 'package.json' },
        ],
      },
    ],
  },
  {
    id: 'scripts',
    label: 'scripts',
    children: [
      {
        id: 'scripts/api-docs-builder',
        label: 'api-docs-builder',
        children: [{ id: 'scripts/api-docs-builder/index.ts', label: 'index.ts' }],
      },
      { id: 'scripts/changelog.config.mjs', label: 'changelog.config.mjs' },
      { id: 'scripts/tsconfig.json', label: 'tsconfig.json' },
    ],
  },
  {
    id: 'test',
    label: 'test',
    children: [
      {
        id: 'test/e2e',
        label: 'e2e',
        children: [{ id: 'test/e2e/index.test.ts', label: 'index.test.ts' }],
      },
      {
        id: 'test/regressions',
        label: 'regressions',
        children: [{ id: 'test/regressions/index.test.ts', label: 'index.test.ts' }],
      },
      { id: 'test/setupVitest.ts', label: 'setupVitest.ts' },
      { id: 'test/package.json', label: 'package.json' },
    ],
  },
  { id: '.editorconfig', label: '.editorconfig' },
  { id: '.gitignore', label: '.gitignore' },
  { id: 'CHANGELOG.md', label: 'CHANGELOG.md' },
  { id: 'CONTRIBUTING.md', label: 'CONTRIBUTING.md' },
  { id: 'LICENSE', label: 'LICENSE' },
  { id: 'README.md', label: 'README.md' },
  { id: 'babel.config.mjs', label: 'babel.config.mjs' },
  { id: 'eslint.config.mjs', label: 'eslint.config.mjs' },
  { id: 'lerna.json', label: 'lerna.json' },
  { id: 'netlify.toml', label: 'netlify.toml' },
  { id: 'nx.json', label: 'nx.json' },
  { id: 'package.json', label: 'package.json' },
  { id: 'pnpm-lock.yaml', label: 'pnpm-lock.yaml' },
  { id: 'pnpm-workspace.yaml', label: 'pnpm-workspace.yaml' },
  { id: 'prettier.config.mjs', label: 'prettier.config.mjs' },
  { id: 'tsconfig.json', label: 'tsconfig.json' },
  { id: 'vitest.config.mts', label: 'vitest.config.mts' },
  { id: 'vitest.shared.mts', label: 'vitest.shared.mts' },
];
