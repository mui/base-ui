export interface SearchResult {
  value: string;
  title: string;
  description: string;
}

export const searchResults: SearchResult[] = [
  {
    value: 'react-hooks',
    title: 'React Hooks Guide',
    description: 'Learn how to use React Hooks like useState, useEffect, and custom hooks',
  },
  {
    value: 'javascript-arrays',
    title: 'JavaScript Array Methods',
    description: 'Master array methods like map, filter, reduce, and forEach in JavaScript',
  },
  {
    value: 'css-flexbox',
    title: 'CSS Flexbox Layout',
    description: 'Complete guide to CSS Flexbox for responsive web design',
  },
  {
    value: 'typescript-interfaces',
    title: 'TypeScript Interfaces',
    description: 'Understanding TypeScript interfaces and type definitions',
  },
  {
    value: 'react-performance',
    title: 'React Performance Optimization',
    description: 'Tips and techniques for optimizing React application performance',
  },
  {
    value: 'html-semantics',
    title: 'HTML Semantic Elements',
    description: 'Using semantic HTML elements for better accessibility and SEO',
  },
];
