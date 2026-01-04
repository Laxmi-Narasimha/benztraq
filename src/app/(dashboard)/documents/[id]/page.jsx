'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
} from 'lucide-react';

function formatCurrency(value) {
    if (!value || isNaN(value)) return '₹0';
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(value);
}

function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

export default function DocumentDetailsPage() {
    const { id } = useParams();
    const router = useRouter();
    const [document, setDocument] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        async function fetchDocument() {
            try {
                const res = await fetch(`/api/documents?id=${id}`);
                const data = await res.json();

                if (!res.ok) throw new Error(data.error || 'Failed to fetch document');

                const doc = data.documents?.find(d => d.id === id);
                if (!doc) throw new Error('Document not found');

                setDocument(doc);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        if (id) fetchDocument();
    }, [id]);

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

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

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

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/documents">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <DocIcon className={`h-5 w-5 ${isQuotation ? 'text-blue-600' : 'text-green-600'}`} />
                            <h1 className="text-2xl font-bold">{document?.doc_number || 'Document'}</h1>
                        </div>
                        <p className="text-muted-foreground">
                            {isQuotation ? 'Quotation' : 'Sales Order'} Details
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.push(`/documents/new?edit=${id}`)}>
                        <Edit className="h-4 w-4 mr-2" /> Edit
                    </Button>
                    <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                        <Trash2 className="h-4 w-4 mr-2" /> {deleting ? 'Deleting...' : 'Delete'}
                    </Button>
                </div>
            </div>

            {/* Status */}
            <Card>
                <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Status</span>
                        <Badge variant={document?.status === 'won' || document?.status === 'confirmed' ? 'default' : 'secondary'}>
                            {(document?.status || 'draft').charAt(0).toUpperCase() + (document?.status || 'draft').slice(1)}
                        </Badge>
                    </div>
                </CardContent>
            </Card>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Customer Info */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Building2 className="h-4 w-4" /> Customer
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-lg font-semibold">
                            {document?.customer_name_raw || document?.customer_display_name || document?.customer?.name || 'N/A'}
                        </p>
                    </CardContent>
                </Card>

                {/* Date */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Calendar className="h-4 w-4" /> Date
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-lg font-semibold">{formatDate(document?.doc_date)}</p>
                    </CardContent>
                </Card>

                {/* Product */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Package className="h-4 w-4" /> Product
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-lg font-semibold">{document?.product_name || 'N/A'}</p>
                        <p className="text-sm text-muted-foreground">
                            {document?.quantity || 0} {document?.uom || 'pcs'}
                        </p>
                    </CardContent>
                </Card>

                {/* Salesperson */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <User className="h-4 w-4" /> Salesperson
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-lg font-semibold">{document?.salesperson_name || 'Unknown'}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Pricing */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <IndianRupee className="h-5 w-5" /> Pricing
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <div className="flex justify-between py-2 border-b">
                            <span className="text-muted-foreground">Unit Price</span>
                            <span className="font-medium">{formatCurrency(document?.unit_price)}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                            <span className="text-muted-foreground">Quantity</span>
                            <span className="font-medium">{document?.quantity || 0} {document?.uom || 'pcs'}</span>
                        </div>
                        <div className="flex justify-between py-2 text-lg">
                            <span className="font-semibold">Total Value</span>
                            <span className="font-bold text-green-600">{formatCurrency(document?.total_value || document?.grand_total)}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Notes */}
            {document?.notes && (
                <Card>
                    <CardHeader>
                        <CardTitle>Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground whitespace-pre-wrap">{document.notes}</p>
                    </CardContent>
                </Card>
            )}

            {/* Actions */}
            {isQuotation && (
                <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Ready to convert?</p>
                                <p className="text-sm text-muted-foreground">Create a Sales Order from this quotation</p>
                            </div>
                            <Button asChild>
                                <Link href={`/documents/new?type=sales_order&convert=${id}`}>
                                    <ShoppingCart className="h-4 w-4 mr-2" /> Convert to Sales Order
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
