"use client"

import * as React from "react"
import { Loader2Icon } from "lucide-react"

import {
	Autocomplete,
	AutocompleteContent,
	AutocompleteInput,
	AutocompleteItem,
	AutocompleteList,
	AutocompleteStatus,
	useFilter,
} from "@/components/ui/autocomplete"
import { Label } from "@/components/ui/label"

export default function AutocompleteAsyncDemo() {
	const [searchValue, setSearchValue] = React.useState("")
	const [isLoading, setIsLoading] = React.useState(false)
	const [searchResults, setSearchResults] = React.useState<Book[]>([])
	const [error, setError] = React.useState<string | null>(null)

	const { contains } = useFilter({ sensitivity: "base" })

	React.useEffect(() => {
		if (!searchValue) {
			setSearchResults([])
			setIsLoading(false)
			return undefined
		}

		setIsLoading(true)
		setError(null)

		let ignore = false

		async function fetchBooks() {
			try {
				const results = await searchBooks(searchValue, contains)
				if (!ignore) {
					setSearchResults(results)
				}
			} catch {
				if (!ignore) {
					setError("Failed to find books. Please try again.")
					setSearchResults([])
				}
			} finally {
				if (!ignore) {
					setIsLoading(false)
				}
			}
		}

		const timeoutId = setTimeout(fetchBooks, 300)

		return () => {
			clearTimeout(timeoutId)
			ignore = true
		}
	}, [searchValue, contains])

	let status: React.ReactNode = `${searchResults.length} book${
		searchResults.length === 1 ? "" : "s"
	} found`
	if (isLoading) {
		status = (
			<React.Fragment>
				<Loader2Icon className="size-4 animate-spin" />
				Searching books...
			</React.Fragment>
		)
	} else if (error) {
		status = error
	} else if (searchResults.length === 0 && searchValue) {
		status = `No books found for "${searchValue}"`
	}

	const shouldRenderPopup = searchValue !== ""

	return (
		<div className="w-80">
			<Autocomplete
				items={searchResults}
				value={searchValue}
				onValueChange={setSearchValue}
				itemToStringValue={(item: unknown) => (item as Book).title}
				filter={null}
			>
				<div className="flex flex-col gap-2">
					<Label htmlFor="search-books">Search books</Label>
					<AutocompleteInput
						id="search-books"
						placeholder="e.g. Hamlet or Shakespeare or 1603"
					/>
				</div>

				{shouldRenderPopup && (
					<AutocompleteContent aria-busy={isLoading || undefined}>
						<AutocompleteStatus>{status}</AutocompleteStatus>
						<AutocompleteList>
							{(book: Book) => (
								<AutocompleteItem key={book.id} value={book}>
									<div className="flex w-full flex-col gap-1">
										<div className="font-medium">{book.title}</div>
										<div className="text-muted-foreground text-xs">
											by {book.author}, {book.publishedYear}
										</div>
									</div>
								</AutocompleteItem>
							)}
						</AutocompleteList>
					</AutocompleteContent>
				)}
			</Autocomplete>
		</div>
	)
}

interface Book {
	id: string
	title: string
	author: string
	publishedYear: number
}

const books: Book[] = [
	{
		id: "1",
		title: "Pride and Prejudice",
		author: "Jane Austen",
		publishedYear: 1813,
	},
	{
		id: "2",
		title: "To Kill a Mockingbird",
		author: "Harper Lee",
		publishedYear: 1960,
	},
	{ id: "3", title: "1984", author: "George Orwell", publishedYear: 1949 },
	{
		id: "4",
		title: "The Great Gatsby",
		author: "F. Scott Fitzgerald",
		publishedYear: 1925,
	},
	{
		id: "5",
		title: "Jane Eyre",
		author: "Charlotte Brontë",
		publishedYear: 1847,
	},
	{
		id: "6",
		title: "Wuthering Heights",
		author: "Emily Brontë",
		publishedYear: 1847,
	},
	{
		id: "7",
		title: "The Catcher in the Rye",
		author: "J.D. Salinger",
		publishedYear: 1951,
	},
	{
		id: "8",
		title: "Lord of the Flies",
		author: "William Golding",
		publishedYear: 1954,
	},
	{
		id: "9",
		title: "Of Mice and Men",
		author: "John Steinbeck",
		publishedYear: 1937,
	},
	{
		id: "10",
		title: "Romeo and Juliet",
		author: "William Shakespeare",
		publishedYear: 1597,
	},
	{
		id: "11",
		title: "The Adventures of Huckleberry Finn",
		author: "Mark Twain",
		publishedYear: 1884,
	},
	{
		id: "12",
		title: "The Lord of the Rings",
		author: "J.R.R. Tolkien",
		publishedYear: 1954,
	},
	{
		id: "13",
		title: "Animal Farm",
		author: "George Orwell",
		publishedYear: 1945,
	},
	{
		id: "14",
		title: "Brave New World",
		author: "Aldous Huxley",
		publishedYear: 1932,
	},
	{
		id: "15",
		title: "The Picture of Dorian Gray",
		author: "Oscar Wilde",
		publishedYear: 1890,
	},
	{
		id: "16",
		title: "Crime and Punishment",
		author: "Fyodor Dostoevsky",
		publishedYear: 1866,
	},
	{
		id: "17",
		title: "The Brothers Karamazov",
		author: "Fyodor Dostoevsky",
		publishedYear: 1880,
	},
	{
		id: "18",
		title: "War and Peace",
		author: "Leo Tolstoy",
		publishedYear: 1869,
	},
	{
		id: "19",
		title: "Anna Karenina",
		author: "Leo Tolstoy",
		publishedYear: 1877,
	},
	{ id: "20", title: "The Odyssey", author: "Homer", publishedYear: -800 },
	{ id: "21", title: "The Iliad", author: "Homer", publishedYear: -750 },
	{
		id: "22",
		title: "Hamlet",
		author: "William Shakespeare",
		publishedYear: 1603,
	},
	{
		id: "23",
		title: "Macbeth",
		author: "William Shakespeare",
		publishedYear: 1623,
	},
	{
		id: "24",
		title: "One Hundred Years of Solitude",
		author: "Gabriel García Márquez",
		publishedYear: 1967,
	},
	{
		id: "25",
		title: "The Divine Comedy",
		author: "Dante Alighieri",
		publishedYear: 1320,
	},
	{
		id: "26",
		title: "Don Quixote",
		author: "Miguel de Cervantes",
		publishedYear: 1605,
	},
	{
		id: "27",
		title: "Moby Dick",
		author: "Herman Melville",
		publishedYear: 1851,
	},
	{
		id: "28",
		title: "The Scarlet Letter",
		author: "Nathaniel Hawthorne",
		publishedYear: 1850,
	},
	{
		id: "29",
		title: "The Canterbury Tales",
		author: "Geoffrey Chaucer",
		publishedYear: 1400,
	},
	{
		id: "30",
		title: "Great Expectations",
		author: "Charles Dickens",
		publishedYear: 1861,
	},
	{
		id: "31",
		title: "A Tale of Two Cities",
		author: "Charles Dickens",
		publishedYear: 1859,
	},
	{
		id: "32",
		title: "Oliver Twist",
		author: "Charles Dickens",
		publishedYear: 1838,
	},
	{
		id: "33",
		title: "David Copperfield",
		author: "Charles Dickens",
		publishedYear: 1850,
	},
	{
		id: "34",
		title: "Little Women",
		author: "Louisa May Alcott",
		publishedYear: 1868,
	},
	{
		id: "35",
		title: "The Count of Monte Cristo",
		author: "Alexandre Dumas",
		publishedYear: 1844,
	},
	{
		id: "36",
		title: "Les Misérables",
		author: "Victor Hugo",
		publishedYear: 1862,
	},
	{
		id: "37",
		title: "The Hunchback of Notre-Dame",
		author: "Victor Hugo",
		publishedYear: 1831,
	},
	{
		id: "38",
		title: "Madame Bovary",
		author: "Gustave Flaubert",
		publishedYear: 1857,
	},
	{
		id: "39",
		title: "The Stranger",
		author: "Albert Camus",
		publishedYear: 1942,
	},
	{
		id: "40",
		title: "The Metamorphosis",
		author: "Franz Kafka",
		publishedYear: 1915,
	},
]

async function searchBooks(
	query: string,
	filter: (item: string, query: string) => boolean
): Promise<Book[]> {
	// Simulate network delay
	await new Promise((resolve) => {
		setTimeout(resolve, Math.random() * 400 + 200)
	})

	// Simulate occasional network errors (1% chance)
	if (Math.random() < 0.01 || query === "will_error") {
		throw new Error("Network error")
	}

	return books.filter(
		(book) =>
			filter(book.title, query) ||
			filter(book.author, query) ||
			filter(book.publishedYear.toString(), query)
	)
}
