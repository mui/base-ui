'use client';
import * as React from 'react';
import copy from 'clipboard-copy';
import { Tabs } from '@base-ui/react/tabs';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useTimeout } from '@base-ui/utils/useTimeout';
import { usePackageManagerSnippetContext } from 'docs/src/blocks/PackageManagerSnippet/PackageManagerSnippetProvider';
import { GhostButton } from './GhostButton';
import { CopyIcon } from '../icons/CopyIcon';
import { CheckIcon } from '../icons/CheckIcon';

const PACKAGE_MANAGERS = [
  { value: 'npm', label: 'npm', command: 'i' },
  { value: 'yarn', label: 'yarn', command: 'add' },
  { value: 'pnpm', label: 'pnpm', command: 'add' },
  { value: 'bun', label: 'bun', command: 'add' },
] as const;

const PRE_STYLE = {
  backgroundColor: 'var(--color-content)',
  color: 'var(--syntax-default)',
} as const;

const ENTITY_STYLE = { color: 'var(--syntax-entity)' } as const;
const STRING_STYLE = { color: 'var(--syntax-string)' } as const;

interface InstallationBlockProps {
  package: string;
}

export function InstallationBlock(props: InstallationBlockProps) {
  const packageName = props.package;

  const { packageManager: globalPreference, setPackageManager: setGlobalPreference } =
    usePackageManagerSnippetContext();

  const [value, setValue] = React.useState<string>(PACKAGE_MANAGERS[0].value);
  const [copied, setCopied] = React.useState(false);

  const codeRef = React.useRef<HTMLPreElement>(null);
  const timeout = useTimeout();
  const titleId = React.useId();

  useIsoLayoutEffect(() => {
    if (PACKAGE_MANAGERS.some((pm) => pm.value === globalPreference)) {
      setValue(globalPreference);
    }
  }, [globalPreference]);

  const handleValueChange = useStableCallback((newValue: string) => {
    setGlobalPreference(newValue);
  });

  const handleCopy = useStableCallback(async () => {
    const code = codeRef.current?.textContent;
    if (!code) {
      return;
    }

    await copy(code);
    setCopied(true);
    timeout.start(2000, () => {
      setCopied(false);
    });
  });

  return (
    <div role="figure" aria-labelledby={titleId} className="CodeBlockRoot">
      <Tabs.Root value={value} onValueChange={handleValueChange}>
        <div className="CodeBlockPanel">
          <div id={titleId} className="CodeBlockPanelTitle">
            Terminal
          </div>

          <Tabs.List className="InstallationBlockTabsList" aria-label="Package manager">
            {PACKAGE_MANAGERS.map((pm) => (
              <Tabs.Tab key={pm.value} value={pm.value} className="InstallationBlockTab">
                {pm.label}
              </Tabs.Tab>
            ))}
          </Tabs.List>

          <GhostButton
            className="ml-auto"
            aria-label={copied ? 'Copied' : 'Copy code'}
            onClick={handleCopy}
          >
            Copy
            <span className="flex size-3.5 items-center justify-center">
              {copied ? <CheckIcon /> : <CopyIcon />}
            </span>
          </GhostButton>
        </div>

        {PACKAGE_MANAGERS.map((pm) => (
          <Tabs.Panel key={pm.value} value={pm.value}>
            <pre
              ref={pm.value === value ? codeRef : undefined}
              className="CodeBlockPre"
              style={PRE_STYLE}
              data-language="bash"
              data-theme="base-ui"
            >
              <code
                className="Code data-inline:mx-[0.1em]"
                data-language="bash"
                data-theme="base-ui"
              >
                <span data-line>
                  <span style={ENTITY_STYLE}>{pm.value}</span>
                  <span style={STRING_STYLE}> {pm.command}</span>
                  <span style={STRING_STYLE}> {packageName}</span>
                </span>
              </code>
            </pre>
          </Tabs.Panel>
        ))}
      </Tabs.Root>
    </div>
  );
}
