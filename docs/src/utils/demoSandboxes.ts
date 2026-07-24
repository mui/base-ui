import {
  createCodeSandbox,
  createStackBlitz,
  openCodeSandbox,
  openStackBlitz,
  type CodePrecompute,
  type DeferredSources,
} from '@mui/internal-docs-infra/lite/runtime';
import { getDemoSandboxOptions } from './demoExportOptions';

function htmlToText(html: string): string {
  const holder = document.createElement('div');
  holder.innerHTML = html;
  return holder.textContent ?? '';
}

function getDemoSandboxProject(
  code: CodePrecompute,
  variantName: string,
  title: string,
  deferredSources: DeferredSources | null,
) {
  if (code.deferredUrl && !deferredSources) {
    throw new Error('Deferred demo sources failed to load. Retry opening the sandbox.');
  }
  const variant = code.variants[variantName];
  const deferredVariant = deferredSources?.[variantName];
  const files: Record<string, string> = {
    [variant.fileName]: htmlToText(deferredVariant?.source ?? variant.html),
  };
  for (const fileName of Object.keys(variant.extraFiles ?? {})) {
    const html = deferredVariant?.extraFiles?.[fileName];
    if (html === undefined) {
      return null;
    }
    files[fileName] = htmlToText(html);
  }

  return {
    ...getDemoSandboxOptions({ variantName, files, title }),
    files,
    entryFileName: variant.fileName,
    exportName: variant.exportName,
  };
}

export function openDemoStackBlitz(
  code: CodePrecompute,
  variantName: string,
  title: string,
  deferredSources: DeferredSources | null,
): void {
  const project = getDemoSandboxProject(code, variantName, title, deferredSources);
  if (project) {
    openStackBlitz(createStackBlitz(project));
  }
}

export function openDemoCodeSandbox(
  code: CodePrecompute,
  variantName: string,
  title: string,
  deferredSources: DeferredSources | null,
): void {
  const project = getDemoSandboxProject(code, variantName, title, deferredSources);
  if (project) {
    openCodeSandbox(createCodeSandbox(project));
  }
}
