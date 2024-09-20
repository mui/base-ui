'use client';
import * as React from 'react';
import { useDemoContext } from 'docs-base/src/blocks/Demo/DemoContext';
import { createCodeSandbox } from 'docs-base/src/blocks/sandbox/createCodeSandbox';
import { CodesandboxIcon } from 'docs-base/src/icons/Codesandbox';
import { IconButton } from 'docs-base/src/design-system/IconButton';

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

const cssThemeSetup = `
    <link rel="stylesheet" href="theme.css" />`;

interface CodeSandboxLinkProps {
  className?: string;
  title: string;
  description?: string;
}

export function CodeSandboxLink(props: CodeSandboxLinkProps) {
  const { className, title, description } = props;

  const {
    selectedVariant: { files, language, name },
  } = useDemoContext();

  const handleClick = React.useCallback(() => {
    let additionalHtmlHeadContent: string | undefined;

    if (name === 'tailwind') {
      additionalHtmlHeadContent = tailwindSetup;
    } else if (name === 'css-modules') {
      additionalHtmlHeadContent = cssThemeSetup;
    }

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
      additionalHtmlHeadContent,
      onAddingFile: (fileName, content) => {
        if (fileName === 'theme.css') {
          return ['public/theme.css', content];
        }

        return null;
      },
    });
  }, [files, language, name, title, description]);

  return (
    <IconButton
      className={className}
      onClick={handleClick}
      label="Open in CodeSandbox"
      withTooltip
      size={2}
    >
      <CodesandboxIcon />
    </IconButton>
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
