const titleMap: Record<string, string> = {
  'About Base\xa0UI': 'About',
};

export function getDisplayTitle(title: string | undefined) {
  return (title && titleMap[title]) || title;
}
