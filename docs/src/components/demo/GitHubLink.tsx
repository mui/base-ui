import * as React from 'react';
import { useDemoContext } from 'docs/src/blocks/Demo/DemoContext';
import { IconLinkButton } from 'docs/src/design-system/IconLinkButton';
import { GitHubIcon } from 'docs/src/icons/GitHub';

export function GitHubLink() {
  const { selectedFile } = useDemoContext();

  if (!selectedFile) {
    return null;
  }

  const gitHubLink = `https://github.com/mui/base-ui/tree/master/docs/${selectedFile.path}`;

  return (
    <IconLinkButton
      label="View Source on GitHub"
      withTooltip
      size={2}
      href={gitHubLink}
      target="_blank"
    >
      <GitHubIcon />
    </IconLinkButton>
  );
}
