'use client';
import * as React from 'react';
import { useDemoContext } from 'docs/src/blocks/Demo/DemoContext';
import { createCodeSandbox } from 'docs/src/blocks/createCodeSandbox/createCodeSandbox';
import { ExternalLinkIcon } from 'docs/src/icons/ExternalLinkIcon';
import { GhostButton } from '../GhostButton';

const COMMIT_REF = process.env.PULL_REQUEST_ID ? process.env.COMMIT_REF : undefined;
const SOURCE_CODE_REPO = process.env.SOURCE_CODE_REPO;

const globalCss = `
    <style>
      body {
        font-family: system-ui;
        margin: 0;
      }
      #root {
        display: flex;
        flex-direction: column;
        align-items: center;
        min-height: 100vh;
        padding: 3rem;
        isolation: isolate;
      }
    </style>
`;

const tailwindSetup = `
    <!-- Check out the Tailwind CSS' installation guide for setting it up: https://tailwindcss.com/docs/installation/framework-guides -->
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

interface CodeSandboxLinkProps extends React.ComponentProps<'button'> {
  title: string;
  description?: string;
}

export function CodeSandboxLink({ title, description, ...props }: CodeSandboxLinkProps) {
  const {
    selectedVariant: { files, language, name },
  } = useDemoContext();

  const handleClick = React.useCallback(() => {
    let additionalHtmlHeadContent = globalCss;

    if (name === 'tailwind') {
      additionalHtmlHeadContent += tailwindSetup;

      files.forEach((file) => {
        const cssClasses = file.content.matchAll(/className="(.+?)"/gs);
        additionalHtmlHeadContent += `

    <!-- Inject classes used so that Tailwind loaded from the CDN can pre-render them. -->
    <!-- This is for the CodeSandbox example only. You don't need this in your app. -->`;
        for (const match of cssClasses) {
          // Inject css classes used on the page so that initial animations aren't broken
          // Otherwise, TW running in the browser won't see all the classes before the components
          // mount for the first time
          const classes = match[1];
          if (!additionalHtmlHeadContent.includes(classes)) {
            additionalHtmlHeadContent += `\n    <meta name="custom" class="${classes}" />`;
          }
        }
      });
    } else if (name === 'css-modules') {
      additionalHtmlHeadContent += cssThemeSetup;
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
          content = content.replace(':root {', `:root {\n  color-scheme: light dark;\n`);

          if (!content.includes(':root {')) {
            throw new Error('Expected to find a ":root" selector in the demo theme file');
          }

          return ['public/theme.css', content];
        }

        return null;
      },
    });
  }, [files, language, name, title, description]);

  return (
    <GhostButton aria-label="Open in CodeSandbox" type="button" onClick={handleClick} {...props}>
      CodeSandbox
      <ExternalLinkIcon />
    </GhostButton>
  );
}

function resolveDependencies(packageName: string): Record<string, string> {
  switch (packageName) {
    case '@base-ui-components/react': {
      if (COMMIT_REF === undefined || SOURCE_CODE_REPO !== 'https://github.com/mui/base-ui') {
        // #default-branch-switch
        return {
          '@base-ui-components/react': 'latest',
        };
      }
      const shortSha = COMMIT_REF.slice(0, 8);
      return {
        '@base-ui-components/react': `https://pkg.csb.dev/mui/base-ui/commit/${shortSha}/@base-ui-components/react`,
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
