'use client';

import * as React from 'react';
import { useDemoContext } from 'docs-base/src/blocks/Demo/DemoContext';
import { createCodeSandbox } from 'docs-base/src/utils/sandbox/createCodeSandbox';
import { Tooltip } from 'docs-base/src/design-system/Tooltip';
import { CodesandboxIcon } from 'docs-base/src/icons/Codesandbox';

const COMMIT_REF = process.env.PULL_REQUEST_ID ? process.env.COMMIT_REF : undefined;
const SOURCE_CODE_REPO = process.env.SOURCE_CODE_REPO;

function resolveDependencies(packageName: string): Record<string, string> {
  switch (packageName) {
    case '@base_ui/react': {
      if (COMMIT_REF === undefined || SOURCE_CODE_REPO !== 'https://github.com/mui/base-ui') {
        // #default-branch-switch
        return {
          '@base_ui/react': 'latest',
        };
      }
      const shortSha = COMMIT_REF.slice(0, 8);
      return {
        '@base_ui/react': `https://pkg.csb.dev/mui/base-ui/commit/${shortSha}/@base_ui/react`,
      };
    }

    case '@mui/material':
    case '@mui/system':
      return {
        [packageName]: 'latest',
        '@emotion/react': 'latest',
        '@emotion/styled': 'latest',
      };

    default:
      return {
        [packageName]: 'latest',
      };
  }
}

const tailwindSetup = `
    <!-- Check the Tailwind CSS's installation guide for setting up tailwind: https://tailwindcss.com/docs/installation -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = {
        theme: {
          extend: {
            animation: {
              appear: 'in-right 200ms',
            },
            border: {
              3: '3px',
            },
            boxShadow: {
              'outline-purple': '0 0 0 4px rgba(192, 132, 252, 0.25)',
              'outline-purple-light': '0 0 0 4px rgba(245, 208, 254, 0.25)',
              'outline-purple-xs': '0 0 0 1px rgba(192, 132, 252, 0.25)',
              'outline-switch': '0 0 1px 3px rgba(168, 85, 247, 0.35)',
            },
            cursor: {
              inherit: 'inherit',
            },
            keyframes: {
              'in-right': {
                from: { transform: 'translateX(100%)' },
                to: { transform: 'translateX(0)' },
              },
            },
            lineHeight: {
              '5.5': '1.375rem',
            },
            maxWidth: {
              snackbar: '560px',
            },
            minHeight: {
              badge: '22px',
            },
            minWidth: {
              badge: '22px',
              listbox: '200px',
              snackbar: '300px',
              'tabs-list': '400px',
            },
          },
        },
      }
    </script>`;

export function CodeSandboxLink(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const {
    state: { selectedVariant },
  } = useDemoContext();

  const { files, language, name } = selectedVariant;

  const handleClick = React.useCallback(() => {
    createCodeSandbox({
      demoFiles: files,
      demoLanguage: language,
      title: 'Base UI demo',
      dependencies: {
        react: '^18',
        'react-dom': '^18',
      },
      devDependencies: {
        'react-scripts': 'latest',
      },
      dependencyResolver: resolveDependencies,
      description: 'Base UI demo',
      additionalHtmlHeadContent: name === 'tailwind' ? tailwindSetup : undefined,
    });
  }, [files, language, name]);

  return (
    <Tooltip label="Open in CodeSandbox">
      <button type="button" {...props} onClick={handleClick} aria-label="Open in CodeSandbox">
        <CodesandboxIcon />
      </button>
    </Tooltip>
  );
}
