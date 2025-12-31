/**
 * Quote vs Sales Order Comparison Page
 * 
 * Compare pricing between quotes and sales orders.
 * Features unit price vs total price toggle and variance analysis.
 * 
 * @module app/(dashboard)/comparison/page
 */

'use client';

// Force dynamic rendering to avoid SSR issues
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Separator } from '@/components/ui/separator';
import {
    GitCompare,
    TrendingDown,
    TrendingUp,
    Link,
    Search,
    ArrowRight,
} from 'lucide-react';
import { formatCurrency, formatPercent, formatDate, formatVarianceDirection } from '@/lib/utils/formatting';
import { calculatePriceVariance } from '@/lib/utils/calculations';
import { cn } from '@/lib/utils';

// Mock linked pairs
const mockLinkedPairs = [
    {
        id: '1',
        quote: {
            id: 'q1',
            doc_number: 'QT-2024-001',
            doc_date: '2024-12-10',
            customer: 'Tata Auto Components',
            grand_total: 450000,
            lines: [
                { product: 'PVC Film 500mm', qty: 1000, unit_price: 250, line_total: 250000 },
                { product: 'Wooden Pallets', qty: 50, unit_price: 4000, line_total: 200000 },
            ]
        },
        salesOrder: {
            id: 'so1',
            doc_number: 'SO-2024-001',
            doc_date: '2024-12-15',
            customer: 'Tata Auto Components',
            grand_total: 425000,
            lines: [
                { product: 'PVC Film 500mm', qty: 1000, unit_price: 235, line_total: 235000 },
                { product: 'Wooden Pallets', qty: 50, unit_price: 3800, line_total: 190000 },
            ]
        },
        linkMethod: 'manual',
    },
    {
        id: '2',
        quote: {
            id: 'q2',
            doc_number: 'QT-2024-002',
            doc_date: '2024-12-12',
            customer: 'Mahindra Parts Ltd',
            grand_total: 320000,
            lines: [
                { product: 'Export Boxes', qty: 200, unit_price: 1600, line_total: 320000 },
            ]
        },
        salesOrder: {
            id: 'so2',
            doc_number: 'SO-2024-002',
            doc_date: '2024-12-18',
            customer: 'Mahindra Parts Ltd',
            grand_total: 290000,
            lines: [
                { product: 'Export Boxes', qty: 200, unit_price: 1450, line_total: 290000 },
            ]
        },
        linkMethod: 'auto',
    },
];

// Mock unlinked documents for suggestions
const mockUnlinkedQuotes = [
    { id: 'q3', doc_number: 'QT-2024-003', customer: 'Hero Manufacturing', grand_total: 580000, doc_date: '2024-12-08' },
    { id: 'q4', doc_number: 'QT-2024-004', customer: 'Bajaj Industries', grand_total: 420000, doc_date: '2024-12-14' },
];

const mockUnlinkedSalesOrders = [
    { id: 'so3', doc_number: 'SO-2024-003', customer: 'Hero Manufacturing', grand_total: 550000, doc_date: '2024-12-20' },
];

/**
 * Variance badge with color coding.
 */
function VarianceBadge({ quotePrice, salesPrice }) {
    const variance = calculatePriceVariance(quotePrice, salesPrice);

    if (!variance.isValid) {
        return <Badge variant="secondary">N/A</Badge>;
    }

    const { colorClass, icon, label } = formatVarianceDirection(variance.direction, variance.percent);
    const Icon = variance.direction === 'decrease' ? TrendingDown :
        variance.direction === 'increase' ? TrendingUp : null;

    return (
        <div className={cn('flex items-center gap-1', colorClass)}>
            {Icon && <Icon className="h-4 w-4" />}
            <span className="font-medium">{formatPercent(Math.abs(variance.percent))}</span>
            <span className="text-xs">({variance.direction})</span>
        </div>
    );
}

/**
 * Comparison detail card.
 */
function ComparisonCard({ pair, comparisonMode }) {
    const { quote, salesOrder } = pair;

    // Calculate overall variance
    const totalVariance = calculatePriceVariance(quote.grand_total, salesOrder.grand_total);

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Badge variant="outline">{quote.doc_number}</Badge>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="outline">{salesOrder.doc_number}</Badge>
                    </div>
                    <Badge variant={pair.linkMethod === 'auto' ? 'secondary' : 'default'}>
                        {pair.linkMethod === 'auto' ? 'Auto-linked' : 'Manual link'}
                    </Badge>
                </div>
                <CardDescription>
                    {quote.customer} | Quote: {formatDate(quote.doc_date)} → SO: {formatDate(salesOrder.doc_date)}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {/* Summary */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Quote Total</p>
                        <p className="text-xl font-bold">{formatCurrency(quote.grand_total, { compact: true })}</p>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">SO Total</p>
                        <p className="text-xl font-bold">{formatCurrency(salesOrder.grand_total, { compact: true })}</p>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Variance</p>
                        <div className="flex flex-col items-center">
                            <p className="text-xl font-bold">{formatCurrency(Math.abs(totalVariance.amount), { compact: true })}</p>
                            <VarianceBadge quotePrice={quote.grand_total} salesPrice={salesOrder.grand_total} />
                        </div>
                    </div>
                </div>

                {/* Line Items Comparison */}
                <Separator className="my-4" />
                <h4 className="font-semibold mb-3">Line Item Comparison ({comparisonMode === 'unit' ? 'Unit Price' : 'Total Price'})</h4>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead className="text-right">Qty</TableHead>
                            <TableHead className="text-right">Quote {comparisonMode === 'unit' ? 'Unit' : 'Total'}</TableHead>
                            <TableHead className="text-right">SO {comparisonMode === 'unit' ? 'Unit' : 'Total'}</TableHead>
                            <TableHead className="text-right">Difference</TableHead>
                            <TableHead className="text-right">Variance</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {quote.lines.map((quoteLine, idx) => {
                            const soLine = salesOrder.lines[idx];
                            if (!soLine) return null;

                            const quoteValue = comparisonMode === 'unit' ? quoteLine.unit_price : quoteLine.line_total;
                            const soValue = comparisonMode === 'unit' ? soLine.unit_price : soLine.line_total;
                            const variance = calculatePriceVariance(quoteValue, soValue);

                            return (
                                <TableRow key={idx}>
                                    <TableCell className="font-medium">{quoteLine.product}</TableCell>
                                    <TableCell className="text-right">{quoteLine.qty}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(quoteValue)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(soValue)}</TableCell>
                                    <TableCell className={cn(
                                        'text-right',
                                        variance.direction === 'decrease' && 'text-red-600',
                                        variance.direction === 'increase' && 'text-green-600'
                                    )}>
                                        {formatCurrency(variance.amount)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <VarianceBadge quotePrice={quoteValue} salesPrice={soValue} />
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

/**
 * Link suggestion row.
 */
function LinkSuggestion({ quote, salesOrder, onLink }) {
    const variance = calculatePriceVariance(quote.grand_total, salesOrder.grand_total);

    return (
        <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-4">
                <div>
                    <p className="font-medium">{quote.doc_number}</p>
                    <p className="text-sm text-muted-foreground">{formatCurrency(quote.grand_total, { compact: true })}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <div>
                    <p className="font-medium">{salesOrder.doc_number}</p>
                    <p className="text-sm text-muted-foreground">{formatCurrency(salesOrder.grand_total, { compact: true })}</p>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <div className="text-right">
                    <p className="text-sm text-muted-foreground">Customer</p>
                    <p className="font-medium">{quote.customer}</p>
                </div>
                <Button size="sm" onClick={() => onLink(quote, salesOrder)}>
                    <Link className="h-4 w-4 mr-2" />
                    Link
                </Button>
            </div>
        </div>
    );
}

export default function ComparisonPage() {
    const [comparisonMode, setComparisonMode] = useState('total');
    const [selectedQuote, setSelectedQuote] = useState('');
    const [selectedSO, setSelectedSO] = useState('');

    const handleManualLink = () => {
        if (selectedQuote && selectedSO) {
            console.log('Linking:', selectedQuote, selectedSO);
            // TODO: Save link to database
            setSelectedQuote('');
            setSelectedSO('');
        }
    };

    const handleSuggestionLink = (quote, salesOrder) => {
        console.log('Auto-linking:', quote.doc_number, salesOrder.doc_number);
        // TODO: Save link to database
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Quote vs Sales Order Comparison</h1>
                    <p className="text-muted-foreground">
                        Compare pricing between quotations and sales orders to analyze variance
                    </p>
                </div>
            </div>

            {/* Controls */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Compare by:</span>
                            <Tabs value={comparisonMode} onValueChange={setComparisonMode}>
                                <TabsList>
                                    <TabsTrigger value="unit">Unit Price</TabsTrigger>
                                    <TabsTrigger value="total">Total Price</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>

                        <Separator orientation="vertical" className="h-8" />

                        {/* Manual Link */}
                        <div className="flex items-center gap-2 flex-1">
                            <Select value={selectedQuote} onValueChange={setSelectedQuote}>
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder="Select Quote" />
                                </SelectTrigger>
                                <SelectContent>
                                    {mockUnlinkedQuotes.map((q) => (
                                        <SelectItem key={q.id} value={q.id}>
                                            {q.doc_number} - {q.customer}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <ArrowRight className="h-4 w-4 text-muted-foreground" />

                            <Select value={selectedSO} onValueChange={setSelectedSO}>
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder="Select Sales Order" />
                                </SelectTrigger>
                                <SelectContent>
                                    {mockUnlinkedSalesOrders.map((so) => (
                                        <SelectItem key={so.id} value={so.id}>
                                            {so.doc_number} - {so.customer}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Button onClick={handleManualLink} disabled={!selectedQuote || !selectedSO}>
                                <Link className="h-4 w-4 mr-2" />
                                Link
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Auto-Suggestions */}
            {mockUnlinkedQuotes.length > 0 && mockUnlinkedSalesOrders.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Suggested Links</CardTitle>
                        <CardDescription>
                            Based on matching customer, similar products, and date proximity (within 90 days)
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {mockUnlinkedQuotes.map((quote) => {
                            const matchingSO = mockUnlinkedSalesOrders.find(so => so.customer === quote.customer);
                            if (!matchingSO) return null;

                            return (
                                <LinkSuggestion
                                    key={quote.id}
                                    quote={quote}
                                    salesOrder={matchingSO}
                                    onLink={handleSuggestionLink}
                                />
                            );
                        })}
                    </CardContent>
                </Card>
            )}

            {/* Linked Pairs */}
            <div className="space-y-4">
                <h2 className="text-lg font-semibold">Linked Comparisons</h2>
                {mockLinkedPairs.map((pair) => (
                    <ComparisonCard
                        key={pair.id}
                        pair={pair}
                        comparisonMode={comparisonMode}
                    />
                ))}
            </div>
        </div>
    );
}
