/**
 * Professional Quotation Form
 * 
 * Industry-grade quotation/sales order creation matching Odoo format.
 * Features:
 * - Multiple line items with HSN codes
 * - GST breakdown (CGST + SGST)
 * - Payment terms and validity
 * - Auto-calculate totals
 * 
 * @module app/(dashboard)/documents/new/page
 */

'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
    FileText,
    ShoppingCart,
    ArrowLeft,
    Save,
    Loader2,
    AlertCircle,
    CheckCircle,
    Plus,
    Trash2,
    Calculator,
} from 'lucide-react';
import Link from 'next/link';
import { format, addDays } from 'date-fns';

// ============================================================================
// CONSTANTS
// ============================================================================

const UOM_OPTIONS = [
    { value: 'Pcs', label: 'Pieces (Pcs)' },
    { value: 'Kgs', label: 'Kilograms (Kgs)' },
    { value: 'Roll', label: 'Rolls' },
    { value: 'Sqm', label: 'Square Meters' },
    { value: 'Mtr', label: 'Meters' },
    { value: 'Set', label: 'Sets' },
    { value: 'Box', label: 'Boxes' },
];

const GST_RATES = [
    { value: 0, label: '0%' },
    { value: 5, label: '5%' },
    { value: 12, label: '12%' },
    { value: 18, label: '18%' },
    { value: 28, label: '28%' },
];

const PAYMENT_TERMS = [
    { value: '100% Advance', label: '100% Advance' },
    { value: '50% Advance', label: '50% Advance' },
    { value: 'Net 15', label: 'Net 15 Days' },
    { value: 'Net 30', label: 'Net 30 Days' },
    { value: 'Net 45', label: 'Net 45 Days' },
    { value: 'Net 60', label: 'Net 60 Days' },
];

const INDIAN_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Puducherry', 'Chandigarh',
];

const DEFAULT_TERMS = `1. This quote is valid for 15 days from the date of making.
2. Freight: Extra as applicable.
3. Delivery: 7-10 working days from order confirmation.
4. Taxes: GST as applicable.`;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function generateQuotationNumber() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `QT-${year}${month}${day}-${random}`;
}

function numberToWords(num) {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
        'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
        'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    if (num === 0) return 'Zero';

    const crore = Math.floor(num / 10000000);
    const lakh = Math.floor((num % 10000000) / 100000);
    const thousand = Math.floor((num % 100000) / 1000);
    const hundred = Math.floor((num % 1000) / 100);
    const remainder = Math.floor(num % 100);
    const paise = Math.round((num % 1) * 100);

    let words = '';

    if (crore > 0) words += convertLessThanHundred(crore) + ' Crore ';
    if (lakh > 0) words += convertLessThanHundred(lakh) + ' Lakh ';
    if (thousand > 0) words += convertLessThanHundred(thousand) + ' Thousand ';
    if (hundred > 0) words += ones[hundred] + ' Hundred ';
    if (remainder > 0) words += convertLessThanHundred(remainder) + ' ';

    words += 'Rupees';
    if (paise > 0) words += ' And ' + convertLessThanHundred(paise) + ' Paise';
    words += ' Only';

    function convertLessThanHundred(n) {
        if (n < 20) return ones[n];
        return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
    }

    return words.trim();
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
    }).format(amount);
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function NewDocumentPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { profile } = useAuth();

    const typeFromUrl = searchParams.get('type') || 'quotation';
    const convertFrom = searchParams.get('convert');

    // Form state
    const [docType, setDocType] = useState(typeFromUrl);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Header fields
    const [quotationNumber, setQuotationNumber] = useState('');
    const [docDate, setDocDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [dueDate, setDueDate] = useState(format(addDays(new Date(), 15), 'yyyy-MM-dd'));
    const [paymentTerms, setPaymentTerms] = useState('100% Advance');
    const [validityDays, setValidityDays] = useState(15);
    const [placeOfSupply, setPlaceOfSupply] = useState('Haryana');

    // Customer fields
    const [customers, setCustomers] = useState([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [customerAddress, setCustomerAddress] = useState('');
    const [customerGstin, setCustomerGstin] = useState('');
    const [customerSearch, setCustomerSearch] = useState('');
    const [loadingCustomers, setLoadingCustomers] = useState(true);

    // Products
    const [products, setProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(true);

    // Line items - array of items
    const [lineItems, setLineItems] = useState([createEmptyLineItem()]);

    // Footer
    const [termsAndConditions, setTermsAndConditions] = useState(DEFAULT_TERMS);
    const [authorizedSignatory, setAuthorizedSignatory] = useState('');

    // Create empty line item
    function createEmptyLineItem() {
        return {
            id: Date.now(),
            productId: '',
            productName: '',
            productDescription: '',
            hsnCode: '39232100',
            gstRate: 18,
            quantity: '',
            uom: 'Pcs',
            unitPrice: '',
            baseAmount: 0,
            cgstAmount: 0,
            sgstAmount: 0,
            lineTotal: 0,
        };
    }

    // Generate quotation number on mount
    useEffect(() => {
        if (!quotationNumber) {
            setQuotationNumber(generateQuotationNumber());
        }
    }, [quotationNumber]);

    // Fetch customers
    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const res = await fetch('/api/customers?limit=1000');
                const data = await res.json();
                if (res.ok) {
                    setCustomers(data.customers || []);
                }
            } catch (err) {
                console.error('Failed to fetch customers:', err);
            } finally {
                setLoadingCustomers(false);
            }
        };
        fetchCustomers();
    }, []);

    // Fetch products
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await fetch('/api/products?limit=1000');
                const data = await res.json();
                if (res.ok) {
                    setProducts(data.products || []);
                }
            } catch (err) {
                console.error('Failed to fetch products:', err);
            } finally {
                setLoadingProducts(false);
            }
        };
        fetchProducts();
    }, []);

    // Filtered customers
    const filteredCustomers = useMemo(() => {
        if (!customerSearch) return customers.slice(0, 50);
        const search = customerSearch.toLowerCase();
        return customers.filter(c =>
            c.name?.toLowerCase().includes(search)
        ).slice(0, 50);
    }, [customers, customerSearch]);

    // Handle customer selection
    const handleCustomerSelect = useCallback((customerId) => {
        setSelectedCustomerId(customerId);
        const customer = customers.find(c => c.id === customerId);
        if (customer) {
            setCustomerName(customer.name);
            setCustomerAddress(customer.address || '');
            setCustomerGstin(customer.gstin || '');
        }
    }, [customers]);

    // Handle line item changes
    const updateLineItem = (index, field, value) => {
        setLineItems(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };

            // Recalculate amounts
            const qty = parseFloat(updated[index].quantity) || 0;
            const price = parseFloat(updated[index].unitPrice) || 0;
            const gstRate = parseFloat(updated[index].gstRate) || 0;

            const baseAmount = qty * price;
            const gstAmount = (baseAmount * gstRate) / 100;
            const cgstAmount = gstAmount / 2;
            const sgstAmount = gstAmount / 2;
            const lineTotal = baseAmount + gstAmount;

            updated[index] = {
                ...updated[index],
                baseAmount,
                cgstAmount,
                sgstAmount,
                lineTotal,
            };

            return updated;
        });
    };

    // Handle product selection for line item
    const handleProductSelectForLine = (index, productId) => {
        const product = products.find(p => p.id === productId);
        if (product) {
            setLineItems(prev => {
                const updated = [...prev];
                updated[index] = {
                    ...updated[index],
                    productId,
                    productName: product.item_name || product.name,
                    productDescription: product.description || `${product.item_name || ''}`,
                    hsnCode: product.hsn_code || '39232100',
                    gstRate: product.default_gst_rate || 18,
                    uom: product.stock_uom || 'Pcs',
                    unitPrice: product.standard_rate?.toString() || '',
                };
                return updated;
            });
        }
    };

    // Add line item
    const addLineItem = () => {
        setLineItems(prev => [...prev, createEmptyLineItem()]);
    };

    // Remove line item
    const removeLineItem = (index) => {
        if (lineItems.length > 1) {
            setLineItems(prev => prev.filter((_, i) => i !== index));
        }
    };

    // Calculate totals
    const totals = useMemo(() => {
        const subtotal = lineItems.reduce((sum, item) => sum + item.baseAmount, 0);
        const cgstTotal = lineItems.reduce((sum, item) => sum + item.cgstAmount, 0);
        const sgstTotal = lineItems.reduce((sum, item) => sum + item.sgstAmount, 0);
        const grandTotal = subtotal + cgstTotal + sgstTotal;

        return { subtotal, cgstTotal, sgstTotal, grandTotal };
    }, [lineItems]);

    // Submit form
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            // Validation
            if (!customerName.trim()) {
                throw new Error('Please select a customer');
            }

            const validItems = lineItems.filter(item =>
                item.productName && item.quantity && item.unitPrice
            );

            if (validItems.length === 0) {
                throw new Error('Please add at least one line item');
            }

            const payload = {
                doc_type: docType,
                quotation_number: quotationNumber,
                doc_date: docDate,
                due_date: dueDate,
                customer_id: selectedCustomerId || null,
                customer_name: customerName.trim(),
                customer_address: customerAddress,
                customer_gstin: customerGstin,
                payment_terms: paymentTerms,
                validity_days: validityDays,
                country_of_supply: 'India',
                place_of_supply: placeOfSupply,
                terms_and_conditions: termsAndConditions,
                authorized_signatory: authorizedSignatory || profile?.name,
                subtotal: totals.subtotal,
                cgst_total: totals.cgstTotal,
                sgst_total: totals.sgstTotal,
                grand_total: totals.grandTotal,
                salesperson_user_id: profile?.id,
                line_items: validItems.map(item => ({
                    product_id: item.productId || null,
                    product_name_raw: item.productName,
                    product_description: item.productDescription,
                    hsn_code: item.hsnCode,
                    gst_rate: item.gstRate,
                    qty: parseFloat(item.quantity),
                    uom: item.uom,
                    unit_price: parseFloat(item.unitPrice),
                    base_amount: item.baseAmount,
                    cgst_amount: item.cgstAmount,
                    sgst_amount: item.sgstAmount,
                    line_total: item.lineTotal,
                })),
            };

            const response = await fetch('/api/documents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create document');
            }

            setSuccess(true);
            setTimeout(() => {
                router.push('/documents');
            }, 1500);

        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const isQuotation = docType === 'quotation';

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/documents">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold">
                                {isQuotation ? 'Create Quotation' : 'Create Sales Order'}
                            </h1>
                            <p className="text-muted-foreground">
                                Professional document with GST breakdown
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant={isQuotation ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setDocType('quotation')}
                        >
                            <FileText className="h-4 w-4 mr-2" />
                            Quotation
                        </Button>
                        <Button
                            variant={!isQuotation ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setDocType('sales_order')}
                        >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Sales Order
                        </Button>
                    </div>
                </div>

                {/* Alerts */}
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {success && (
                    <Alert className="border-green-500 bg-green-50">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                            {isQuotation ? 'Quotation' : 'Sales Order'} created successfully!
                        </AlertDescription>
                    </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Document Details Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Document Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <Label>Quotation No.</Label>
                                    <Input
                                        value={quotationNumber}
                                        onChange={(e) => setQuotationNumber(e.target.value)}
                                        className="font-mono"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Date</Label>
                                    <Input
                                        type="date"
                                        value={docDate}
                                        onChange={(e) => setDocDate(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Due Date</Label>
                                    <Input
                                        type="date"
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Validity (Days)</Label>
                                    <Input
                                        type="number"
                                        value={validityDays}
                                        onChange={(e) => setValidityDays(parseInt(e.target.value) || 15)}
                                        min={1}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Payment Terms</Label>
                                    <Select value={paymentTerms} onValueChange={setPaymentTerms}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {PAYMENT_TERMS.map(term => (
                                                <SelectItem key={term.value} value={term.value}>
                                                    {term.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Place of Supply</Label>
                                    <Select value={placeOfSupply} onValueChange={setPlaceOfSupply}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {INDIAN_STATES.map(state => (
                                                <SelectItem key={state} value={state}>
                                                    {state}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Customer Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Customer Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Customer *</Label>
                                    <Select
                                        value={selectedCustomerId}
                                        onValueChange={handleCustomerSelect}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select customer..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <div className="p-2">
                                                <Input
                                                    placeholder="Search customers..."
                                                    value={customerSearch}
                                                    onChange={(e) => setCustomerSearch(e.target.value)}
                                                    className="mb-2"
                                                />
                                            </div>
                                            {loadingCustomers ? (
                                                <div className="p-4 text-center">Loading...</div>
                                            ) : (
                                                filteredCustomers.map(customer => (
                                                    <SelectItem key={customer.id} value={customer.id}>
                                                        {customer.name}
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Customer GSTIN</Label>
                                    <Input
                                        value={customerGstin}
                                        onChange={(e) => setCustomerGstin(e.target.value)}
                                        placeholder="Enter GSTIN"
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label>Address</Label>
                                    <Textarea
                                        value={customerAddress}
                                        onChange={(e) => setCustomerAddress(e.target.value)}
                                        placeholder="Customer address"
                                        rows={2}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Line Items Card */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Line Items</CardTitle>
                            <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Item
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-slate-50">
                                            <th className="p-2 text-left w-8">#</th>
                                            <th className="p-2 text-left min-w-[200px]">Product</th>
                                            <th className="p-2 text-left w-28">HSN</th>
                                            <th className="p-2 text-left w-20">GST %</th>
                                            <th className="p-2 text-left w-20">Qty</th>
                                            <th className="p-2 text-left w-20">UoM</th>
                                            <th className="p-2 text-right w-28">Rate (₹)</th>
                                            <th className="p-2 text-right w-28">Amount</th>
                                            <th className="p-2 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {lineItems.map((item, index) => (
                                            <tr key={item.id} className="border-b hover:bg-slate-50">
                                                <td className="p-2 text-muted-foreground">{index + 1}</td>
                                                <td className="p-2">
                                                    <Select
                                                        value={item.productId}
                                                        onValueChange={(val) => handleProductSelectForLine(index, val)}
                                                    >
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder="Select..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {products.slice(0, 100).map(p => (
                                                                <SelectItem key={p.id} value={p.id}>
                                                                    {p.item_name || p.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <Input
                                                        className="mt-1 text-xs"
                                                        placeholder="Description..."
                                                        value={item.productDescription}
                                                        onChange={(e) => updateLineItem(index, 'productDescription', e.target.value)}
                                                    />
                                                </td>
                                                <td className="p-2">
                                                    <Input
                                                        value={item.hsnCode}
                                                        onChange={(e) => updateLineItem(index, 'hsnCode', e.target.value)}
                                                        className="font-mono text-xs"
                                                    />
                                                </td>
                                                <td className="p-2">
                                                    <Select
                                                        value={item.gstRate.toString()}
                                                        onValueChange={(val) => updateLineItem(index, 'gstRate', parseFloat(val))}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {GST_RATES.map(rate => (
                                                                <SelectItem key={rate.value} value={rate.value.toString()}>
                                                                    {rate.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </td>
                                                <td className="p-2">
                                                    <Input
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={(e) => updateLineItem(index, 'quantity', e.target.value)}
                                                        min={0}
                                                    />
                                                </td>
                                                <td className="p-2">
                                                    <Select
                                                        value={item.uom}
                                                        onValueChange={(val) => updateLineItem(index, 'uom', val)}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {UOM_OPTIONS.map(u => (
                                                                <SelectItem key={u.value} value={u.value}>
                                                                    {u.value}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </td>
                                                <td className="p-2">
                                                    <Input
                                                        type="number"
                                                        value={item.unitPrice}
                                                        onChange={(e) => updateLineItem(index, 'unitPrice', e.target.value)}
                                                        className="text-right"
                                                        min={0}
                                                        step="0.01"
                                                    />
                                                </td>
                                                <td className="p-2 text-right font-medium">
                                                    {formatCurrency(item.lineTotal)}
                                                </td>
                                                <td className="p-2">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeLineItem(index)}
                                                        disabled={lineItems.length === 1}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Totals */}
                            <div className="mt-6 flex justify-end">
                                <div className="w-80 space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Subtotal:</span>
                                        <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">CGST:</span>
                                        <span>{formatCurrency(totals.cgstTotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">SGST:</span>
                                        <span>{formatCurrency(totals.sgstTotal)}</span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between text-lg font-bold">
                                        <span>Grand Total:</span>
                                        <span className="text-primary">{formatCurrency(totals.grandTotal)}</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground italic">
                                        {numberToWords(totals.grandTotal)}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Terms Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Terms & Conditions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                value={termsAndConditions}
                                onChange={(e) => setTermsAndConditions(e.target.value)}
                                rows={4}
                            />
                        </CardContent>
                    </Card>

                    {/* Submit Button */}
                    <div className="flex justify-end gap-4">
                        <Button type="button" variant="outline" onClick={() => router.back()}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="min-w-[150px]">
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Create {isQuotation ? 'Quotation' : 'Sales Order'}
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
