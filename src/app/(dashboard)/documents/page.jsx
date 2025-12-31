/**
 * Document Center Page
 * 
 * Central hub for managing quotations, sales orders, and invoices.
 * Features tabs for each document type with list views and actions.
 * 
 * @module app/(dashboard)/documents/page
 */

'use client';

// Force dynamic rendering to avoid SSR issues
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DocumentEmptyState, TableSkeleton } from '@/components/common';
import { DOC_TYPES, DOC_TYPE_LABELS, QUOTATION_STATUS, SALES_ORDER_STATUS } from '@/lib/constants';
import { formatCurrency, formatDate } from '@/lib/utils/formatting';
import {
    Plus,
    Upload,
    Search,
    MoreHorizontal,
    Eye,
    Edit,
    Trash2,
    FileText,
    ShoppingCart,
    Receipt,
    Link,
} from 'lucide-react';

// Mock data for display
const mockQuotations = [
    { id: '1', doc_number: 'QT-2024-001', doc_date: '2024-12-15', customer: 'Tata Auto Components', grand_total: 450000, status: 'sent', salesperson: 'Rahul Sharma' },
    { id: '2', doc_number: 'QT-2024-002', doc_date: '2024-12-18', customer: 'Mahindra Parts Ltd', grand_total: 320000, status: 'draft', salesperson: 'Priya Patel' },
    { id: '3', doc_number: 'QT-2024-003', doc_date: '2024-12-20', customer: 'Hero Manufacturing', grand_total: 580000, status: 'won', salesperson: 'Amit Kumar' },
];

const mockSalesOrders = [
    { id: '1', doc_number: 'SO-2024-001', doc_date: '2024-12-16', customer: 'Tata Auto Components', grand_total: 425000, status: 'confirmed', salesperson: 'Rahul Sharma' },
    { id: '2', doc_number: 'SO-2024-002', doc_date: '2024-12-19', customer: 'Bajaj Industries', grand_total: 280000, status: 'open', salesperson: 'Sneha Gupta' },
    { id: '3', doc_number: 'SO-2024-003', doc_date: '2024-12-22', customer: 'TVS Exports', grand_total: 720000, status: 'confirmed', salesperson: 'Vikram Singh' },
];

const mockInvoices = [
    { id: '1', doc_number: 'INV-2024-001', doc_date: '2024-12-17', customer: 'Tata Auto Components', grand_total: 425000, status: 'recorded', salesperson: 'Rahul Sharma' },
    { id: '2', doc_number: 'INV-2024-002', doc_date: '2024-12-21', customer: 'Bajaj Industries', grand_total: 280000, status: 'recorded', salesperson: 'Sneha Gupta' },
];

/**
 * Status badge component with color coding.
 */
function StatusBadge({ status, docType }) {
    const colorMap = {
        draft: 'bg-gray-100 text-gray-700',
        sent: 'bg-blue-100 text-blue-700',
        won: 'bg-emerald-100 text-emerald-700',
        lost: 'bg-red-100 text-red-700',
        open: 'bg-yellow-100 text-yellow-700',
        confirmed: 'bg-emerald-100 text-emerald-700',
        cancelled: 'bg-red-100 text-red-700',
        recorded: 'bg-violet-100 text-violet-700',
    };

    return (
        <Badge
            variant="secondary"
            className={colorMap[status] || 'bg-gray-100 text-gray-700'}
        >
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
    );
}

/**
 * Document table component.
 */
function DocumentTable({ documents, docType, loading, onView, onEdit, onDelete }) {
    const router = useRouter();

    if (loading) {
        return <TableSkeleton rows={5} columns={6} />;
    }

    if (!documents || documents.length === 0) {
        return (
            <DocumentEmptyState
                type={docType}
                onAdd={() => router.push('/documents/upload')}
            />
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Document #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Salesperson</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {documents.map((doc) => (
                    <TableRow key={doc.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="font-medium">{doc.doc_number || 'N/A'}</TableCell>
                        <TableCell>{formatDate(doc.doc_date)}</TableCell>
                        <TableCell>{doc.customer}</TableCell>
                        <TableCell>{doc.salesperson}</TableCell>
                        <TableCell className="text-right font-medium">
                            {formatCurrency(doc.grand_total, { compact: true })}
                        </TableCell>
                        <TableCell>
                            <StatusBadge status={doc.status} docType={docType} />
                        </TableCell>
                        <TableCell>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => router.push(`/documents/${doc.id}`)}>
                                        <Eye className="h-4 w-4 mr-2" />
                                        View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onEdit?.(doc)}>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit
                                    </DropdownMenuItem>
                                    {docType === DOC_TYPES.QUOTATION && (
                                        <DropdownMenuItem>
                                            <Link className="h-4 w-4 mr-2" />
                                            Link to Sales Order
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem className="text-red-600" onClick={() => onDelete?.(doc)}>
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

/**
 * Document Center main component.
 */
export default function DocumentCenterPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('quotations');
    const [searchQuery, setSearchQuery] = useState('');

    // TODO: Replace with real data fetching
    const isLoading = false;

    const getTabIcon = (tab) => {
        switch (tab) {
            case 'quotations':
                return <FileText className="h-4 w-4" />;
            case 'sales_orders':
                return <ShoppingCart className="h-4 w-4" />;
            case 'invoices':
                return <Receipt className="h-4 w-4" />;
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Document Center</h1>
                    <p className="text-muted-foreground">
                        Manage quotations, sales orders, and invoices
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.push('/documents/upload')}>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload PDF
                    </Button>
                    <Button onClick={() => router.push('/documents/new')}>
                        <Plus className="h-4 w-4 mr-2" />
                        Manual Entry
                    </Button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search documents..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3 max-w-md">
                    <TabsTrigger value="quotations" className="gap-2">
                        {getTabIcon('quotations')}
                        Quotations
                    </TabsTrigger>
                    <TabsTrigger value="sales_orders" className="gap-2">
                        {getTabIcon('sales_orders')}
                        Sales Orders
                    </TabsTrigger>
                    <TabsTrigger value="invoices" className="gap-2">
                        {getTabIcon('invoices')}
                        Invoices
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="quotations" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Quotations</CardTitle>
                            <CardDescription>
                                Track and manage customer quotations. Link won quotes to sales orders for comparison.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DocumentTable
                                documents={mockQuotations}
                                docType={DOC_TYPES.QUOTATION}
                                loading={isLoading}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="sales_orders" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Sales Orders</CardTitle>
                            <CardDescription>
                                Sales orders count towards performance metrics and revenue tracking.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DocumentTable
                                documents={mockSalesOrders}
                                docType={DOC_TYPES.SALES_ORDER}
                                loading={isLoading}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="invoices" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Invoices</CardTitle>
                            <CardDescription>
                                Invoices are for reference only and do not affect performance calculations.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DocumentTable
                                documents={mockInvoices}
                                docType={DOC_TYPES.INVOICE}
                                loading={isLoading}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
