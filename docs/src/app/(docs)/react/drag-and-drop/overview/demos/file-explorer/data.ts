export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  /** `null` marks the root folder. */
  parentId: string | null;
}

export type FileSystem = Record<string, FileNode>;

export const INITIAL_NODES: FileSystem = {
  home: { id: 'home', name: 'Home', type: 'folder', parentId: null },
  archive: { id: 'archive', name: 'Archive', type: 'folder', parentId: 'home' },
  documents: { id: 'documents', name: 'Documents', type: 'folder', parentId: 'home' },
  music: { id: 'music', name: 'Music', type: 'folder', parentId: 'home' },
  photos: { id: 'photos', name: 'Photos', type: 'folder', parentId: 'home' },
  projects: { id: 'projects', name: 'Projects', type: 'folder', parentId: 'home' },
  budget: { id: 'budget', name: 'budget.xlsx', type: 'file', parentId: 'home' },
  cover: { id: 'cover', name: 'cover-letter.pdf', type: 'file', parentId: 'home' },
  notes: { id: 'notes', name: 'notes.txt', type: 'file', parentId: 'home' },
  report: { id: 'report', name: 'report-q3.pdf', type: 'file', parentId: 'home' },
  resume: { id: 'resume', name: 'resume.pdf', type: 'file', parentId: 'home' },
  slides: { id: 'slides', name: 'slides.key', type: 'file', parentId: 'home' },
  todo: { id: 'todo', name: 'todo.md', type: 'file', parentId: 'home' },
  backup: { id: 'backup', name: 'backup-2024.zip', type: 'file', parentId: 'archive' },
  invoices: { id: 'invoices', name: 'Invoices', type: 'folder', parentId: 'documents' },
  lease: { id: 'lease', name: 'lease.pdf', type: 'file', parentId: 'documents' },
  taxes: { id: 'taxes', name: 'taxes-2025.pdf', type: 'file', parentId: 'documents' },
  invoice1: { id: 'invoice1', name: 'invoice-001.pdf', type: 'file', parentId: 'invoices' },
  invoice2: { id: 'invoice2', name: 'invoice-002.pdf', type: 'file', parentId: 'invoices' },
  track: { id: 'track', name: 'demo-track.mp3', type: 'file', parentId: 'music' },
  playlist: { id: 'playlist', name: 'playlist.m3u', type: 'file', parentId: 'music' },
  alps: { id: 'alps', name: 'alps.jpg', type: 'file', parentId: 'photos' },
  aurora: { id: 'aurora', name: 'aurora.jpg', type: 'file', parentId: 'photos' },
  beach: { id: 'beach', name: 'beach.jpg', type: 'file', parentId: 'photos' },
  canyon: { id: 'canyon', name: 'canyon.jpg', type: 'file', parentId: 'photos' },
  dunes: { id: 'dunes', name: 'dunes.jpg', type: 'file', parentId: 'photos' },
  forest: { id: 'forest', name: 'forest.jpg', type: 'file', parentId: 'photos' },
  glacier: { id: 'glacier', name: 'glacier.jpg', type: 'file', parentId: 'photos' },
  harbor: { id: 'harbor', name: 'harbor.jpg', type: 'file', parentId: 'photos' },
  iceland: { id: 'iceland', name: 'iceland.jpg', type: 'file', parentId: 'photos' },
  lagoon: { id: 'lagoon', name: 'lagoon.jpg', type: 'file', parentId: 'photos' },
  meadow: { id: 'meadow', name: 'meadow.jpg', type: 'file', parentId: 'photos' },
  prairie: { id: 'prairie', name: 'prairie.jpg', type: 'file', parentId: 'photos' },
  reef: { id: 'reef', name: 'reef.jpg', type: 'file', parentId: 'photos' },
  sunset: { id: 'sunset', name: 'sunset.jpg', type: 'file', parentId: 'photos' },
  volcano: { id: 'volcano', name: 'volcano.jpg', type: 'file', parentId: 'photos' },
  waterfall: { id: 'waterfall', name: 'waterfall.jpg', type: 'file', parentId: 'photos' },
  website: { id: 'website', name: 'Website', type: 'folder', parentId: 'projects' },
  proposal: { id: 'proposal', name: 'proposal.docx', type: 'file', parentId: 'projects' },
  homepage: { id: 'homepage', name: 'index.html', type: 'file', parentId: 'website' },
  stylesheet: { id: 'stylesheet', name: 'styles.css', type: 'file', parentId: 'website' },
};
