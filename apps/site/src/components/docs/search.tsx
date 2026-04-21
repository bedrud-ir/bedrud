import { Search as SearchIcon, X } from "lucide-react";
import MiniSearch from "minisearch";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";

const SEARCH_OPTIONS = {
  prefix: true,
  fuzzy: 0.2,
  boost: { title: 3, description: 2 },
} as const;

const RESULT_LIMIT = 12;

interface SearchDoc {
  id: string;
  title: string;
  description: string;
}

interface SearchProps {
  lang: string;
  className?: string;
  placeholder: string;
  buttonText: string;
  noResultsText: string;
  loadingText: string;
  clearSearchLabel: string;
  searchResultsLabel: string;
  searchDocsLabel: string;
  errorText: string;
}

function getResultHref(lang: string, id: string): string {
  const colonIdx = id.indexOf(":");
  if (colonIdx === -1) return `/${lang}/docs/${id}`;
  const type = id.slice(0, colonIdx);
  const slug = id.slice(colonIdx + 1);
  return type === "blog" ? `/${lang}/blog/${slug}` : `/${lang}/docs/${slug}`;
}

export function Search({
  lang,
  className,
  placeholder,
  buttonText,
  noResultsText,
  loadingText,
  clearSearchLabel,
  searchResultsLabel,
  searchDocsLabel,
  errorText,
}: SearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchDoc[]>([]);
  const [open, setOpen] = useState(false);
  const [indexLoaded, setIndexLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isMac, setIsMac] = useState(false);
  const searchIndexRef = useRef<MiniSearch | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const selectedIndexRef = useRef(selectedIndex);
  const abortRef = useRef<AbortController | null>(null);

  selectedIndexRef.current = selectedIndex;

  useEffect(() => {
    setIsMac(navigator.platform?.toUpperCase().includes("MAC") ?? false);
  }, []);

  const loadIndex = useCallback(async () => {
    if (indexLoaded || loading) return;
    setLoading(true);
    setError(false);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const response = await fetch(`/search-index-${lang}.json`, {
        signal: controller.signal,
      });
      if (!response.ok) throw new Error("Failed to load search index");
      const json = await response.json();
      searchIndexRef.current = MiniSearch.loadJS(json, {
        fields: ["title", "description", "text"],
        storeFields: ["title", "description"],
        idField: "id",
        searchOptions: SEARCH_OPTIONS,
      });
      setIndexLoaded(true);
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      console.error("Error loading search index:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [indexLoaded, loading, lang]);

  useEffect(() => {
    if (open) {
      loadIndex();
    }
  }, [open, loadIndex]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!searchIndexRef.current || !query) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      try {
        if (searchIndexRef.current) {
          const raw = searchIndexRef.current.search(query, {
            ...SEARCH_OPTIONS,
          });
          const searchResults = raw.slice(0, RESULT_LIMIT).map((r) => ({
            id: r.id as string,
            title: r.title as string,
            description: r.description as string,
          }));
          setResults(searchResults);
          setSelectedIndex(0);
        }
      } catch (err) {
        console.error("Search error:", err);
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
      if (open && results.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedIndex((i) => Math.max(i - 1, 0));
        } else if (e.key === "Enter" && selectedIndexRef.current >= 0) {
          e.preventDefault();
          itemRefs.current[selectedIndexRef.current]?.click();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, results]);

  useEffect(() => {
    if (selectedIndex >= 0 && itemRefs.current[selectedIndex]) {
      itemRefs.current[selectedIndex]?.scrollIntoView({
        block: "nearest",
        behavior: "instant",
      });
    }
  }, [selectedIndex]);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  const hasResults = results.length > 0;
  const hasQuery = query.length > 0;

  const inputElement = (
    <div className={cn("relative", className)}>
      <SearchIcon
        className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        ref={inputRef}
        type="search"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="ps-9 border-0 focus-visible:ring-2 focus-visible:ring-ring"
      />
      {hasQuery && (
        <button
          type="button"
          onClick={() => setQuery("")}
          className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label={clearSearchLabel}
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 [&>button]:hidden">
          <DialogTitle className="sr-only">{searchDocsLabel}</DialogTitle>
          <DialogDescription className="sr-only">
            {placeholder}
          </DialogDescription>
          <div className="flex flex-col">
            {inputElement}
            <div
              ref={resultsRef}
              className="mt-2 max-h-96 overflow-y-auto px-1 scroll-area"
              role="listbox"
              aria-label={searchResultsLabel}
            >
              {hasResults && (
                <div className="space-y-1">
                  {results.map((result, i) => (
                    <a
                      key={result.id}
                      ref={(el) => {
                        itemRefs.current[i] = el;
                      }}
                      href={getResultHref(lang, result.id)}
                      className={cn(
                        "block rounded-md px-3 py-2 text-sm transition-colors",
                        i === selectedIndex
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground",
                      )}
                      role="option"
                      aria-selected={i === selectedIndex}
                      onClick={() => setOpen(false)}
                    >
                      <div className="font-medium">{result.title}</div>
                      {result.description && (
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          {result.description}
                        </div>
                      )}
                    </a>
                  ))}
                </div>
              )}
              {error && (
                <div className="px-3 py-2 text-sm text-destructive">
                  {errorText}
                </div>
              )}
              {hasQuery && !hasResults && !loading && !error && (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  {noResultsText}
                </div>
              )}
              {loading && (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  {loadingText}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden lg:flex items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        aria-label={searchDocsLabel}
      >
        <SearchIcon className="size-4" aria-hidden="true" />
        <span>{buttonText}</span>
        <kbd className="ms-auto rounded bg-muted px-1.5 py-0.5 text-xs">
          {isMac ? "⌘" : "Ctrl"}&nbsp;K
        </kbd>
      </button>
    </>
  );
}
