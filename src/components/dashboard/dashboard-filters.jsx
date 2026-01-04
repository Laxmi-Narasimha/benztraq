"use client";

import * as React from "react";
import { format, subDays, startOfMonth, startOfYear, endOfMonth, endOfYear } from "date-fns";
import { Calendar as CalendarIcon, Filter, Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export function DashboardFilters({
    availableUsers = [],
    selectedUsers = [],
    onUserChange,
    dateRange,
    onDateChange
}) {
    const [openUserSelect, setOpenUserSelect] = React.useState(false);
    const [openDateSelect, setOpenDateSelect] = React.useState(false);

    // Date Presets
    const presets = [
        {
            label: 'This Month',
            getValue: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) })
        },
        {
            label: 'This Year',
            getValue: () => ({ from: startOfYear(new Date()), to: endOfYear(new Date()) })
        },
        {
            label: 'Last 30 Days',
            getValue: () => ({ from: subDays(new Date(), 30), to: new Date() })
        }
    ];

    const handleSelectUser = (userId) => {
        const newSelected = selectedUsers.includes(userId)
            ? selectedUsers.filter((id) => id !== userId)
            : [...selectedUsers, userId];
        onUserChange(newSelected);
    };

    return (
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center p-1">
            {/* Date Range Picker */}
            <Popover open={openDateSelect} onOpenChange={setOpenDateSelect}>
                <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className={cn(
                            "w-[240px] justify-start text-left font-normal",
                            !dateRange && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                            dateRange.to ? (
                                <>
                                    {format(dateRange.from, "LLL dd, y")} -{" "}
                                    {format(dateRange.to, "LLL dd, y")}
                                </>
                            ) : (
                                format(dateRange.from, "LLL dd, y")
                            )
                        ) : (
                            <span>Pick a date</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <div className="flex">
                        <div className="p-3 border-r w-[140px] space-y-2">
                            <p className="text-xs font-semibold text-muted-foreground mb-2">Presets</p>
                            {presets.map(preprint => (
                                <Button
                                    key={preprint.label}
                                    variant="ghost"
                                    className="w-full justify-start h-8 text-sm"
                                    onClick={() => {
                                        onDateChange(preprint.getValue());
                                        setOpenDateSelect(false);
                                    }}
                                >
                                    {preprint.label}
                                </Button>
                            ))}
                        </div>
                        <div className="p-3">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={dateRange?.from}
                                selected={dateRange}
                                onSelect={onDateChange}
                                numberOfMonths={2}
                            />
                        </div>
                    </div>
                </PopoverContent>
            </Popover>

            {/* Salesperson Multi-Select */}
            {availableUsers.length > 0 && (
                <Popover open={openUserSelect} onOpenChange={setOpenUserSelect}>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="h-10 border-dashed">
                            <Filter className="mr-2 h-4 w-4" />
                            Salespeople
                            {selectedUsers?.length > 0 && (
                                <>
                                    <Separator orientation="vertical" className="mx-2 h-4" />
                                    <Badge variant="secondary" className="rounded-sm px-1 font-normal lg:hidden">
                                        {selectedUsers.length}
                                    </Badge>
                                    <div className="hidden space-x-1 lg:flex">
                                        {selectedUsers.length > 2 ? (
                                            <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                                                {selectedUsers.length} selected
                                            </Badge>
                                        ) : (
                                            availableUsers
                                                .filter((u) => selectedUsers.includes(u.id))
                                                .map((u) => (
                                                    <Badge
                                                        key={u.id}
                                                        variant="secondary"
                                                        className="rounded-sm px-1 font-normal"
                                                    >
                                                        {u.name}
                                                    </Badge>
                                                ))
                                        )}
                                    </div>
                                </>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0" align="start">
                        <Command>
                            <CommandInput placeholder="Filter team..." />
                            <CommandList>
                                <CommandEmpty>No results found.</CommandEmpty>
                                <CommandGroup>
                                    {availableUsers.map((user) => {
                                        const isSelected = selectedUsers.includes(user.id);
                                        return (
                                            <CommandItem
                                                key={user.id}
                                                onSelect={() => handleSelectUser(user.id)}
                                            >
                                                <div
                                                    className={cn(
                                                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                                        isSelected
                                                            ? "bg-primary text-primary-foreground"
                                                            : "opacity-50 [&_svg]:invisible"
                                                    )}
                                                >
                                                    <Check className={cn("h-4 w-4")} />
                                                </div>
                                                <span>{user.name}</span>
                                            </CommandItem>
                                        );
                                    })}
                                </CommandGroup>
                                {selectedUsers.length > 0 && (
                                    <>
                                        <CommandSeparator />
                                        <CommandGroup>
                                            <CommandItem
                                                onSelect={() => onUserChange([])}
                                                className="justify-center text-center"
                                            >
                                                Clear filters
                                            </CommandItem>
                                        </CommandGroup>
                                    </>
                                )}
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            )}
        </div>
    );
}
