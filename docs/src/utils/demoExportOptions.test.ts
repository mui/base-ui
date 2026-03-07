import { describe, expect, it } from 'vitest';
import { exportOpts } from './demoExportOptions';

type HeadTemplate = NonNullable<typeof exportOpts.headTemplate>;
type HeadTemplateProps = Parameters<HeadTemplate>[0];
type ExtraFiles = NonNullable<HeadTemplateProps['variant']>['extraFiles'];

function getTailwindHeadTemplate(source: string, extraFiles?: ExtraFiles) {
  const headTemplate = exportOpts.headTemplate;
  if (!headTemplate) {
    throw new Error('Expected exportOpts.headTemplate to be defined');
  }

  const props: HeadTemplateProps = {
    sourcePrefix: '',
    assetPrefix: '',
    variantName: 'Tailwind',
    variant: {
      source,
      extraFiles,
    },
  };

  return headTemplate(props);
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

describe('exportOpts Tailwind class injection', () => {
  it('injects classes referenced via className constants', () => {
    const source = `
      const popupClassName =
        "data-[starting-style]:opacity-0 transition-transform duration-300";

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

  it('injects classes from extra files referenced via className constants', () => {
    const headTemplate = getTailwindHeadTemplate(
      `
        export default function Demo() {
          return <Extra />;
        }
      `,
      {
        'Extra.tsx': {
          source: `
            const contentClassName = "data-[ending-style]:opacity-0 translate-x-2";

            export function Extra() {
              return <div className={contentClassName}>Extra</div>;
            }
          `,
        },
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
