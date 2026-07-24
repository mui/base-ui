import { describe, expect, it } from 'vitest';
import { createStackBlitz } from '@mui/internal-docs-infra/lite/runtime';
import { getDemoSandboxOptions, resolveDependencies } from './demoExportOptions';

function getTailwindHeadTemplate(source: string, extraFiles: Record<string, string> = {}) {
  return (
    getDemoSandboxOptions({
      variantName: 'Tailwind',
      files: { 'Demo.tsx': source, ...extraFiles },
      title: 'Demo',
    }).htmlHead ?? ''
  );
}

function getInjectedClasses(headTemplate: string) {
  const metaClassMatch = headTemplate.match(/<meta name="custom" class="([^"]+)" \/>/);
  if (!metaClassMatch) {
    throw new Error('Expected Tailwind class injection meta tag to be present');
  }

  return metaClassMatch[1].split(/\s+/);
}

function getInjectedClassAttribute(headTemplate: string) {
  const metaClassMatch = headTemplate.match(/<meta name="custom" class="([^"]+)" \/>/);
  if (!metaClassMatch) {
    throw new Error('Expected Tailwind class injection meta tag to be present');
  }

  return metaClassMatch[1];
}

describe('getDemoSandboxOptions Tailwind class injection', () => {
  it('uses the Tailwind v4 browser runtime for StackBlitz exports', () => {
    const headTemplate = getTailwindHeadTemplate(`
      export default function Demo() {
        return <div className="outline-1 outline-gray-200">Demo</div>;
      }
    `);

    expect(headTemplate).toContain('https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4');
    expect(headTemplate).not.toContain('https://cdn.tailwindcss.com');
  });

  it('injects classes referenced via concatenated className constants', () => {
    const source = `
      const popupClassName =
        "data-[starting-style]:opacity-0 transition-transform " +
        "duration-300";

      export default function Demo() {
        return <div className={popupClassName}>Demo</div>;
      }
    `;

    const headTemplate = getTailwindHeadTemplate(source);
    const classes = getInjectedClasses(headTemplate);

    expect(classes).toContain('data-[starting-style]:opacity-0');
    expect(classes).toContain('transition-transform');
    expect(classes).toContain('duration-300');
  });

  it('injects classes from derived template literals referenced via className constants', () => {
    const source = `
      const sharedClassName =
        "transition-transform duration-300";
      const popupClassName = \`\${sharedClassName} data-[starting-style]:opacity-0\`;

      export default function Demo() {
        return <div className={popupClassName}>Demo</div>;
      }
    `;

    const headTemplate = getTailwindHeadTemplate(source);
    const classes = getInjectedClasses(headTemplate);

    expect(classes).toContain('transition-transform');
    expect(classes).toContain('duration-300');
    expect(classes).toContain('data-[starting-style]:opacity-0');
  });

  it('injects classes from inline template expressions that reference constants', () => {
    const source = `
      const itemClassName =
        "transition-transform duration-300";

      export default function Demo() {
        return <div className={\`\${itemClassName} text-red-600\`}>Demo</div>;
      }
    `;

    const headTemplate = getTailwindHeadTemplate(source);
    const classes = getInjectedClasses(headTemplate);

    expect(classes).toContain('transition-transform');
    expect(classes).toContain('duration-300');
    expect(classes).toContain('text-red-600');
  });

  it('injects classes from extra files referenced via derived className constants', () => {
    const headTemplate = getTailwindHeadTemplate(
      `
        export default function Demo() {
          return <Extra />;
        }
      `,
      {
        'Extra.tsx': `
          const sharedClassName = "data-[ending-style]:opacity-0";
          const contentClassName = \`\${sharedClassName} translate-x-2\`;

          export function Extra() {
            return <div className={contentClassName}>Extra</div>;
          }
        `,
      },
    );
    const classes = getInjectedClasses(headTemplate);

    expect(classes).toContain('data-[ending-style]:opacity-0');
    expect(classes).toContain('translate-x-2');
  });

  it('escapes the injected class attribute value to prevent HTML injection', () => {
    const source = `
      const popupClassName = 'safe " onclick="alert(1) <script>alert(2)</script>';

      export default function Demo() {
        return <div className={popupClassName}>Demo</div>;
      }
    `;

    const headTemplate = getTailwindHeadTemplate(source);
    const classAttribute = getInjectedClassAttribute(headTemplate);

    expect(classAttribute).toContain('&quot;');
    expect(classAttribute).toContain('&lt;script&gt;alert(2)&lt;/script&gt;');
    expect(classAttribute).not.toContain('<script>');
    expect(classAttribute).not.toContain('" onclick=');
  });
});

describe('getDemoSandboxOptions', () => {
  it('preserves Base UI export metadata, styles, and package versions in the lite payload', () => {
    const context = {
      variantName: 'CssModules',
      files: {
        'Demo.tsx': [
          "import { Button } from '@base-ui/react/button';",
          "import { useTimeout } from '@base-ui/utils/useTimeout';",
          'export default function Demo() { return <Button />; }',
        ].join('\n'),
      },
      title: 'Button & "Menu"',
    };
    const options = getDemoSandboxOptions(context);
    const project = createStackBlitz({
      title: options.title,
      description: options.description,
      files: context.files,
      entryFileName: 'Demo.tsx',
      dependencies: options.dependencies,
      extraFiles: options.extraFiles,
      htmlHead: options.htmlHead,
    });
    const packageJson = JSON.parse(project.formData['project[files][package.json]']) as {
      dependencies: Record<string, string>;
    };
    const html = project.formData['project[files][index.html]'];

    expect(project.formData['project[title]']).toBe('Button & "Menu" - Base UI Example');
    expect(project.formData['project[description]']).toBe('Button & "Menu" demo');
    expect(project.formData['project[files][public/demo.css]']).toContain('color-scheme');
    expect(packageJson.dependencies['@base-ui/react']).toBe(
      resolveDependencies('@base-ui/react')['@base-ui/react'],
    );
    expect(packageJson.dependencies['@base-ui/utils']).toBe(
      resolveDependencies('@base-ui/utils')['@base-ui/utils'],
    );
    expect(html).toContain('<link rel="stylesheet" href="demo.css" />');
    expect(html).toContain('<title>Button &amp; &quot;Menu&quot; - Base UI Example</title>');
    expect(html).toContain('content="Button &amp; &quot;Menu&quot; demo"');
  });

  it('collects and escapes Tailwind classes from every raw source file', () => {
    const options = getDemoSandboxOptions({
      variantName: 'Tailwind',
      files: {
        'Demo.tsx': 'export default () => <div className="flex p-4" />;',
        'Extra.tsx': `const classes = 'safe " onclick="alert(1) <script>';\nexport const Extra = () => <div className={classes} />;`,
      },
      title: 'Demo',
    });
    const classAttribute = getInjectedClassAttribute(options.htmlHead ?? '');

    expect(options.htmlHead).toContain('https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4');
    expect(classAttribute).toContain('flex p-4 safe &quot; onclick=&quot;alert(1) &lt;script&gt;');
    expect(classAttribute).not.toContain('<script>');
  });
});
