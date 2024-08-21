import fs from 'fs';
import path from 'path';
import { getHeaders, getTitle } from '@mui/internal-markdown';
import {
  ComponentInfo,
  extractPackageFile,
  parseFile,
} from '@mui-internal/api-docs-builder/buildApiUtils';
import findPagesMarkdown from '@mui-internal/api-docs-builder/utils/findPagesMarkdown';

const REPO_ROOT = path.resolve(__dirname, '../../..');

function getDemosPath(pagePath: string) {
  return `${pagePath.replace('/components/', '/components/react-')}/`;
}

const allMarkdowns = findPagesMarkdown(path.join(REPO_ROOT, 'docs/data/components')).map(
  (markdown) => {
    const markdownContent = fs.readFileSync(markdown.filename, 'utf8');
    const markdownHeaders = getHeaders(markdownContent) as any;

    return {
      ...markdown,
      markdownContent,
      components: markdownHeaders.components as string[],
    };
  },
);

export function getBaseUiDemos(name: string) {
  return allMarkdowns
    .filter((page) => page.components.includes(name))
    .map((page) => ({
      demoPageTitle: getTitle(page.markdownContent),
      demoPathname: getDemosPath(page.pathname),
    }));
}

function getApiPath(demos: Array<{ demoPageTitle: string; demoPathname: string }>, name: string) {
  let apiPath = null;

  if (demos && demos.length > 0) {
    apiPath = `${demos[0].demoPathname}#api-reference-${name}`;
  }

  return apiPath;
}

export function getBaseUiComponentInfo(filename: string): ComponentInfo {
  const { name } = extractPackageFile(filename);
  let srcInfo: null | ReturnType<ComponentInfo['readFile']> = null;
  if (!name) {
    throw new Error(`Could not find the component name from: ${filename}`);
  }

  const demos = getBaseUiDemos(name);

  return {
    filename,
    name,
    muiName: name,
    apiPathname: getApiPath(demos, name) ?? '',
    apiPagesDirectory: path.join(process.cwd(), `docs/data/api`),
    isSystemComponent: false,
    readFile: () => {
      srcInfo = parseFile(filename);
      return srcInfo;
    },
    getInheritance: () => {
      return null;
    },
    getDemos: () => demos,
  };
}
