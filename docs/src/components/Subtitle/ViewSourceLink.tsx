import { GitHubIcon } from '../../icons/GitHubIcon';

const SOURCE_CODE_REPO = process.env.SOURCE_CODE_REPO;
const SOURCE_CODE_REF = process.env.LIB_VERSION ? `v${process.env.LIB_VERSION}` : undefined;
function getSourceUrl(sourcePath: string | undefined) {
  if (sourcePath == null || SOURCE_CODE_REPO == null || SOURCE_CODE_REF == null) {
    return null;
  }

  return `${SOURCE_CODE_REPO}/tree/${SOURCE_CODE_REF}/${sourcePath}`;
}

export function ViewSourceLink({ sourcePath }: { sourcePath?: string }) {
  const sourceUrl = getSourceUrl(sourcePath);

  if (sourceUrl == null) {
    return null;
  }

  return (
    <a
      href={sourceUrl}
      className="SubtitleLink"
      aria-label="View source on GitHub"
      target="_blank"
      rel="noopener noreferrer"
    >
      <span className="SubtitleLinkText">
        <GitHubIcon />
        View source
      </span>
    </a>
  );
}
