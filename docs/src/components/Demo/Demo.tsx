'use client';
import * as React from 'react';
import { Collapsible } from '@base-ui-components/react/collapsible';
import type {
  ContentProps,
  VariantCode,
  VariantExtraFiles,
} from '@mui/internal-docs-infra/CodeHighlighter';
import { stringOrHastToString } from '@mui/internal-docs-infra/pipeline/hastUtils';
import { useDemo } from '@mui/internal-docs-infra/useDemo';
import { CopyIcon } from 'docs/src/icons/CopyIcon';
import clsx from 'clsx';
import { CheckIcon } from 'docs/src/icons/CheckIcon';
import { ExternalLinkIcon } from 'docs/src/icons/ExternalLinkIcon';
import { DemoVariantSelector } from './DemoVariantSelector';
import { DemoFileSelector } from './DemoFileSelector';
import { DemoCodeBlock } from './DemoCodeBlock';
import { GhostButton } from '../GhostButton';
import { DemoPlayground } from './DemoPlayground';

export type DemoProps = ContentProps<{
  defaultOpen?: boolean;
  compact?: boolean;
  className?: string;
}>;

type HeadTemplateProps = {
  sourcePrefix: string;
  assetPrefix: string;
  variant?: VariantCode;
  variantName?: string;
};

// Base Demo Styles
const defaultStylesLink = `<link rel="stylesheet" href="demo.css" />`;
const htmlHeadWithDefaultStyles = (_: HeadTemplateProps) => defaultStylesLink;
const demoCss = `
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
`;

// CSS Modules Theme Styles (src/demo-data/theme)
const themeStylesLink = `<link rel="stylesheet" href="theme.css" />`;
const htmlHeadWithCssModulesTheme = (_: HeadTemplateProps) => themeStylesLink;

// Tailwind CSS Setup
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
const tailwindNote = `
<!-- Inject classes used so that Tailwind loaded from the CDN can pre-render them. -->
<!-- This is for the CodeSandbox example only. You don't need this in your app. -->

`;
const htmlHeadWithTailwind = ({ variant }: HeadTemplateProps) => {
  let head = tailwindSetup;

  // Inject css classes used on the page so that initial animations aren't broken
  // Otherwise, TW running in the browser won't see all the classes before the components
  // mount for the first time
  const files = variant
    ? [
        variant.source && stringOrHastToString(variant.source),
        ...(variant.extraFiles
          ? Object.keys(variant.extraFiles).map((fileName) =>
              variant.extraFiles &&
              typeof variant.extraFiles[fileName] === 'object' &&
              variant.extraFiles[fileName].source
                ? stringOrHastToString(variant.extraFiles[fileName].source)
                : undefined,
            )
          : []),
      ]
    : [];

  const classNames = new Set<string>();
  files.forEach((file) => {
    if (!file) {
      return;
    }

    const cssClasses = file.matchAll(/className="(.+?)"/gs);
    for (const match of cssClasses) {
      const classes = match[1];
      classes.split(' ').forEach((className) => {
        classNames.add(className);
      });
    }
  });

  if (classNames.size > 0) {
    head += tailwindNote;
    head += `<meta name="custom" class="${Array.from(classNames).join(' ')}" />`;
  }

  return head;
};

// Head Template
function htmlHeadTemplate(props: HeadTemplateProps) {
  const head = [htmlHeadWithDefaultStyles(props)];

  if (props.variantName === 'CssModules') {
    head.push(htmlHeadWithCssModulesTheme(props));
  } else if (props.variantName === 'Tailwind') {
    head.push(htmlHeadWithTailwind(props));
  }

  return head.filter(Boolean).join('\n');
}

// Transform Demo Files at Export
function transformVariant(
  variant: VariantCode,
  variantName?: string,
  globals?: VariantExtraFiles,
): { variant?: VariantCode; globals?: VariantExtraFiles } {
  globals = { ...globals };
  globals['demo.css'] = { source: demoCss };

  // Add color-scheme to the theme file if it exists
  if (variantName === 'CssModules' && globals['theme.css']) {
    const cssTheme = globals['theme.css'];
    const source =
      typeof cssTheme === 'object' && cssTheme.source && stringOrHastToString(cssTheme.source);
    if (source) {
      if (!source.includes(':root {')) {
        throw new Error('Expected to find a ":root" selector in the demo theme file');
      }

      globals['theme.css'] = {
        ...cssTheme,
        source: source.replace(':root {', `:root {\n  color-scheme: light dark;\n`),
      };
    }
  }

  return { globals };
}

function exposeMetadataToPublic(extraFiles: VariantExtraFiles | undefined, fileName: string) {
  if (!extraFiles) {
    return; // No extra files to expose
  }

  if (!extraFiles[fileName]) {
    return; // No file to expose
  }

  if (typeof extraFiles[fileName] === 'string') {
    return; // It can't be metadata if it's a string
  }

  // TODO: re-evaluate this
  if (fileName.startsWith('../')) {
    return; // If the file has a backwards path, we don't know how to expose it safely
  }

  // rename the file to be in the public directory
  extraFiles[`public/${fileName}`] = extraFiles[fileName];
  delete extraFiles[fileName];
}

// Transform Variant for Create React App at Export
function transformVariantForCRA(
  variant: VariantCode,
  variantName?: string,
  globals?: VariantExtraFiles,
): { variant?: VariantCode; globals?: VariantExtraFiles } {
  const { variant: transformedVariant, globals: transformedGlobals } = transformVariant(
    variant,
    variantName,
    globals,
  );

  const transformedGlobalsForCRA = { ...transformedGlobals };

  if (variantName === 'CssModules') {
    exposeMetadataToPublic(transformedGlobalsForCRA, 'theme.css');
  }

  exposeMetadataToPublic(transformedGlobalsForCRA, 'demo.css');

  return {
    variant: transformedVariant,
    globals: transformedGlobalsForCRA,
  };
}

const versions = {
  '@types/react': '^19',
  '@types/react-dom': '^19',
  react: '^19',
  'react-dom': '^19',
};

const COMMIT_REF = process.env.PULL_REQUEST_ID ? process.env.COMMIT_REF : undefined;
const SOURCE_CODE_REPO = process.env.SOURCE_CODE_REPO;

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

export function Demo({ defaultOpen = false, compact = false, className, ...demoProps }: DemoProps) {
  const [copyTimeout, setCopyTimeout] = React.useState<number>(0);
  const onCopied = React.useCallback(() => {
    /* eslint-disable no-restricted-syntax */
    const newTimeout = window.setTimeout(() => {
      window.clearTimeout(newTimeout);
      setCopyTimeout(0);
    }, 2000);
    window.clearTimeout(copyTimeout);
    setCopyTimeout(newTimeout);
    /* eslint-enable no-restricted-syntax */
  }, [copyTimeout]);

  const demo = useDemo(demoProps, {
    copy: { onCopied },
    defaultOpen,
    export: {
      titleSuffix: ' - Base UI Example',
      headTemplate: htmlHeadTemplate,
      transformVariant,
      versions,
      resolveDependencies,
    },
    exportCodeSandbox: {
      transformVariant: transformVariantForCRA,
    },
  });

  return (
    <div className={clsx('DemoRoot', className)}>
      <DemoPlayground component={demo.component} name={demo.name} />
      <Collapsible.Root open={demo.expanded} onOpenChange={demo.setExpanded}>
        <div role="figure" aria-label="Component demo code">
          {(compact ? demo.expanded : true) && (
            <div className="DemoToolbar">
              <DemoFileSelector
                files={demo.files}
                selectedFileName={demo.selectedFileName}
                selectFileName={demo.selectFileName}
                onTabChange={demo.expand}
              />

              <div className="ml-auto flex items-center gap-4">
                <DemoVariantSelector
                  className="contents"
                  onVariantChange={demo.expand}
                  variants={demo.variants}
                  selectedVariant={demo.selectedVariant}
                  selectVariant={demo.selectVariant}
                  availableTransforms={demo.availableTransforms}
                  selectedTransform={demo.selectedTransform}
                  selectTransform={demo.selectTransform}
                />
                <GhostButton
                  aria-label="Open in CodeSandbox"
                  type="button"
                  onClick={demo.openCodeSandbox}
                >
                  CodeSandbox
                  <ExternalLinkIcon />
                </GhostButton>
                <GhostButton aria-label="Copy code" onClick={demo.copy}>
                  Copy
                  <span className="flex size-3.5 items-center justify-center">
                    {copyTimeout ? <CheckIcon /> : <CopyIcon />}
                  </span>
                </GhostButton>
              </div>
            </div>
          )}

          <DemoCodeBlock
            selectedFile={demo.selectedFile}
            selectedFileLines={demo.selectedFileLines}
            collapsibleOpen={demo.expanded}
            compact={compact}
          />
        </div>
      </Collapsible.Root>
    </div>
  );
}
