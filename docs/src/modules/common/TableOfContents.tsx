import * as React from 'react';
import { type Toc, type TocEntry } from '@stefanprobst/rehype-extract-toc';
import classes from './TableOfContents.module.css';

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
        <div
          style={{ '--indent-level': entry.depth - 2 } as React.CSSProperties}
          className={classes.item}
        >
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
    <div className={classes.root}>
      <div className="d-f ai-center h-7 mb-2">
        <h4 className="Text size-3 weight-2">Contents</h4>
      </div>
      <nav>{toc.map((item) => renderTocEntry(item, renderDepth, skipFirstLevel))}</nav>
    </div>
  );
}
