import * as React from 'react';

export function ChevronIcon() {
  return (
    <svg viewBox="0 0 12 12" aria-hidden>
      <path
        d="M4.5 2L8.5 6L4.5 10"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function NewFileIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.25" aria-hidden>
      <path d="M4 1h5.586a1 1 0 01.707.293l2.414 2.414a1 1 0 01.293.707V14a1 1 0 01-1 1H4a1 1 0 01-1-1V2a1 1 0 011-1z" />
      <path d="M8 6v4M6 8h4" strokeLinecap="round" />
    </svg>
  );
}

export function NewFolderIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.25" aria-hidden>
      <path d="M2 4.5C2 3.67 2.67 3 3.5 3H6.38a1 1 0 01.7.29l1.13 1.13a1 1 0 00.7.29H12.5c.83 0 1.5.67 1.5 1.5V12c0 .83-.67 1.5-1.5 1.5h-9A1.5 1.5 0 012 12V4.5z" />
      <path d="M8 7v4M6 9h4" strokeLinecap="round" />
    </svg>
  );
}

export function CollapseAllIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.25" aria-hidden>
      <path d="M4.5 2.5h8a1 1 0 011 1v8" strokeLinecap="round" />
      <rect x="2.5" y="4.5" width="9" height="9" rx="1" />
      <path d="M5 9h4" strokeLinecap="round" />
    </svg>
  );
}

// Shared file page silhouette used as a base for most icons
const FILE_PATH = 'M4.5 1H10l3.5 3.5V14a1 1 0 01-1 1h-8a1 1 0 01-1-1V2a1 1 0 011-1z';
const FOLD_PATH = 'M10 1v2.5a1 1 0 001 1h2.5';

function TypeScriptIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <path d={FILE_PATH} fill="#3178C6" fillOpacity={0.15} stroke="#3178C6" strokeWidth="1" />
      <path d={FOLD_PATH} stroke="#3178C6" strokeWidth="1" strokeLinecap="round" />
      <path d="M4.5 9h3M6 9v3.5" stroke="#3178C6" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function TypeScriptReactIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <path d={FILE_PATH} fill="#3178C6" fillOpacity={0.15} stroke="#3178C6" strokeWidth="1" />
      <path d={FOLD_PATH} stroke="#3178C6" strokeWidth="1" strokeLinecap="round" />
      <ellipse cx="7" cy="10.5" rx="3.5" ry="1.3" stroke="#3178C6" strokeWidth="0.75" />
      <ellipse
        cx="7"
        cy="10.5"
        rx="3.5"
        ry="1.3"
        stroke="#3178C6"
        strokeWidth="0.75"
        transform="rotate(60 7 10.5)"
      />
      <ellipse
        cx="7"
        cy="10.5"
        rx="3.5"
        ry="1.3"
        stroke="#3178C6"
        strokeWidth="0.75"
        transform="rotate(120 7 10.5)"
      />
      <circle cx="7" cy="10.5" r="0.7" fill="#3178C6" />
    </svg>
  );
}

function JavaScriptIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <path d={FILE_PATH} fill="#E8D44D" fillOpacity={0.15} stroke="#B8A62E" strokeWidth="1" />
      <path d={FOLD_PATH} stroke="#B8A62E" strokeWidth="1" strokeLinecap="round" />
      <path d="M5.5 9v2.5a1 1 0 01-2 0" stroke="#B8A62E" strokeWidth="1.3" strokeLinecap="round" />
      <path
        d="M8.5 9.5a1.2 1.2 0 012 .2.9.9 0 01-.4 1l-1.2.7a.9.9 0 00-.4 1 1.2 1.2 0 002 .2"
        stroke="#B8A62E"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function JsonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <path d={FILE_PATH} fill="#E8D44D" fillOpacity={0.15} stroke="#B8A62E" strokeWidth="1" />
      <path d={FOLD_PATH} stroke="#B8A62E" strokeWidth="1" strokeLinecap="round" />
      <path
        d="M5.5 8C5 8 4.5 8.2 4.5 8.8v.7c0 .6-.5.9-1 1 .5.1 1 .4 1 1v.7c0 .6.5.8 1 .8M9.5 8c.5 0 1 .2 1 .8v.7c0 .6.5.9 1 1-.5.1-1 .4-1 1v.7c0 .6-.5.8-1 .8"
        stroke="#B8A62E"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CssIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <path d={FILE_PATH} fill="#663399" fillOpacity={0.15} stroke="#663399" strokeWidth="1" />
      <path d={FOLD_PATH} stroke="#663399" strokeWidth="1" strokeLinecap="round" />
      <path
        d="M5 9.5h5M5 11.5h5M6.5 8l-1 5M8.5 8l-1 5"
        stroke="#663399"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MarkdownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <path
        d={FILE_PATH}
        fill="var(--color-gray-300)"
        fillOpacity={0.3}
        stroke="var(--color-gray-400)"
        strokeWidth="1"
      />
      <path d={FOLD_PATH} stroke="var(--color-gray-400)" strokeWidth="1" strokeLinecap="round" />
      <path
        d="M4 13V8.5l1.75 2 1.75-2V13"
        stroke="var(--color-gray-500)"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 10v2.5M10 12.5l1.25-1.5M10 12.5l-1.25-1.5"
        stroke="var(--color-gray-500)"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function YamlIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <path d={FILE_PATH} fill="#E34F26" fillOpacity={0.15} stroke="#E34F26" strokeWidth="1" />
      <path d={FOLD_PATH} stroke="#E34F26" strokeWidth="1" strokeLinecap="round" />
      <path
        d="M4.5 8.5h4M4.5 10.5h6M6 12.5h4.5"
        stroke="#E34F26"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ConfigIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <path
        d={FILE_PATH}
        fill="var(--color-gray-300)"
        fillOpacity={0.3}
        stroke="var(--color-gray-400)"
        strokeWidth="1"
      />
      <path d={FOLD_PATH} stroke="var(--color-gray-400)" strokeWidth="1" strokeLinecap="round" />
      <circle cx="7.5" cy="10.5" r="1.5" stroke="var(--color-gray-500)" strokeWidth="1" />
      <path
        d="M7.5 7.5v1.2M7.5 12v1.2M5 10.5H4M11 10.5h-1M5.5 8.5l.8.8M9.2 12.2l.8.8M9.5 8.5l-.8.8M5.8 12.2l-.8.8"
        stroke="var(--color-gray-500)"
        strokeWidth="0.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DefaultFileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <path d={FILE_PATH} stroke="var(--color-gray-400)" strokeWidth="1" />
      <path d={FOLD_PATH} stroke="var(--color-gray-400)" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

function getFileExtension(label: string): string {
  const dotIndex = label.lastIndexOf('.');
  if (dotIndex === -1 || dotIndex === 0) {
    return '';
  }
  return label.slice(dotIndex + 1);
}

export function FileIcon({ label, className }: { label: string; className?: string }) {
  const ext = getFileExtension(label);
  switch (ext) {
    case 'ts':
    case 'mts':
      return <TypeScriptIcon className={className} />;
    case 'tsx':
      return <TypeScriptReactIcon className={className} />;
    case 'js':
    case 'mjs':
      return <JavaScriptIcon className={className} />;
    case 'json':
      return <JsonIcon className={className} />;
    case 'css':
      return <CssIcon className={className} />;
    case 'md':
      return <MarkdownIcon className={className} />;
    case 'yml':
    case 'yaml':
      return <YamlIcon className={className} />;
    case 'toml':
      return <ConfigIcon className={className} />;
    default:
      return <DefaultFileIcon className={className} />;
  }
}
