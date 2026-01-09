import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, FileText, Image, Highlighter, Folder, Layout, X, Clock, ArrowUp, ArrowDown } from 'lucide-react';
import { search, SearchResultItem, groupResultsByType, SearchableType } from '@/lib/search';
import { useSearchStore } from '@/stores';
import { cn } from '@/lib/utils';

interface GlobalSearchProps {
    isOpen: boolean;
    onClose: () => void;
    onResultClick?: (result: SearchResultItem) => void;
}

// Icon map for result types
const typeIcons: Record<SearchableType, React.ReactNode> = {
    card: <FileText className="w-4 h-4" />,
    file: <Image className="w-4 h-4" />,
    highlight: <Highlighter className="w-4 h-4" />,
    project: <Folder className="w-4 h-4" />,
    board: <Layout className="w-4 h-4" />,
};

// Labels for result types
const typeLabels: Record<SearchableType, string> = {
    card: 'Cards',
    file: 'Files',
    highlight: 'Highlights',
    project: 'Projects',
    board: 'Boards',
};

export const GlobalSearch = ({ isOpen, onClose, onResultClick }: GlobalSearchProps) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [localQuery, setLocalQuery] = useState('');
    const [results, setResults] = useState<SearchResultItem[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const { recentSearches, addRecentSearch, filters, toggleTypeFilter, setFilters } = useSearchStore();

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
            setLocalQuery('');
            setResults([]);
            setSelectedIndex(0);
        }
    }, [isOpen]);

    // Handle search
    const handleSearch = useCallback((query: string) => {
        setLocalQuery(query);
        if (query.trim().length > 0) {
            const searchResults = search(query, {
                types: filters.types.length > 0 ? filters.types as SearchableType[] : undefined,
                limit: 20,
            });
            setResults(searchResults);
            setSelectedIndex(0);
        } else {
            setResults([]);
        }
    }, [filters.types]);

    // Handle keyboard navigation
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => Math.max(prev - 1, 0));
                break;
            case 'Enter':
                e.preventDefault();
                if (results[selectedIndex]) {
                    addRecentSearch(localQuery);
                    onResultClick?.(results[selectedIndex]);
                    onClose();
                }
                break;
            case 'Escape':
                onClose();
                break;
        }
    }, [results, selectedIndex, localQuery, addRecentSearch, onResultClick, onClose]);

    // Group results by type for display
    const groupedResults = groupResultsByType(results);
    const typeOrder: SearchableType[] = ['card', 'file', 'highlight', 'project', 'board'];

    // Build flat list with headers for navigation
    const flatList: { type: 'header' | 'result'; data: string | SearchResultItem; index: number }[] = [];
    let flatIndex = 0;
    typeOrder.forEach(type => {
        const items = groupedResults[type];
        if (items.length > 0) {
            flatList.push({ type: 'header', data: typeLabels[type], index: -1 });
            items.forEach(item => {
                flatList.push({ type: 'result', data: item, index: flatIndex++ });
            });
        }
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-start justify-center pt-[15vh]">
            {/* Backdrop click to close */}
            <div className="absolute inset-0" onClick={onClose} />

            {/* Search modal */}
            <div className="relative w-full max-w-xl bg-popover border border-border rounded-xl shadow-2xl overflow-hidden animate-scale-in">
                {/* Search input */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                    <Search className="w-5 h-5 text-muted-foreground" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={localQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search cards, files, highlights..."
                        className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-sm"
                    />
                    <kbd className="hidden sm:inline-flex px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground bg-muted rounded">
                        ESC
                    </kbd>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Filter chips */}
                <div className="flex items-center gap-2 px-4 py-2 border-b border-border flex-wrap">
                    {/* Type filters */}
                    {typeOrder.map(type => (
                        <button
                            key={type}
                            onClick={() => toggleTypeFilter(type)}
                            className={cn(
                                "flex items-center gap-1.5 px-2 py-1 text-xs rounded-full transition-colors",
                                filters.types.includes(type)
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                            )}
                        >
                            {typeIcons[type]}
                            {typeLabels[type]}
                        </button>
                    ))}

                    {/* Separator */}
                    <div className="w-px h-4 bg-border mx-1" />

                    {/* Date filter */}
                    <select
                        value={filters.dateFrom ? 'custom' : 'all'}
                        onChange={(e) => {
                            const value = e.target.value;
                            if (value === 'all') {
                                setFilters({ dateFrom: undefined, dateTo: undefined });
                            } else if (value === 'today') {
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                setFilters({ dateFrom: today.getTime(), dateTo: Date.now() });
                            } else if (value === 'week') {
                                const week = new Date();
                                week.setDate(week.getDate() - 7);
                                setFilters({ dateFrom: week.getTime(), dateTo: Date.now() });
                            } else if (value === 'month') {
                                const month = new Date();
                                month.setMonth(month.getMonth() - 1);
                                setFilters({ dateFrom: month.getTime(), dateTo: Date.now() });
                            }
                        }}
                        className="px-2 py-1 text-xs rounded-md bg-muted/50 text-muted-foreground border-none outline-none cursor-pointer hover:bg-muted"
                    >
                        <option value="all">Any time</option>
                        <option value="today">Today</option>
                        <option value="week">Past week</option>
                        <option value="month">Past month</option>
                    </select>
                </div>

                {/* Results */}
                <div className="max-h-[50vh] overflow-y-auto">
                    {localQuery.trim() === '' ? (
                        // Recent searches
                        <div className="p-2">
                            {recentSearches.length > 0 ? (
                                <>
                                    <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground">
                                        <Clock className="w-3 h-3" />
                                        Recent Searches
                                    </div>
                                    {recentSearches.map((recent, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleSearch(recent)}
                                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left rounded-md hover:bg-muted/50 transition-colors"
                                        >
                                            <Search className="w-4 h-4 text-muted-foreground" />
                                            {recent}
                                        </button>
                                    ))}
                                </>
                            ) : (
                                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                                    Start typing to search...
                                </div>
                            )}
                        </div>
                    ) : results.length === 0 ? (
                        <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                            No results found for "{localQuery}"
                        </div>
                    ) : (
                        <div className="p-2">
                            {flatList.map((item, idx) => {
                                if (item.type === 'header') {
                                    return (
                                        <div key={`header-${idx}`} className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground font-medium mt-2 first:mt-0">
                                            {typeIcons[(item.data as string).toLowerCase().replace('s', '') as SearchableType]}
                                            {item.data as string}
                                        </div>
                                    );
                                }
                                const result = item.data as SearchResultItem;
                                return (
                                    <button
                                        key={result.id}
                                        onClick={() => {
                                            addRecentSearch(localQuery);
                                            onResultClick?.(result);
                                            onClose();
                                        }}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-3 py-2 text-sm text-left rounded-md transition-colors",
                                            selectedIndex === item.index
                                                ? "bg-primary/10 text-foreground"
                                                : "hover:bg-muted/50 text-foreground"
                                        )}
                                    >
                                        <div className="text-muted-foreground">
                                            {typeIcons[result.type]}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="truncate font-medium">{result.title || 'Untitled'}</div>
                                            {result.preview && (
                                                <div className="truncate text-xs text-muted-foreground">{result.preview}</div>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer with hints */}
                {results.length > 0 && (
                    <div className="flex items-center justify-between px-4 py-2 border-t border-border text-xs text-muted-foreground">
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                                <ArrowUp className="w-3 h-3" />
                                <ArrowDown className="w-3 h-3" />
                                to navigate
                            </span>
                            <span className="flex items-center gap-1">
                                <kbd className="px-1 bg-muted rounded text-[10px]">↵</kbd>
                                to select
                            </span>
                        </div>
                        <span>{results.length} result{results.length !== 1 ? 's' : ''}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GlobalSearch;
