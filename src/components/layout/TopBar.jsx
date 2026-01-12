/**
 * Top Bar Component
 * 
 * Premium top bar with global filters, search, and user actions.
 * Works with the FilterProvider to manage dashboard-wide filters.
 * 
 * @module components/layout/TopBar
 */

'use client';

import { useFilters } from '@/providers/filter-provider';
import { DATE_PRESETS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
    CalendarDays,
    Filter,
    X,
    RefreshCw,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { NotificationsBell } from '@/components/notifications/NotificationsBell';

/**
 * TopBar component with global filters.
 * 
 * Features:
 * - Date range picker with presets
 * - Filter dropdowns for region, salesperson, customer, product
 * - Active filter badges
 * - Clear filters button
 * 
 * @param {Object} props - Component props
 * @param {string} [props.title] - Page title to display
 * @param {React.ReactNode} [props.actions] - Additional action buttons
 */
export function TopBar({ title, actions }) {
    const {
        filters,
        setDateRange,
        setDatePreset,
        clearFilters,
        clearFilter,
    } = useFilters();

    const [calendarOpen, setCalendarOpen] = useState(false);

    // Count active filters (excluding default date range)
    const activeFilterCount = [
        filters.salespersonId,
        filters.regionId,
        filters.customerId,
        filters.productId,
    ].filter(Boolean).length;

    const formatDateRange = () => {
        if (!filters.dateRange.from || !filters.dateRange.to) {
            return 'Select dates';
        }

        const from = format(parseISO(filters.dateRange.from), 'MMM dd');
        const to = format(parseISO(filters.dateRange.to), 'MMM dd, yyyy');

        return `${from} - ${to}`;
    };

    const handleDateSelect = (range) => {
        if (range?.from && range?.to) {
            setDateRange(range.from, range.to);
            setCalendarOpen(false);
        }
    };

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            {/* Left: Title */}
            <div className="flex items-center gap-4">
                {title && (
                    <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
                )}
            </div>

            {/* Center/Right: Filters and Actions */}
            <div className="flex items-center gap-3">
                {/* Date Range Picker */}
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                                'h-9 justify-start text-left font-normal',
                                !filters.dateRange.from && 'text-muted-foreground'
                            )}
                        >
                            <CalendarDays className="mr-2 h-4 w-4" />
                            {formatDateRange()}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                        <div className="flex">
                            {/* Presets */}
                            <div className="border-r p-2 space-y-1">
                                {DATE_PRESETS.map((preset) => (
                                    <Button
                                        key={preset.value}
                                        variant={filters.dateRange.preset === preset.value ? 'secondary' : 'ghost'}
                                        size="sm"
                                        className="w-full justify-start text-sm"
                                        onClick={() => {
                                            if (preset.value !== 'custom') {
                                                setDatePreset(preset.value);
                                                setCalendarOpen(false);
                                            }
                                        }}
                                    >
                                        {preset.label}
                                    </Button>
                                ))}
                            </div>
                            {/* Calendar */}
                            <div className="p-2">
                                <Calendar
                                    mode="range"
                                    selected={{
                                        from: filters.dateRange.from ? parseISO(filters.dateRange.from) : undefined,
                                        to: filters.dateRange.to ? parseISO(filters.dateRange.to) : undefined,
                                    }}
                                    onSelect={handleDateSelect}
                                    numberOfMonths={2}
                                />
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>

                <Separator orientation="vertical" className="h-6" />

                {/* Quick Filter Indicator */}
                {activeFilterCount > 0 && (
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="gap-1">
                            <Filter className="h-3 w-3" />
                            {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}
                        </Badge>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-muted-foreground hover:text-foreground"
                            onClick={clearFilters}
                        >
                            <X className="h-3 w-3 mr-1" />
                            Clear
                        </Button>
                    </div>
                )}

                {/* Refresh Button */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    aria-label="Refresh data"
                >
                    <RefreshCw className="h-4 w-4" />
                </Button>

                {/* Notifications Bell */}
                <NotificationsBell />

                {/* Custom Actions */}
                {actions && (
                    <>
                        <Separator orientation="vertical" className="h-6" />
                        {actions}
                    </>
                )}
            </div>
        </header>
    );
}
