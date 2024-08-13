import * as React from 'react';
import { type Toc, type TocEntry } from '@stefanprobst/rehype-extract-toc';

interface Props {
  toc: Toc;
  renderDepth?: number;
  skipFirstLevel?: boolean;
}

function renderTocEntry(entry: TocEntry, renderDepth: number, skipFirstLevel: boolean) {
  if (entry.depth > renderDepth) {
    return null;
  }

  return (
    <React.Fragment key={entry.id}>
      {entry.depth === 1 && skipFirstLevel ? null : (
        <div className={`mb-3 ml-${3 * (entry.depth - 2)}`}>
          <a href={`#${entry.id}`} className="Text size-3 Link color-gray">
            {entry.value}
          </a>
        </div>
      )}
      {entry.children?.map((child) => renderTocEntry(child, renderDepth, skipFirstLevel))}
    </React.Fragment>
  );
}

export function TableOfContents(props: Props) {
  const { toc, renderDepth = 2, skipFirstLevel = true } = props;

  return (
    <div
      style={{
        boxSizing: 'border-box',
        position: 'fixed',
        top: 49,
        right: 0,
        width: 240,
        height: 'calc(100% - 49px)',
        padding: '12px 24px',
        overflowY: 'auto',
      }}
    >
      <div className="d-f ai-center h-7 mb-2">
        <h4 className="Text size-3 weight-2">Contents</h4>
      </div>
      <nav>{toc.map((item) => renderTocEntry(item, renderDepth, skipFirstLevel))}</nav>
    </div>
  );
}
