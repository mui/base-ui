import * as React from 'react';
import { Combobox } from '@base-ui-components/react/combobox';
import styles from './index.module.css';
import { top100Movies, type Movie } from './data';

export default function AsyncCombobox() {
  const [searchValue, setSearchValue] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [searchResults, setSearchResults] = React.useState<MovieItem[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!searchValue) {
      setSearchResults([]);
      setIsLoading(false);
      return undefined;
    }

    setIsLoading(true);
    setError(null);

    let ignore = false;

    async function fetchMovies() {
      try {
        const results = await searchMovies(searchValue);
        if (!ignore) {
          setSearchResults(results);
        }
      } catch (err) {
        if (!ignore) {
          setError('Failed to fetch movies. Please try again.');
          setSearchResults([]);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    const timeoutId = setTimeout(fetchMovies, 300);

    return () => {
      clearTimeout(timeoutId);
      ignore = true;
    };
  }, [searchValue]);

  let status: React.ReactNode = `${searchResults.length} result${searchResults.length === 1 ? '' : 's'} found`;
  if (isLoading) {
    status = (
      <React.Fragment>
        <div className={styles.Spinner} aria-hidden />
        Searching...
      </React.Fragment>
    );
  } else if (error) {
    status = error;
  } else if (searchResults.length === 0 && searchValue) {
    status = `Movie or year "${searchValue}" does not exist in the Top 100 IMDb movies`;
  }

  const shouldRenderPopup = searchValue !== '';

  return (
    <Combobox.Root
      items={searchResults}
      inputValue={searchValue}
      onInputValueChange={setSearchValue}
      onSelectedValueChange={(value) => {
        setSearchValue(value ?? '');
      }}
    >
      <label className={styles.Label}>
        Search movies by name or year
        <Combobox.Input placeholder="e.g. Pulp Fiction or 1994" className={styles.Input} />
      </label>

      {shouldRenderPopup && (
        <Combobox.Portal>
          <Combobox.Positioner className={styles.Positioner} sideOffset={4} align="start">
            <Combobox.Popup className={styles.Popup} aria-busy={isLoading || undefined}>
              <Combobox.Status className={styles.StatusItem}>{status}</Combobox.Status>
              <Combobox.List>
                {(movie: MovieItem) => (
                  <Combobox.Item key={movie.id} className={styles.Item} value={movie.value}>
                    <div className={styles.MovieItem}>
                      <div className={styles.MovieName}>{movie.title}</div>
                      <div className={styles.MovieYear}>{movie.year}</div>
                    </div>
                  </Combobox.Item>
                )}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      )}
    </Combobox.Root>
  );
}

interface MovieItem extends Movie {
  value: string;
}

async function searchMovies(query: string): Promise<MovieItem[]> {
  // Simulate network delay
  await new Promise((resolve) => {
    setTimeout(resolve, Math.random() * 500 + 100);
  });

  // Simulate occasional network errors (1% chance)
  if (Math.random() < 0.01) {
    throw new Error('Network error');
  }

  const lowerQuery = query.toLowerCase();

  return top100Movies
    .map((movie) => ({ ...movie, value: `${movie.title} - ${movie.year}` }))
    .filter((movie) => movie.value.toLowerCase().includes(lowerQuery));
}
