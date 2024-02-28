import fs from 'fs';
import path from 'path';
import { getHeaders, getTitle } from '@mui/internal-markdown';
import {
  ComponentInfo,
  extractPackageFile,
  fixPathname,
  getApiPath,
  parseFile,
} from '@mui-internal/api-docs-builder/buildApiUtils';
import findPagesMarkdown from '@mui-internal/api-docs-builder/utils/findPagesMarkdown';

export function getBaseUiDemos(name: string) {
  // resolve demos, so that we can getch the API url
  const allMarkdowns = findPagesMarkdown()
    .filter((markdown) => {
      return markdown.filename.match(/[\\/]data[\\/]base[\\/]/);
    })
    .map((markdown) => {
      const markdownContent = fs.readFileSync(markdown.filename, 'utf8');
      const markdownHeaders = getHeaders(markdownContent) as any;

      return {
        ...markdown,
        markdownContent,
        components: markdownHeaders.components as string[],
      };
    });

  return allMarkdowns
    .filter((page) => page.components.includes(name))
    .map((page) => ({
      demoPageTitle: getTitle(page.markdownContent),
      demoPathname: fixPathname(page.pathname),
    }));
}

export function getBaseUiComponentInfo(filename: string): ComponentInfo {
  const { name } = extractPackageFile(filename);
  let srcInfo: null | ReturnType<ComponentInfo['readFile']> = null;
  if (!name) {
    throw new Error(`Could not find the component name from: ${filename}`);
  }

  const demos = getBaseUiDemos(name);
  const apiPath = getApiPath(demos, name) || '';

  return {
    filename,
    name,
    muiName: name,
    apiPathname: apiPath,
    apiPagesDirectory: path.join(process.cwd(), `docs/pages/base-ui/api`),
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
