import { useState, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, BookOpen, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TipTapEditor } from '@/components/editor/TipTapEditor';
import { useJournalStore, getTodayDate, formatJournalDate } from '@/stores/journalStore';
import { cn } from '@/lib/utils';

interface JournalPanelProps {
    className?: string;
}

export function JournalPanel({ className }: JournalPanelProps) {
    const { currentDate, setCurrentDate, getEntry, saveEntry, deleteEntry, getDatesWithEntries } = useJournalStore();
    const entry = getEntry(currentDate);
    const [content, setContent] = useState(entry?.content || '');
    const [showCalendar, setShowCalendar] = useState(false);

    // Parse current date
    const currentDateObj = new Date(currentDate + 'T00:00:00');
    const year = currentDateObj.getFullYear();
    const month = currentDateObj.getMonth();
    const datesWithEntries = getDatesWithEntries(year, month);

    // Sync content when date changes
    useEffect(() => {
        const newEntry = getEntry(currentDate);
        setContent(newEntry?.content || '');
    }, [currentDate, getEntry]);

    // Navigate to previous day
    const goToPreviousDay = useCallback(() => {
        const date = new Date(currentDate + 'T00:00:00');
        date.setDate(date.getDate() - 1);
        setCurrentDate(date.toISOString().split('T')[0]);
    }, [currentDate, setCurrentDate]);

    // Navigate to next day
    const goToNextDay = useCallback(() => {
        const date = new Date(currentDate + 'T00:00:00');
        date.setDate(date.getDate() + 1);
        setCurrentDate(date.toISOString().split('T')[0]);
    }, [currentDate, setCurrentDate]);

    // Go to today
    const goToToday = useCallback(() => {
        setCurrentDate(getTodayDate());
    }, [setCurrentDate]);

    // Auto-save on content change (debounced)
    const handleContentChange = useCallback((newContent: string) => {
        setContent(newContent);
        saveEntry(currentDate, newContent);
    }, [currentDate, saveEntry]);

    // Handle delete
    const handleDelete = useCallback(() => {
        if (window.confirm('Delete this journal entry?')) {
            deleteEntry(currentDate);
            setContent('');
        }
    }, [currentDate, deleteEntry]);

    const isToday = currentDate === getTodayDate();
    const isFuture = new Date(currentDate + 'T00:00:00') > new Date();

    return (
        <div className={cn("flex flex-col h-full", className)}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    <h2 className="font-semibold">Journal</h2>
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={goToPreviousDay} className="w-8 h-8">
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowCalendar(!showCalendar)}
                        className="px-2 text-sm"
                    >
                        <Calendar className="w-4 h-4 mr-1" />
                        {isToday ? 'Today' : currentDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={goToNextDay} className="w-8 h-8" disabled={isFuture}>
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                    {!isToday && (
                        <Button variant="outline" size="sm" onClick={goToToday} className="ml-2">
                            Today
                        </Button>
                    )}
                </div>
            </div>

            {/* Date display */}
            <div className="px-4 py-2 bg-muted/30 border-b border-border">
                <div className="text-sm font-medium">{formatJournalDate(currentDate)}</div>
                {entry && (
                    <div className="text-xs text-muted-foreground mt-1">
                        {entry.wordCount} words • Last edited {new Date(entry.updatedAt).toLocaleTimeString()}
                    </div>
                )}
            </div>

            {/* Mini calendar (collapsible) */}
            {showCalendar && (
                <div className="p-3 border-b border-border bg-muted/20">
                    <MiniCalendar
                        currentDate={currentDate}
                        datesWithEntries={datesWithEntries}
                        onSelectDate={(date) => {
                            setCurrentDate(date);
                            setShowCalendar(false);
                        }}
                    />
                </div>
            )}

            {/* Editor */}
            <div className="flex-1 overflow-auto">
                <TipTapEditor
                    content={content}
                    onChange={handleContentChange}
                    placeholder="Write your thoughts for today..."
                    showToolbar={true}
                />
            </div>

            {/* Footer */}
            {entry && (
                <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-muted/20">
                    <span className="text-xs text-muted-foreground">Auto-save enabled</span>
                    <Button variant="ghost" size="sm" onClick={handleDelete} className="text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                    </Button>
                </div>
            )}
        </div>
    );
}

// Mini calendar component
function MiniCalendar({
    currentDate,
    datesWithEntries,
    onSelectDate,
}: {
    currentDate: string;
    datesWithEntries: string[];
    onSelectDate: (date: string) => void;
}) {
    const [viewDate, setViewDate] = useState(new Date(currentDate + 'T00:00:00'));
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    // Get days in month
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = getTodayDate();

    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => setViewDate(new Date(year, month - 1, 1))}>
                    <ChevronLeft className="w-3 h-3" />
                </Button>
                <span className="text-sm font-medium">
                    {viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => setViewDate(new Date(year, month + 1, 1))}>
                    <ChevronRight className="w-3 h-3" />
                </Button>
            </div>

            <div className="grid grid-cols-7 gap-0.5 text-center text-xs">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                    <div key={d} className="text-muted-foreground py-1">{d}</div>
                ))}
                {days.map((day, i) => {
                    if (!day) return <div key={i} />;
                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const hasEntry = datesWithEntries.includes(dateStr);
                    const isSelected = dateStr === currentDate;
                    const isToday = dateStr === today;
                    const isFuture = new Date(dateStr) > new Date();

                    return (
                        <button
                            key={i}
                            onClick={() => !isFuture && onSelectDate(dateStr)}
                            disabled={isFuture}
                            className={cn(
                                "w-6 h-6 rounded-full text-xs flex items-center justify-center transition-colors",
                                isSelected && "bg-primary text-primary-foreground",
                                !isSelected && isToday && "ring-1 ring-primary",
                                !isSelected && hasEntry && "bg-primary/20",
                                !isSelected && !hasEntry && "hover:bg-muted",
                                isFuture && "opacity-30 cursor-not-allowed"
                            )}
                        >
                            {day}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default JournalPanel;
