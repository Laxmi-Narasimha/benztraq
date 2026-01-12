/**
 * Document Details Page - Enhanced
 * 
 * Comprehensive view of quotation/sales order with:
 * - Full GST breakdown (CGST, SGST)
 * - Line items table with HSN codes
 * - Payment terms and due date
 * - PDF download functionality
 * - Convert to sales order
 * 
 * @module app/(dashboard)/documents/[id]/page
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    ArrowLeft,
    FileText,
    ShoppingCart,
    Edit,
    Trash2,
    RefreshCw,
    User,
    Calendar,
    Package,
    IndianRupee,
    Building2,
    Printer,
    Download,
    CheckCircle,
    Clock,
    MapPin,
    CreditCard,
    Hash,
    FileCheck,
} from 'lucide-react';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatCurrency(value) {
    if (!value || isNaN(value)) return '₹0.00';
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
    }).format(value);
}

function formatCompact(value) {
    if (!value || isNaN(value)) return '₹0';
    const absValue = Math.abs(value);
    if (absValue >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`;
    if (absValue >= 100000) return `₹${(value / 100000).toFixed(2)}L`;
    if (absValue >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
    return `₹${value.toFixed(0)}`;
}

function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

function getStatusColor(status) {
    switch (status?.toLowerCase()) {
        case 'won':
        case 'confirmed':
            return 'bg-green-100 text-green-800 border-green-200';
        case 'sent':
            return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'draft':
            return 'bg-gray-100 text-gray-800 border-gray-200';
        case 'lost':
        case 'cancelled':
            return 'bg-red-100 text-red-800 border-red-200';
        default:
            return 'bg-gray-100 text-gray-800 border-gray-200';
    }
}

function numberToWords(num) {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
        'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
        'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    if (!num || num === 0) return 'Zero Rupees Only';

    const crore = Math.floor(num / 10000000);
    const lakh = Math.floor((num % 10000000) / 100000);
    const thousand = Math.floor((num % 100000) / 1000);
    const hundred = Math.floor((num % 1000) / 100);
    const remainder = Math.floor(num % 100);
    const paise = Math.round((num % 1) * 100);

    let words = '';

    function convertLessThanHundred(n) {
        if (n < 20) return ones[n];
        return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
    }

    if (crore > 0) words += convertLessThanHundred(crore) + ' Crore ';
    if (lakh > 0) words += convertLessThanHundred(lakh) + ' Lakh ';
    if (thousand > 0) words += convertLessThanHundred(thousand) + ' Thousand ';
    if (hundred > 0) words += ones[hundred] + ' Hundred ';
    if (remainder > 0) words += convertLessThanHundred(remainder) + ' ';

    words += 'Rupees';
    if (paise > 0) words += ' And ' + convertLessThanHundred(paise) + ' Paise';
    words += ' Only';

    return words.trim();
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function DocumentDetailsPage() {
    const { id } = useParams();
    const router = useRouter();
    const [document, setDocument] = useState(null);
    const [lineItems, setLineItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [printing, setPrinting] = useState(false);

    // Fetch document and line items
    const fetchDocument = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/documents?id=${id}`);
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to fetch document');

            const doc = data.documents?.find(d => d.id === id);
            if (!doc) throw new Error('Document not found');

            setDocument(doc);

            // Fetch line items
            const linesRes = await fetch(`/api/documents/lines?document_id=${id}`);
            if (linesRes.ok) {
                const linesData = await linesRes.json();
                setLineItems(linesData.lines || []);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (id) fetchDocument();
    }, [id, fetchDocument]);

    // Delete document
    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) return;

        setDeleting(true);
        try {
            const res = await fetch(`/api/documents?id=${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to delete');
            }
            router.push('/documents');
        } catch (err) {
            alert(err.message);
        } finally {
            setDeleting(false);
        }
    };

    // Print/Download PDF
    const handlePrint = async () => {
        setPrinting(true);
        try {
            // For now, use browser print
            window.print();
        } finally {
            setPrinting(false);
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="max-w-2xl mx-auto py-10 text-center">
                <p className="text-red-600 mb-4">{error}</p>
                <Button variant="outline" onClick={() => router.push('/documents')}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back to Documents
                </Button>
            </div>
        );
    }

    const isQuotation = document?.doc_type === 'quotation';
    const DocIcon = isQuotation ? FileText : ShoppingCart;

    // Calculate totals from line items or use document totals
    const subtotal = document?.subtotal || lineItems.reduce((sum, item) => sum + (parseFloat(item.base_amount) || 0), 0) || document?.total_value || 0;
    const cgstTotal = document?.cgst_total || lineItems.reduce((sum, item) => sum + (parseFloat(item.cgst_amount) || 0), 0) || 0;
    const sgstTotal = document?.sgst_total || lineItems.reduce((sum, item) => sum + (parseFloat(item.sgst_amount) || 0), 0) || 0;
    const grandTotal = document?.grand_total || (subtotal + cgstTotal + sgstTotal) || document?.total_value || 0;

    return (
        <div className="max-w-5xl mx-auto space-y-6 p-6 print:p-0">
            {/* Header - Hidden in print */}
            <div className="flex items-center justify-between print:hidden">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/documents">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <DocIcon className={`h-5 w-5 ${isQuotation ? 'text-blue-600' : 'text-green-600'}`} />
                            <h1 className="text-2xl font-bold">{document?.doc_number || document?.quotation_number || 'Document'}</h1>
                            <Badge className={getStatusColor(document?.status)}>
                                {(document?.status || 'draft').charAt(0).toUpperCase() + (document?.status || 'draft').slice(1)}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground">
                            {isQuotation ? 'Quotation' : 'Sales Order'} • Created {formatDate(document?.created_at || document?.doc_date)}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handlePrint} disabled={printing}>
                        <Printer className="h-4 w-4 mr-2" /> {printing ? 'Printing...' : 'Print'}
                    </Button>
                    <Button variant="outline" onClick={() => router.push(`/documents/new?edit=${id}`)}>
                        <Edit className="h-4 w-4 mr-2" /> Edit
                    </Button>
                    <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                        <Trash2 className="h-4 w-4 mr-2" /> {deleting ? 'Deleting...' : 'Delete'}
                    </Button>
                </div>
            </div>

            {/* Print Header - Only visible in print */}
            <div className="hidden print:block mb-8">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-blue-600">BENZ PACKAGING</h1>
                        <p className="text-sm text-gray-600">Protective Packaging Solutions</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-2xl font-bold">{isQuotation ? 'Quotation' : 'Sales Order'}</h2>
                        <p className="text-lg font-mono">{document?.doc_number || document?.quotation_number}</p>
                    </div>
                </div>
            </div>

            {/* Three Column Info Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* From */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground">From</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="font-semibold text-blue-600">BENZ PACKAGING SOLUTIONS PVT LTD</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Plot 83, Sec-5, IMT Manesar<br />
                            Gurgaon, Haryana - 122052
                        </p>
                        <p className="text-sm mt-2">Email: ccare6@benz-packaging.com</p>
                        <p className="text-sm">Phone: +91 99907 44477</p>
                    </CardContent>
                </Card>

                {/* To */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground">To</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="font-semibold">{document?.customer_name_raw || document?.customer_display_name || 'Customer'}</p>
                        {document?.customer_address && (
                            <p className="text-sm text-muted-foreground mt-1">{document.customer_address}</p>
                        )}
                        {document?.customer_gstin && (
                            <p className="text-sm mt-2">
                                <span className="text-muted-foreground">GSTIN:</span> {document.customer_gstin}
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Details */}
                <Card className="bg-slate-50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground">Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Document No:</span>
                            <span className="font-medium font-mono">{document?.doc_number || document?.quotation_number}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Date:</span>
                            <span className="font-medium">{formatDate(document?.doc_date)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Due Date:</span>
                            <span className="font-medium">{formatDate(document?.due_date)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Payment Terms:</span>
                            <span className="font-medium">{document?.payment_terms || '100% Advance'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Place of Supply:</span>
                            <span className="font-medium">{document?.place_of_supply || 'Haryana'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Salesperson:</span>
                            <span className="font-medium">{document?.salesperson_name || 'Unknown'}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Line Items Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Line Items
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-100">
                                    <TableHead className="w-10">#</TableHead>
                                    <TableHead className="min-w-[200px]">Item</TableHead>
                                    <TableHead>HSN</TableHead>
                                    <TableHead className="text-center">GST %</TableHead>
                                    <TableHead className="text-right">Qty</TableHead>
                                    <TableHead>UoM</TableHead>
                                    <TableHead className="text-right">Rate</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead className="text-right">CGST</TableHead>
                                    <TableHead className="text-right">SGST</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {lineItems.length > 0 ? (
                                    lineItems.map((item, index) => (
                                        <TableRow key={item.id || index}>
                                            <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">{item.product_name || item.product_name_raw}</p>
                                                    {item.product_description && (
                                                        <p className="text-xs text-muted-foreground">{item.product_description}</p>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-mono text-xs">{item.hsn_code || '39232100'}</TableCell>
                                            <TableCell className="text-center">{item.gst_rate || 18}%</TableCell>
                                            <TableCell className="text-right">{item.qty || item.quantity}</TableCell>
                                            <TableCell>{item.uom || 'Pcs'}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(item.base_amount)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(item.cgst_amount)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(item.sgst_amount)}</TableCell>
                                            <TableCell className="text-right font-medium">{formatCurrency(item.line_total)}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    // Fallback to single item from document
                                    <TableRow>
                                        <TableCell className="text-muted-foreground">1</TableCell>
                                        <TableCell>
                                            <p className="font-medium">{document?.product_name || 'Product'}</p>
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">39232100</TableCell>
                                        <TableCell className="text-center">18%</TableCell>
                                        <TableCell className="text-right">{document?.quantity || 1}</TableCell>
                                        <TableCell>{document?.uom || 'Pcs'}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(document?.unit_price)}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(subtotal)}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(cgstTotal)}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(sgstTotal)}</TableCell>
                                        <TableCell className="text-right font-medium">{formatCurrency(grandTotal)}</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Summary Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Terms */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">Terms & Conditions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {document?.terms_and_conditions || `1. This quote is valid for ${document?.validity_days || 15} days from the date of making.
2. Freight: Extra as applicable.
3. Delivery: 7-10 working days from order confirmation.
4. Taxes: GST as applicable.`}
                        </p>
                    </CardContent>
                </Card>

                {/* Totals */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <IndianRupee className="h-5 w-5" />
                            Summary
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex justify-between py-2 border-b">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span className="font-medium">{formatCurrency(subtotal)}</span>
                            </div>
                            <div className="flex justify-between py-1">
                                <span className="text-muted-foreground">CGST</span>
                                <span>{formatCurrency(cgstTotal)}</span>
                            </div>
                            <div className="flex justify-between py-1">
                                <span className="text-muted-foreground">SGST</span>
                                <span>{formatCurrency(sgstTotal)}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 -mx-4 rounded-lg">
                                <span className="font-semibold">Grand Total (INR)</span>
                                <span className="font-bold text-lg">{formatCurrency(grandTotal)}</span>
                            </div>
                            <p className="text-xs text-muted-foreground italic pt-2">
                                {numberToWords(grandTotal)}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Convert to Sales Order Action */}
            {isQuotation && document?.status !== 'won' && (
                <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 print:hidden">
                    <CardContent className="py-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                                    <ShoppingCart className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="font-semibold text-lg">Ready to convert?</p>
                                    <p className="text-muted-foreground">Create a Sales Order from this quotation to confirm the deal</p>
                                </div>
                            </div>
                            <Button size="lg" asChild className="shadow-lg">
                                <Link href={`/documents/new?type=sales_order&convert=${id}`}>
                                    <CheckCircle className="h-5 w-5 mr-2" />
                                    Convert to Sales Order
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Authorized Signatory - Visible in print */}
            <div className="hidden print:block text-right mt-16">
                <div className="inline-block text-center">
                    <div className="border-t border-gray-400 w-48 pt-2">
                        <p className="text-sm">{document?.authorized_signatory || 'Authorized Signatory'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
