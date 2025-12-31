/**
 * Targets Page
 * 
 * Manage annual targets and view monthly breakdown with carryover logic.
 * VP/Director can set targets; all users can view their targets.
 * 
 * @module app/(dashboard)/targets/page
 */

'use client';

// Force dynamic rendering to avoid SSR issues
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Target,
    Plus,
    TrendingUp,
    TrendingDown,
    Calendar,
    Users,
} from 'lucide-react';
import { formatCurrency, formatPercent } from '@/lib/utils/formatting';
import { calculateYearlyTargetBreakdown } from '@/lib/utils/calculations';
import { cn } from '@/lib/utils';

// Mock data
const mockSalespeople = [
    { id: '1', name: 'Rahul Sharma', region: 'Maharashtra' },
    { id: '2', name: 'Priya Patel', region: 'Gurgaon' },
    { id: '3', name: 'Amit Kumar', region: 'Chennai' },
    { id: '4', name: 'Sneha Gupta', region: 'Noida' },
    { id: '5', name: 'Vikram Singh', region: 'Jaipur' },
];

const mockTargetsData = [
    {
        salesperson: 'Rahul Sharma',
        annualTarget: 6000000,
        achieved: { 1: 450000, 2: 520000, 3: 480000, 4: 550000, 5: 610000, 6: 490000, 7: 620000, 8: 580000, 9: 540000, 10: 580000, 11: 520000, 12: 290000 }
    },
    {
        salesperson: 'Priya Patel',
        annualTarget: 4800000,
        achieved: { 1: 380000, 2: 420000, 3: 390000, 4: 450000, 5: 480000, 6: 410000, 7: 500000, 8: 460000, 9: 420000, 10: 480000, 11: 400000, 12: 220000 }
    },
    {
        salesperson: 'Amit Kumar',
        annualTarget: 5400000,
        achieved: { 1: 420000, 2: 480000, 3: 450000, 4: 520000, 5: 560000, 6: 440000, 7: 580000, 8: 550000, 9: 490000, 10: 540000, 11: 480000, 12: 260000 }
    },
];

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

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
        <div className="space-y-1">
            <div className="flex justify-between text-sm">
                <span>Achieved: {formatCurrency(achieved, { compact: true })}</span>
                <span className="font-medium">{formatPercent(percent)}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                    className={cn('h-full rounded-full transition-all', colorClass)}
                    style={{ width: `${clampedPercent}%` }}
                />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
                <span>Target: {formatCurrency(target, { compact: true })}</span>
                <span>Gap: {formatCurrency(Math.max(0, target - achieved), { compact: true })}</span>
            </div>
        </div>
    );
}

/**
 * Set Target Dialog.
 */
function SetTargetDialog({ open, onOpenChange, onSave }) {
    const [selectedSalesperson, setSelectedSalesperson] = useState('');
    const [year, setYear] = useState(currentYear.toString());
    const [annualTarget, setAnnualTarget] = useState('');

    const handleSave = () => {
        if (selectedSalesperson && year && annualTarget) {
            onSave({
                salespersonId: selectedSalesperson,
                year: parseInt(year),
                annualTarget: parseFloat(annualTarget),
            });
            onOpenChange(false);
            setSelectedSalesperson('');
            setAnnualTarget('');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Set Annual Target</DialogTitle>
                    <DialogDescription>
                        Set the annual sales target for a salesperson. Monthly targets will be calculated automatically with carryover logic.
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
                                {mockSalespeople.map((sp) => (
                                    <SelectItem key={sp.id} value={sp.id}>
                                        {sp.name} ({sp.region})
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
                                Monthly base: {formatCurrency(parseFloat(annualTarget) / 12, { compact: true })}
                            </p>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={!selectedSalesperson || !annualTarget}>
                        Set Target
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

/**
 * Monthly breakdown table for a salesperson.
 */
function MonthlyBreakdown({ annualTarget, achieved }) {
    const breakdown = calculateYearlyTargetBreakdown(annualTarget, achieved);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-right">Base Target</TableHead>
                    <TableHead className="text-right">Carryover</TableHead>
                    <TableHead className="text-right">Adjusted Target</TableHead>
                    <TableHead className="text-right">Achieved</TableHead>
                    <TableHead className="text-right">Gap</TableHead>
                    <TableHead className="text-right">%</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {breakdown.map((month, idx) => {
                    const isPast = month.month < currentMonth;
                    const isCurrent = month.month === currentMonth;

                    return (
                        <TableRow
                            key={month.month}
                            className={cn(
                                isCurrent && 'bg-primary/5 font-medium',
                                !isPast && !isCurrent && 'text-muted-foreground'
                            )}
                        >
                            <TableCell className="flex items-center gap-2">
                                {months[idx]}
                                {isCurrent && <Badge variant="secondary">Current</Badge>}
                            </TableCell>
                            <TableCell className="text-right">
                                {formatCurrency(month.baseTarget, { compact: true })}
                            </TableCell>
                            <TableCell className={cn(
                                'text-right',
                                month.carryover > 0 && 'text-red-600',
                                month.carryover < 0 && 'text-emerald-600'
                            )}>
                                {month.carryover !== 0 ? formatCurrency(month.carryover, { compact: true }) : '-'}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                                {formatCurrency(month.adjustedTarget, { compact: true })}
                            </TableCell>
                            <TableCell className="text-right">
                                {formatCurrency(month.achieved, { compact: true })}
                            </TableCell>
                            <TableCell className={cn(
                                'text-right',
                                month.gap > 0 && 'text-red-600',
                                month.gap <= 0 && 'text-emerald-600'
                            )}>
                                {month.gap > 0 ? formatCurrency(month.gap, { compact: true }) : '-'}
                            </TableCell>
                            <TableCell className={cn(
                                'text-right font-medium',
                                month.achievedPercent >= 100 && 'text-emerald-600',
                                month.achievedPercent < 75 && month.achievedPercent > 0 && 'text-red-600'
                            )}>
                                {formatPercent(month.achievedPercent)}
                            </TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
}

export default function TargetsPage() {
    const { isManager } = useAuth();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [expandedSalesperson, setExpandedSalesperson] = useState(null);

    const handleSetTarget = (data) => {
        console.log('Setting target:', data);
        // TODO: Save to database
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Targets</h1>
                    <p className="text-muted-foreground">
                        {isManager
                            ? 'Set and monitor team sales targets'
                            : 'View your sales targets and progress'
                        }
                    </p>
                </div>
                {isManager && (
                    <Button onClick={() => setDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Set Target
                    </Button>
                )}
            </div>

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
                                <p className="text-2xl font-bold">
                                    {formatCurrency(
                                        mockTargetsData.reduce((sum, t) => sum + t.annualTarget, 0),
                                        { compact: true }
                                    )}
                                </p>
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
                                <p className="text-2xl font-bold">
                                    {formatCurrency(
                                        mockTargetsData.reduce((sum, t) =>
                                            sum + Object.values(t.achieved).reduce((a, b) => a + b, 0),
                                            0),
                                        { compact: true }
                                    )}
                                </p>
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
                                <p className="text-sm text-muted-foreground">Team Members</p>
                                <p className="text-2xl font-bold">{mockTargetsData.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Salesperson Targets */}
            <div className="space-y-4">
                {mockTargetsData.map((target) => {
                    const totalAchieved = Object.values(target.achieved).reduce((a, b) => a + b, 0);
                    const isExpanded = expandedSalesperson === target.salesperson;

                    return (
                        <Card key={target.salesperson}>
                            <CardHeader
                                className="cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => setExpandedSalesperson(isExpanded ? null : target.salesperson)}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-lg">{target.salesperson}</CardTitle>
                                        <CardDescription>
                                            FY {currentYear} | Annual Target: {formatCurrency(target.annualTarget, { compact: true })}
                                        </CardDescription>
                                    </div>
                                    <Badge variant={totalAchieved >= target.annualTarget ? 'default' : 'secondary'}>
                                        {formatPercent((totalAchieved / target.annualTarget) * 100)} YTD
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <TargetProgress achieved={totalAchieved} target={target.annualTarget} />

                                {isExpanded && (
                                    <div className="mt-6 border-t pt-6">
                                        <h4 className="font-semibold mb-4">Monthly Breakdown (with Carryover)</h4>
                                        <MonthlyBreakdown
                                            annualTarget={target.annualTarget}
                                            achieved={target.achieved}
                                        />
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Set Target Dialog */}
            <SetTargetDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onSave={handleSetTarget}
            />
        </div>
    );
}
