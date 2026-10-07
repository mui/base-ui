export interface Author {
  name: string;
  url?: string;
  image?: string;
}

export const authors = {
  james: {
    name: 'James Nelson',
    url: 'https://x.com/atomiksdev',
    image: '/static/authors/james-nelson.png',
  },
  jenna: {
    name: 'Jenna Smith',
    url: 'https://x.com/jjenzz',
    image: '/static/authors/jenna-smith.png',
  },
} satisfies Record<string, Author>;

export type AuthorId = keyof typeof authors;
