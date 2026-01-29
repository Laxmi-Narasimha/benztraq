/**
 * Premium Top Bar Component
 * 
 * Modern top bar with:
 * - Breadcrumb navigation
 * - Command palette trigger (⌘K)
 * - Smart date picker with presets
 * - Notification center
 * - Premium visual styling
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
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
    CalendarDays,
    Filter,
    X,
    RefreshCw,
    Search,
    Command,
    ChevronRight,
    Sparkles,
    Bell,
    Check,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { NotificationsBell } from '@/components/notifications/NotificationsBell';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

/**
 * Breadcrumb data based on path
 */
const getBreadcrumbs = (pathname) => {
    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs = [{ label: 'Home', href: '/dashboard' }];

    let currentPath = '';
    segments.forEach((segment, index) => {
        currentPath += `/${segment}`;
        const label = segment
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

        breadcrumbs.push({
            label,
            href: currentPath,
            isLast: index === segments.length - 1
        });
    });

    return breadcrumbs;
};

/**
 * Breadcrumb Navigation Component
 */
function Breadcrumbs() {
    const pathname = usePathname();
    const breadcrumbs = getBreadcrumbs(pathname);

    if (breadcrumbs.length <= 1) return null;

    return (
        <nav className="hidden md:flex items-center gap-1 text-sm">
            {breadcrumbs.map((crumb, index) => (
                <div key={`${crumb.href}-${index}`} className="flex items-center gap-1">
                    {index > 0 && (
                        <ChevronRight className="w-3.5 h-3.5 text-stone-300 dark:text-stone-600" />
                    )}
                    {crumb.isLast ? (
                        <span className="font-medium text-stone-700 dark:text-stone-200">
                            {crumb.label}
                        </span>
                    ) : (
                        <Link
                            href={crumb.href}
                            className="text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300 transition-colors"
                        >
                            {crumb.label}
                        </Link>
                    )}
                </div>
            ))}
        </nav>
    );
}

/**
 * Command Palette Trigger
 */
function CommandTrigger() {
    return (
        <button
            className={cn(
                'hidden lg:flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200',
                'bg-stone-100/80 hover:bg-stone-200/80 border border-stone-200/50',
                'dark:bg-stone-800/50 dark:hover:bg-stone-800 dark:border-stone-700/50',
                'text-stone-500 dark:text-stone-400 text-sm',
                'min-w-[220px]'
            )}
        >
            <Search className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1 text-left">Search anything...</span>
            <kbd className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 text-xs font-medium text-stone-400">
                <Command className="w-3 h-3" />
                <span>K</span>
            </kbd>
        </button>
    );
}

/**
 * Premium Date Range Picker
 */
function DateRangePicker({ filters, setDateRange, setDatePreset }) {
    const [calendarOpen, setCalendarOpen] = useState(false);

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
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
                <button
                    className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                        'bg-white hover:bg-stone-50 border border-stone-200',
                        'dark:bg-stone-800 dark:hover:bg-stone-700 dark:border-stone-700',
                        'text-stone-700 dark:text-stone-200',
                        'shadow-premium-sm hover:shadow-premium'
                    )}
                >
                    <CalendarDays className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <span>{formatDateRange()}</span>
                </button>
            </PopoverTrigger>
            <PopoverContent
                className="w-auto p-0 shadow-premium-xl border-stone-200 dark:border-stone-700 rounded-2xl overflow-hidden"
                align="end"
            >
                <div className="flex">
                    {/* Presets */}
                    <div className="w-40 border-r border-stone-100 dark:border-stone-800 p-2 bg-stone-50/50 dark:bg-stone-900/50">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 px-2 py-1.5 mb-1">
                            Quick Select
                        </div>
                        {DATE_PRESETS.map((preset) => (
                            <button
                                key={preset.value}
                                className={cn(
                                    'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all duration-150',
                                    filters.dateRange.preset === preset.value
                                        ? 'bg-teal-500 text-white font-medium'
                                        : 'text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800'
                                )}
                                onClick={() => {
                                    if (preset.value !== 'custom') {
                                        setDatePreset(preset.value);
                                        setCalendarOpen(false);
                                    }
                                }}
                            >
                                <span>{preset.label}</span>
                                {filters.dateRange.preset === preset.value && (
                                    <Check className="w-4 h-4" />
                                )}
                            </button>
                        ))}
                    </div>
                    {/* Calendar */}
                    <div className="p-3">
                        <Calendar
                            mode="range"
                            selected={{
                                from: filters.dateRange.from ? parseISO(filters.dateRange.from) : undefined,
                                to: filters.dateRange.to ? parseISO(filters.dateRange.to) : undefined,
                            }}
                            onSelect={handleDateSelect}
                            numberOfMonths={2}
                            className="rounded-xl"
                        />
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}

/**
 * Filter Badge with Clear
 */
function ActiveFilters({ filters, clearFilters }) {
    const activeFilterCount = [
        filters.salespersonId,
        filters.regionId,
        filters.customerId,
        filters.productId,
    ].filter(Boolean).length;

    if (activeFilterCount === 0) return null;

    return (
        <div className="flex items-center gap-2">
            <div className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium',
                'bg-teal-50 text-teal-700 border border-teal-200',
                'dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800'
            )}>
                <Filter className="w-3 h-3" />
                <span>{activeFilterCount} active</span>
            </div>
            <button
                onClick={clearFilters}
                className={cn(
                    'flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors',
                    'text-stone-500 hover:text-stone-700 hover:bg-stone-100',
                    'dark:text-stone-400 dark:hover:text-stone-200 dark:hover:bg-stone-800'
                )}
            >
                <X className="w-3 h-3" />
                <span>Clear</span>
            </button>
        </div>
    );
}

/**
 * TopBar component with global filters.
 */
export function TopBar({ title, actions }) {
    const {
        filters,
        setDateRange,
        setDatePreset,
        clearFilters,
    } = useFilters();

    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        // Trigger data refresh - typically through React Query refetch
        window.dispatchEvent(new CustomEvent('refresh-data'));
        setTimeout(() => setIsRefreshing(false), 1000);
    };

    return (
        <header className={cn(
            'sticky top-0 z-30 h-16',
            'flex items-center justify-between gap-4 px-6',
            'bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl',
            'border-b border-stone-200/80 dark:border-stone-800'
        )}>
            {/* Left: Breadcrumbs or Title */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
                <Breadcrumbs />
                {title && (
                    <h1 className="md:hidden text-lg font-semibold text-stone-800 dark:text-white truncate">
                        {title}
                    </h1>
                )}
            </div>

            {/* Center: Command Palette */}
            <div className="hidden xl:block">
                <CommandTrigger />
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
                {/* Date Range */}
                <DateRangePicker
                    filters={filters}
                    setDateRange={setDateRange}
                    setDatePreset={setDatePreset}
                />

                {/* Active Filters */}
                <ActiveFilters filters={filters} clearFilters={clearFilters} />

                <div className="hidden sm:block w-px h-6 bg-stone-200 dark:bg-stone-700 mx-1" />

                {/* Refresh */}
                <button
                    onClick={handleRefresh}
                    className={cn(
                        'p-2 rounded-lg transition-all duration-200',
                        'text-stone-400 hover:text-stone-600 hover:bg-stone-100',
                        'dark:text-stone-500 dark:hover:text-stone-300 dark:hover:bg-stone-800',
                        isRefreshing && 'animate-spin'
                    )}
                    aria-label="Refresh data"
                >
                    <RefreshCw className="w-4 h-4" />
                </button>

                {/* Notifications */}
                <NotificationsBell />

                {/* Custom Actions */}
                {actions && (
                    <>
                        <div className="hidden sm:block w-px h-6 bg-stone-200 dark:bg-stone-700 mx-1" />
                        <div className="flex items-center gap-2">
                            {actions}
                        </div>
                    </>
                )}
            </div>
        </header>
    );
}
