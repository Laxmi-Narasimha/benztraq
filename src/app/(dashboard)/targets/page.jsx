/**
 * Targets Page
 * 
 * Manage annual targets and view performance vs targets.
 * Directors/Head of Sales can set targets; ASMs can view their targets.
 * 
 * @module app/(dashboard)/targets/page
 */

'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Target,
    Plus,
    TrendingUp,
    Users,
    Loader2,
    ChevronDown,
    ChevronUp,
    AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatCurrency(value, compact = false) {
    if (compact) {
        if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
        if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
        if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
    }
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
}

function formatPercent(value) {
    return `${Math.round(value)}%`;
}

/**
 * Progress bar with color coding based on achievement.
 */
function TargetProgress({ achieved, target }) {
    const percent = target > 0 ? (achieved / target) * 100 : 0;
    const clampedPercent = Math.min(percent, 100);

    let colorClass = 'bg-red-500';
    if (percent >= 100) colorClass = 'bg-emerald-500';
    else if (percent >= 75) colorClass = 'bg-yellow-500';
    else if (percent >= 50) colorClass = 'bg-orange-500';

    return (
        <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
                <span>Achieved: {formatCurrency(achieved, true)}</span>
                <span className="font-semibold text-foreground">{formatPercent(percent)}</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                    className={cn('h-full rounded-full transition-all duration-500', colorClass)}
                    style={{ width: `${clampedPercent}%` }}
                />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
                <span>Target: {formatCurrency(target, true)}</span>
                <span className={percent >= 100 ? 'text-emerald-600' : 'text-red-500'}>
                    Gap: {formatCurrency(Math.max(0, target - achieved), true)}
                </span>
            </div>
        </div>
    );
}

/**
 * Monthly breakdown visualization
 */
function MonthlyBreakdown({ annualTarget, achieved }) {
    const monthlyTarget = annualTarget / 12;

    return (
        <div className="grid grid-cols-12 gap-1 mt-4">
            {MONTHS.map((month, idx) => {
                const monthNum = idx + 1;
                const monthAchieved = achieved[monthNum] || 0;
                const percent = monthlyTarget > 0 ? (monthAchieved / monthlyTarget) * 100 : 0;
                const isCurrent = monthNum === currentMonth;
                const isPast = monthNum < currentMonth;

                let bgColor = 'bg-muted';
                if (isPast || isCurrent) {
                    if (percent >= 100) bgColor = 'bg-emerald-500';
                    else if (percent >= 75) bgColor = 'bg-yellow-500';
                    else if (percent >= 50) bgColor = 'bg-orange-400';
                    else if (percent > 0) bgColor = 'bg-red-400';
                    else bgColor = 'bg-red-200';
                }

                return (
                    <div key={month} className="text-center">
                        <div
                            className={cn(
                                "h-8 rounded-sm flex items-end justify-center overflow-hidden relative",
                                isCurrent && "ring-2 ring-primary ring-offset-1"
                            )}
                            style={{ backgroundColor: 'var(--muted)' }}
                        >
                            <div
                                className={cn("w-full transition-all", bgColor)}
                                style={{ height: `${Math.min(100, percent)}%` }}
                            />
                        </div>
                        <span className={cn(
                            "text-[10px]",
                            isCurrent ? "font-bold text-primary" : "text-muted-foreground"
                        )}>
                            {month}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

/**
 * Set Target Dialog
 */
function SetTargetDialog({ open, onOpenChange, onSave, salespeople, existingTargets }) {
    const [selectedSalesperson, setSelectedSalesperson] = useState('');
    const [year, setYear] = useState(currentYear.toString());
    const [annualTarget, setAnnualTarget] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Pre-fill target if editing existing
    useEffect(() => {
        if (selectedSalesperson && year) {
            const existing = existingTargets.find(
                t => t.salespersonId === selectedSalesperson && t.year === parseInt(year)
            );
            if (existing) {
                setAnnualTarget(existing.annualTarget.toString());
            } else {
                setAnnualTarget('');
            }
        }
    }, [selectedSalesperson, year, existingTargets]);

    const handleSave = async () => {
        if (!selectedSalesperson || !year || !annualTarget) return;

        setIsSaving(true);
        try {
            await onSave({
                salespersonId: selectedSalesperson,
                year: parseInt(year),
                annualTarget: parseFloat(annualTarget),
            });
            onOpenChange(false);
            setSelectedSalesperson('');
            setAnnualTarget('');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Set Annual Target</DialogTitle>
                    <DialogDescription>
                        Set the annual sales target for a salesperson.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Salesperson</Label>
                        <Select value={selectedSalesperson} onValueChange={setSelectedSalesperson}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select salesperson" />
                            </SelectTrigger>
                            <SelectContent>
                                {salespeople.map((sp) => (
                                    <SelectItem key={sp.id} value={sp.id}>
                                        {sp.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Year</Label>
                        <Select value={year} onValueChange={setYear}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                                    <SelectItem key={y} value={y.toString()}>
                                        {y}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Annual Target (₹)</Label>
                        <Input
                            type="number"
                            placeholder="e.g., 6000000"
                            value={annualTarget}
                            onChange={(e) => setAnnualTarget(e.target.value)}
                        />
                        {annualTarget && (
                            <p className="text-xs text-muted-foreground">
                                Monthly target: {formatCurrency(parseFloat(annualTarget) / 12, true)}
                            </p>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={!selectedSalesperson || !annualTarget || isSaving}>
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        {existingTargets.find(t => t.salespersonId === selectedSalesperson && t.year === parseInt(year))
                            ? 'Update Target'
                            : 'Set Target'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function TargetsPage() {
    const { isManager, isDirector, user } = useAuth();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [expandedId, setExpandedId] = useState(null);
    const [selectedYear, setSelectedYear] = useState(currentYear);

    const [targets, setTargets] = useState([]);
    const [salespeople, setSalespeople] = useState([]);
    const [canSetTargets, setCanSetTargets] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchTargets = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/targets?year=${selectedYear}`);
            const data = await res.json();
            if (res.ok) {
                setTargets(data.targets || []);
                setSalespeople(data.availableSalespeople || []);
                setCanSetTargets(data.canSetTargets || false);
            } else {
                setError(data.error || 'Failed to load targets');
            }
        } catch (err) {
            setError('Network error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTargets();
    }, [selectedYear]);

    const handleSetTarget = async (data) => {
        try {
            const res = await fetch('/api/targets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            const result = await res.json();
            if (res.ok) {
                toast.success('Target saved successfully');
                fetchTargets();
            } else {
                toast.error(result.error || 'Failed to save target');
            }
        } catch (err) {
            toast.error('Network error');
        }
    };

    // Calculate totals
    const totalTarget = targets.reduce((sum, t) => sum + t.annualTarget, 0);
    const totalAchieved = targets.reduce((sum, t) => sum + t.totalAchieved, 0);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Targets</h1>
                    <p className="text-muted-foreground">
                        {canSetTargets
                            ? 'Set and monitor team sales targets'
                            : 'View your sales targets and progress'}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                        <SelectTrigger className="w-[100px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {canSetTargets && (
                        <Button onClick={() => setDialogOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Set Target
                        </Button>
                    )}
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary/10 rounded-lg">
                                <Target className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Team Target</p>
                                <p className="text-2xl font-bold">{formatCurrency(totalTarget, true)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-emerald-100 rounded-lg">
                                <TrendingUp className="h-6 w-6 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Achieved (YTD)</p>
                                <p className="text-2xl font-bold">{formatCurrency(totalAchieved, true)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <Users className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Team Members with Targets</p>
                                <p className="text-2xl font-bold">{targets.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Salesperson Targets */}
            <div className="space-y-4">
                {targets.length > 0 ? (
                    targets.map((target) => {
                        const isExpanded = expandedId === target.id;
                        const percent = target.annualTarget > 0
                            ? (target.totalAchieved / target.annualTarget) * 100
                            : 0;

                        return (
                            <Card key={target.id} className="overflow-hidden">
                                <CardHeader
                                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                                    onClick={() => setExpandedId(isExpanded ? null : target.id)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium",
                                                percent >= 100 ? "bg-emerald-100 text-emerald-700" :
                                                    percent >= 75 ? "bg-yellow-100 text-yellow-700" :
                                                        percent >= 50 ? "bg-orange-100 text-orange-700" :
                                                            "bg-red-100 text-red-700"
                                            )}>
                                                {formatPercent(percent)}
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg">{target.salespersonName}</CardTitle>
                                                <CardDescription>
                                                    FY {target.year} | Target: {formatCurrency(target.annualTarget, true)}
                                                </CardDescription>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={percent >= 100 ? 'default' : percent >= 75 ? 'secondary' : 'outline'}>
                                                {formatCurrency(target.totalAchieved, true)} achieved
                                            </Badge>
                                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <TargetProgress achieved={target.totalAchieved} target={target.annualTarget} />

                                    {isExpanded && (
                                        <div className="mt-6 pt-4 border-t">
                                            <h4 className="font-semibold text-sm mb-2">Monthly Performance</h4>
                                            <MonthlyBreakdown
                                                annualTarget={target.annualTarget}
                                                achieved={target.achieved}
                                            />
                                            <div className="mt-3 grid grid-cols-6 md:grid-cols-12 gap-2 text-xs">
                                                {MONTHS.map((month, idx) => {
                                                    const monthNum = idx + 1;
                                                    const val = target.achieved[monthNum] || 0;
                                                    return (
                                                        <div key={month} className="text-center">
                                                            <div className="font-medium">{formatCurrency(val, true)}</div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })
                ) : (
                    <Card>
                        <CardContent className="py-12 text-center text-muted-foreground">
                            <Target className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p className="font-medium">No targets set for {selectedYear}</p>
                            {canSetTargets && (
                                <p className="text-sm mt-1">Click "Set Target" to get started.</p>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Set Target Dialog */}
            <SetTargetDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onSave={handleSetTarget}
                salespeople={salespeople}
                existingTargets={targets}
            />
        </div>
    );
}
