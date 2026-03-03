import * as React from 'react';
import { ProcessedTypesMeta } from '@mui/internal-docs-infra/useTypes';
import { Link } from '../Link';
import { Code } from '../Code';
import * as CodeBlock from '../CodeBlock';

export function AdditionalTypes({
  data,
  multiple,
}: {
  data: ProcessedTypesMeta[];
  multiple?: boolean;
}) {
  const rawTypes = data.filter((t) => t.type === 'raw');
  const hydrated = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [canGoBack, setCanGoBack] = React.useState(false);
  React.useEffect(() => {
    const handleHashChange = () => setCanGoBack(true);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);
  const handleBack = React.useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    history.back();
  }, []);

  return (
    <React.Fragment>
      {rawTypes.map((additionalType) => (
        <div key={additionalType.name} id={additionalType.slug} className="AdditionalTypeWrapper">
          <h4 className="ReferenceSectionHeading AdditionalTypeHeading">
            {additionalType.name}
            <a
              href="#"
              className="AdditionalTypeBackLink"
              onClick={hydrated && canGoBack ? handleBack : undefined}
            >
              {hydrated && canGoBack ? 'Back' : 'Hide'}
            </a>
          </h4>
          {additionalType.data.reExportOf ? (
            <p className="AdditionalTypeReExport">
              Re-Export of{' '}
              <Link href={multiple ? additionalType.data.reExportOf.slug : '#api-reference'}>
                {additionalType.data.reExportOf.name}
              </Link>{' '}
              {additionalType.data.reExportOf.suffix} as{' '}
              <Code data-table-code="" data-inline="">
                <span className="pl-en">{additionalType.name.replaceAll('.', '')}</span>
              </Code>
            </p>
          ) : (
            <CodeBlock.Root className="AdditionalTypeCodeBlock">
              {additionalType.data.formattedCode}
            </CodeBlock.Root>
          )}
        </div>
      ))}
    </React.Fragment>
  );
}
