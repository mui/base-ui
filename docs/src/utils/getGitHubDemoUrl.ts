import kebabCase from 'es-toolkit/compat/kebabCase';

function getGitHubBaseUrl() {
  const sourceCodeRepo = process.env.SOURCE_CODE_REPO;
  const sourceCodeRef = process.env.LIB_VERSION ? `v${process.env.LIB_VERSION}` : undefined;

  if (!sourceCodeRepo || !sourceCodeRef) {
    return null;
  }

  return `${sourceCodeRepo}/tree/${sourceCodeRef}`;
}

/**
 * Converts a file:// URL from import.meta.url to a GitHub source URL
 * for the demo directory, optionally targeting a specific variant subdirectory.
 */
export function getGitHubDemoUrl(
  fileUrl: string | undefined,
  selectedVariant?: string,
): string | null {
  if (!fileUrl) {
    return null;
  }

  try {
    const normalized = decodeURIComponent(fileUrl).replace(/\\/g, '/');

    const docsIndex = normalized.indexOf('/docs/');
    if (docsIndex === -1) {
      return null;
    }

    // Extract from "docs/" onward
    const repoRelativePath = normalized.slice(docsIndex + 1);

    // Strip the trailing filename to get the directory
    const lastSlash = repoRelativePath.lastIndexOf('/');
    if (lastSlash === -1) {
      return null;
    }
    let dirPath = repoRelativePath.slice(0, lastSlash);

    if (selectedVariant && selectedVariant !== 'Default') {
      dirPath += `/${kebabCase(selectedVariant)}`;
    }

    const githubBase = getGitHubBaseUrl();

    if (githubBase == null) {
      return null;
    }

    return `${githubBase}/${dirPath}`;
  } catch {
    return null;
  }
}
