'use client';

import * as React from 'react';
import { useDemoContext } from 'docs-base/src/blocks/Demo/DemoContext';
import { createCodeSandbox } from 'docs-base/src/blocks/sandbox/createCodeSandbox';
import { Tooltip } from 'docs-base/src/design-system/Tooltip';
import { CodesandboxIcon } from 'docs-base/src/icons/Codesandbox';

const COMMIT_REF = process.env.PULL_REQUEST_ID ? process.env.COMMIT_REF : undefined;
const SOURCE_CODE_REPO = process.env.SOURCE_CODE_REPO;

const tailwindSetup = `
    <!-- Check out the Tailwind CSS' installation guide for setting it up: https://tailwindcss.com/docs/installation -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = {
        theme: {
          extend: {},
        },
      }
    </script>`;

interface CodeSandboxLinkProps {
  className?: string;
  title: string;
  description?: string;
}

export function CodeSandboxLink(props: CodeSandboxLinkProps) {
  const { className, title, description } = props;

  const {
    state: { selectedVariant },
  } = useDemoContext();

  const { files, language, name } = selectedVariant;

  const handleClick = React.useCallback(() => {
    createCodeSandbox({
      demoFiles: files,
      demoLanguage: language,
      title,
      description,
      dependencies: {
        '@types/react': '^18',
        '@types/react-dom': '^18',
        react: '^18',
        'react-dom': '^18',
      },
      devDependencies: {
        'react-scripts': 'latest',
      },
      dependencyResolver: resolveDependencies,
      additionalHtmlHeadContent: name === 'tailwind' ? tailwindSetup : undefined,
    });
  }, [files, language, name, title, description]);

  return (
    <Tooltip label="Open in CodeSandbox">
      <button
        type="button"
        className={className}
        onClick={handleClick}
        aria-label="Open in CodeSandbox"
      >
        <CodesandboxIcon />
      </button>
    </Tooltip>
  );
}

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
