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

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/providers/auth-provider';
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
    const safeStatus = status || 'draft'; // Default to 'draft' if status is undefined

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
            className={colorMap[safeStatus] || 'bg-gray-100 text-gray-700'}
        >
            {safeStatus.charAt(0).toUpperCase() + safeStatus.slice(1)}
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
                onAdd={() => router.push('/documents/new')}
            />
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Document #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {documents.map((doc) => (
                    <TableRow
                        key={doc.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={(e) => {
                            // Only navigate if not clicking on a dropdown
                            if (!e.target.closest('[role="menu"]') && !e.target.closest('button')) {
                                router.push(`/documents/${doc.id}`);
                            }
                        }}
                    >
                        <TableCell className="font-medium">
                            <div>
                                <p>{doc.doc_number || 'N/A'}</p>
                                <p className="text-xs text-muted-foreground">{formatDate(doc.doc_date)}</p>
                            </div>
                        </TableCell>
                        <TableCell>
                            <div>
                                <p className="font-medium">{doc.customer_name_raw || doc.customer_display_name || doc.customer || 'Unknown'}</p>
                                <p className="text-xs text-muted-foreground">{doc.salesperson_name || 'Unknown'}</p>
                            </div>
                        </TableCell>
                        <TableCell>
                            <div>
                                <p className="truncate max-w-[150px]">{doc.product_name || 'N/A'}</p>
                                {doc.quantity && <p className="text-xs text-muted-foreground">{doc.quantity} {doc.uom || 'pcs'}</p>}
                            </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                            {formatCurrency(doc.total_value || doc.grand_total, { compact: true })}
                        </TableCell>
                        <TableCell>
                            <StatusBadge status={doc.status} docType={docType} />
                        </TableCell>
                        <TableCell>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => router.push(`/documents/${doc.id}`)}>
                                        <Eye className="h-4 w-4 mr-2" />
                                        View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => router.push(`/documents/new?edit=${doc.id}`)}>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit
                                    </DropdownMenuItem>
                                    {docType === DOC_TYPES.QUOTATION && (
                                        <DropdownMenuItem onClick={() => router.push(`/documents/new?type=sales_order&convert=${doc.id}`)}>
                                            <ShoppingCart className="h-4 w-4 mr-2" />
                                            Convert to Sales Order
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
    const { profile } = useAuth(); // Get current user profile
    const [activeTab, setActiveTab] = useState('quotations');
    const [searchQuery, setSearchQuery] = useState('');
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);

    const [error, setError] = useState(null);

    const supabase = createClient();

    // Fetch documents based on role and tab
    useEffect(() => {
        const fetchDocuments = async () => {
            setLoading(true);
            setError(null);
            try {
                let query;
                const table = activeTab; // quotations, sales_orders, invoices

                // Determine document type based on tab
                let docType = null;
                if (activeTab === 'quotations') docType = 'quotation';
                else if (activeTab === 'sales_orders') docType = 'sales_order';
                else if (activeTab === 'invoices') docType = 'invoice';

                // Build query string
                const params = new URLSearchParams();
                if (docType) params.append('doc_type', docType);
                if (searchQuery) params.append('search', searchQuery);

                const response = await fetch(`/api/documents?${params.toString()}`);
                const resData = await response.json();

                if (!response.ok) {
                    console.error('API Error:', resData);
                    setError(resData.details || resData.error || 'Failed to fetch documents');
                    setDocuments([]);
                } else {
                    setDocuments(resData.documents || []);
                }

            } catch (err) {
                console.error('Exception fetching documents:', err);
                setError(err.message || 'An unexpected error occurred');
                setDocuments([]);
            } finally {
                setLoading(false);
            }
        };

        if (profile) {
            fetchDocuments();
        }
    }, [activeTab, searchQuery, profile]);

    const getTabIcon = (tab) => {
        switch (tab) {
            case 'quotations':
                return <FileText className="h-4 w-4" />
            case 'sales_orders':
                return <ShoppingCart className="h-4 w-4" />
            case 'invoices':
                return <Receipt className="h-4 w-4" />
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
                    {/* Consolidated Upload/New Action */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                New Document
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push('/documents/new')}>
                                <FileText className="h-4 w-4 mr-2" />
                                Create Document
                            </DropdownMenuItem>
                            {/* Upload feature temporarily disabled or redirected until page exists */}
                            {/* <DropdownMenuItem onClick={() => router.push('/documents/upload')}>
                                <Upload className="h-4 w-4 mr-2" />
                                Upload PDF
                            </DropdownMenuItem> */}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Error Alert */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">{error}</span>
                </div>
            )}

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search documents..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>

                {/* Management Filters */}
                {profile && ['director', 'developer', 'head_of_sales', 'vp'].includes(profile.role) && (
                    <div className="flex gap-2">
                        <Select
                            onValueChange={(value) => {
                                // TODO: Add filter logic to state
                                console.log("Filter by region:", value);
                            }}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by Region" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Regions</SelectItem>
                                <SelectItem value="Gurgaon">Gurgaon</SelectItem>
                                <SelectItem value="Madhya Pradesh">Madhya Pradesh</SelectItem>
                                <SelectItem value="Rajasthan">Rajasthan</SelectItem>
                                <SelectItem value="Karnataka">Karnataka</SelectItem>
                                <SelectItem value="Maharashtra">Maharashtra</SelectItem>
                                <SelectItem value="Noida">Noida</SelectItem>
                                <SelectItem value="West Zone">West Zone</SelectItem>
                                <SelectItem value="Chennai">Chennai</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}
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

                {/* Content Areas - Reusing the same logic for all tabs since they share structure */}
                {['quotations', 'sales_orders', 'invoices'].map(tab => (
                    <TabsContent key={tab} value={tab} className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>{tab.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</CardTitle>
                                <CardDescription>
                                    View and manage your {tab.replace('_', ' ')}.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <DocumentTable
                                    documents={documents}
                                    docType={tab === 'quotations' ? DOC_TYPES.QUOTATION : tab === 'sales_orders' ? DOC_TYPES.SALES_ORDER : DOC_TYPES.INVOICE}
                                    loading={loading}
                                    onDelete={async (doc) => {
                                        if (!confirm(`Are you sure you want to delete ${doc.doc_number || 'this document'}? This action cannot be undone.`)) return;
                                        try {
                                            const res = await fetch(`/api/documents?id=${doc.id}`, { method: 'DELETE' });
                                            if (!res.ok) {
                                                const data = await res.json();
                                                throw new Error(data.error || 'Failed to delete');
                                            }
                                            // Refresh documents
                                            setDocuments(prev => prev.filter(d => d.id !== doc.id));
                                        } catch (err) {
                                            alert('Failed to delete: ' + err.message);
                                        }
                                    }}
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}
