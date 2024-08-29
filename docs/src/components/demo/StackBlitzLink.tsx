'use client';

import * as React from 'react';
import { useDemoContext } from 'docs-base/src/blocks/Demo/DemoContext';
import { createStackBlitzProject } from 'docs-base/src/blocks/sandbox/createStackBlitzProject';
import { IconButton } from 'docs-base/src/design-system/IconButton';
import { StackBlitzIcon } from 'docs-base/src/icons/StackBlitz';

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

const cssThemeSetup = '<link rel="stylesheet" href="theme.css" />';

interface StackBlitzLinkProps {
  className?: string;
  title: string;
  description?: string;
}

export function StackBlitzLink(props: StackBlitzLinkProps) {
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

    createStackBlitzProject({
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
      label="Open in StackBlitz"
      withTooltip
      size={2}
    >
      <StackBlitzIcon />
    </IconButton>
  );
}

function resolveDependencies(packageName: string): Record<string, string> {
  switch (packageName) {
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
