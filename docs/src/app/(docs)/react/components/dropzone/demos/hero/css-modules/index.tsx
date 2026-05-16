'use client';

import * as React from 'react';
import { Dropzone } from '@base-ui/react/dropzone';
import styles from './index.module.css';

export default function ExampleDropzone() {
  const [files, setFiles] = React.useState<File[]>([]);

  const appendFiles = React.useCallback((nextFiles: File[]) => {
    setFiles((prev) => [...prev, ...nextFiles]);
  }, []);

  return (
    <div className={styles.container}>
      <Dropzone.Root
        className={styles.dropzone}
        onFilesDrop={(droppedFiles) => appendFiles(droppedFiles)}
      >
        <Dropzone.HiddenInput
          className={styles.input}
          multiple
          onChange={(event) => {
            const selected = Array.from(event.currentTarget.files ?? []);
            if (selected.length > 0) {
              appendFiles(selected);
            }
            event.currentTarget.value = '';
          }}
        />
        <p className={styles.heading}>Drop files here</p>
        <p className={styles.hint}>or click to open the file picker</p>
      </Dropzone.Root>

      {files.length === 0 ? (
        <p className={styles.empty}>No files selected yet.</p>
      ) : (
        <ul className={styles.list}>
          {files.map((file, index) => (
            <li className={styles.item} key={`${file.name}-${file.size}-${index}`}>
              {file.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
