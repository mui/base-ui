import * as React from 'react';
import { Combobox } from '@base-ui-components/react/combobox';
import styles from './index.module.css';
import { top100Movies, type Movie } from './data';

export default function AsyncCombobox() {
  const [inputValue, setInputValue] = React.useState('');
  const [value, setValue] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [searchResults, setSearchResults] = React.useState<Movie[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  const trimmedInputValue = inputValue.trim();
  const shouldRenderPopup = trimmedInputValue !== '';

  React.useEffect(() => {
    if (!trimmedInputValue) {
      setSearchResults([]);
      setIsLoading(false);
      return undefined;
    }

    setIsLoading(true);
    setError(null);

    let ignore = false;

    async function fetchMovies() {
      try {
        const results = await searchMovies(trimmedInputValue);
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
  }, [trimmedInputValue]);

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
  } else if (searchResults.length === 0 && trimmedInputValue) {
    status = `Movie or year "${inputValue}" does not exist in the Top 100 IMDb movies`;
  }

  return (
    <Combobox.Root
      value={value}
      onValueChange={(nextValue) => {
        setValue(nextValue);
        React.startTransition(() => setInputValue(nextValue));
      }}
    >
      <label className={styles.Label}>
        Search movies by name or year
        <Combobox.Input
          placeholder="e.g. Pulp Fiction or 1994"
          className={styles.Input}
          value={inputValue}
          onChange={(event) => {
            setInputValue(event.target.value);
          }}
          aria-busy={isLoading || undefined}
        />
      </label>
      {shouldRenderPopup && (
        <Combobox.Portal>
          <Combobox.Positioner
            className={styles.Positioner}
            sideOffset={4}
            align="start"
          >
            <Combobox.Popup className={styles.Popup}>
              <Combobox.Status className={styles.StatusItem}>
                {status}
              </Combobox.Status>
              <Combobox.List>
                {searchResults.map((movie) => (
                  <Combobox.Item
                    key={movie.id}
                    className={styles.Item}
                    value={movie.title}
                  >
                    <div className={styles.MovieItem}>
                      <div className={styles.MovieName}>{movie.title}</div>
                      <div className={styles.MovieYear}>{movie.year}</div>
                    </div>
                  </Combobox.Item>
                ))}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      )}
    </Combobox.Root>
  );
}

async function searchMovies(query: string): Promise<Movie[]> {
  // Simulate network delay
  await new Promise((resolve) => {
    setTimeout(resolve, Math.random() * 500 + 100);
  });

  // Simulate occasional network errors (1% chance)
  if (Math.random() < 0.01) {
    throw new Error('Network error');
  }

  return top100Movies.filter(
    (movie) =>
      movie.title.toLowerCase().includes(query.toLowerCase()) ||
      movie.year.toString().includes(query),
  );
}
