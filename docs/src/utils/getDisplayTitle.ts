const titleMap: Record<string, string> = {
  'About Base\xa0UI': 'About',
  DragAndDrop: 'Drag and drop',
};

export function getDisplayTitle(title: string | undefined) {
  return (title && titleMap[title]) || title;
}
