'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
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
    ArrowLeft,
    Plus,
    Trash2,
    Save,
    Send,
    FileText,
    Calculator,
    Building2,
    Package,
    Loader2,
    Check,
    AlertCircle
} from 'lucide-react';
import {
    computeLineAmounts,
    computeDocumentTotals,
    determineFiscalPosition,
    prepareLineForSave,
    getNextSequence,
    amountToWords,
    GST_RATES,
    COMPANY_STATE_CODE
} from '@/lib/services/tax-computation';

// Indian States for Place of Supply
const INDIAN_STATES = [
    { code: 'AN', name: 'Andaman and Nicobar Islands' },
    { code: 'AP', name: 'Andhra Pradesh' },
    { code: 'AR', name: 'Arunachal Pradesh' },
    { code: 'AS', name: 'Assam' },
    { code: 'BR', name: 'Bihar' },
    { code: 'CG', name: 'Chhattisgarh' },
    { code: 'CH', name: 'Chandigarh' },
    { code: 'DL', name: 'Delhi' },
    { code: 'GA', name: 'Goa' },
    { code: 'GJ', name: 'Gujarat' },
    { code: 'HP', name: 'Himachal Pradesh' },
    { code: 'HR', name: 'Haryana' },
    { code: 'JH', name: 'Jharkhand' },
    { code: 'JK', name: 'Jammu and Kashmir' },
    { code: 'KA', name: 'Karnataka' },
    { code: 'KL', name: 'Kerala' },
    { code: 'LA', name: 'Ladakh' },
    { code: 'MH', name: 'Maharashtra' },
    { code: 'ML', name: 'Meghalaya' },
    { code: 'MN', name: 'Manipur' },
    { code: 'MP', name: 'Madhya Pradesh' },
    { code: 'MZ', name: 'Mizoram' },
    { code: 'NL', name: 'Nagaland' },
    { code: 'OD', name: 'Odisha' },
    { code: 'PB', name: 'Punjab' },
    { code: 'PY', name: 'Puducherry' },
    { code: 'RJ', name: 'Rajasthan' },
    { code: 'SK', name: 'Sikkim' },
    { code: 'TN', name: 'Tamil Nadu' },
    { code: 'TS', name: 'Telangana' },
    { code: 'TR', name: 'Tripura' },
    { code: 'UK', name: 'Uttarakhand' },
    { code: 'UP', name: 'Uttar Pradesh' },
    { code: 'WB', name: 'West Bengal' },
];

// Default payment terms
const PAYMENT_TERMS = [
    { value: 'immediate', label: 'Immediate Payment' },
    { value: 'advance', label: '100% Advance' },
    { value: 'advance_50', label: '50% Advance' },
    { value: 'net15', label: '15 Days' },
    { value: 'net30', label: '30 Days' },
    { value: 'net45', label: '45 Days' },
    { value: 'net60', label: '60 Days' },
];

export default function OdooQuotationForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Document header state (Odoo-style)
    const [document, setDocument] = useState({
        name: '',                    // Auto-generated
        partner_id: '',
        partner_name: '',
        partner_gstin: '',
        partner_state_code: '',
        invoice_address: '',
        shipping_address: '',
        date_order: new Date().toISOString().split('T')[0],
        validity_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        commitment_date: '',
        state: 'draft',
        fiscal_position: 'intrastate',
        place_of_supply: '',
        currency_id: 'INR',
        payment_term_note: 'advance',
        note: '',
        internal_note: '',
        client_order_ref: '',
    });

    // Line items state
    const [lines, setLines] = useState([]);

    // Computed totals
    const [totals, setTotals] = useState({
        amount_untaxed: 0,
        amount_tax: 0,
        amount_total: 0,
        cgst_total: 0,
        sgst_total: 0,
        igst_total: 0,
    });

    // Load customers and products on mount
    useEffect(() => {
        loadCustomers();
        loadProducts();
    }, []);

    // Recompute totals when lines change
    useEffect(() => {
        const newTotals = computeDocumentTotals(lines);
        setTotals(newTotals);
    }, [lines]);

    const loadCustomers = async () => {
        try {
            const res = await fetch('/api/customers');
            const data = await res.json();
            setCustomers(data.customers || data || []);
        } catch (err) {
            console.error('Failed to load customers:', err);
        }
    };

    const loadProducts = async () => {
        try {
            const res = await fetch('/api/products?limit=500');
            const data = await res.json();
            setProducts(data.products || data || []);
        } catch (err) {
            console.error('Failed to load products:', err);
        }
    };

    // Handle customer selection
    const handleCustomerChange = useCallback((customerId) => {
        const customer = customers.find(c => c.id === customerId);
        if (customer) {
            const stateCode = customer.state_code || '';
            const fiscalPosition = determineFiscalPosition(COMPANY_STATE_CODE, stateCode);

            setDocument(prev => ({
                ...prev,
                partner_id: customer.id,
                partner_name: customer.name || customer.customer_name,
                partner_gstin: customer.gstin || prev.partner_gstin,
                partner_state_code: stateCode,
                invoice_address: customer.billing_address || customer.address || '',
                shipping_address: customer.shipping_address || customer.address || '',
                place_of_supply: stateCode,
                fiscal_position: fiscalPosition,
            }));

            // Recompute all line items with new fiscal position
            if (lines.length > 0) {
                setLines(prevLines => prevLines.map(line => ({
                    ...line,
                    ...computeLineAmounts(line, fiscalPosition)
                })));
            }
        }
    }, [customers, lines]);

    // Handle place of supply change
    const handlePlaceOfSupplyChange = useCallback((stateCode) => {
        const fiscalPosition = determineFiscalPosition(COMPANY_STATE_CODE, stateCode);

        setDocument(prev => ({
            ...prev,
            place_of_supply: stateCode,
            partner_state_code: stateCode,
            fiscal_position: fiscalPosition,
        }));

        // Recompute all line items with new fiscal position
        if (lines.length > 0) {
            setLines(prevLines => prevLines.map(line => ({
                ...line,
                ...computeLineAmounts(line, fiscalPosition)
            })));
        }
    }, [lines]);

    // Add new line item
    const addLine = () => {
        const sequence = getNextSequence(lines);
        setLines([...lines, {
            id: `temp_${Date.now()}`,
            sequence,
            product_id: '',
            name: '',
            hsn_code: '',
            product_uom: 'Units',
            product_uom_qty: 1,
            price_unit: 0,
            discount: 0,
            gst_rate: 18,
            price_subtotal: 0,
            price_tax: 0,
            price_total: 0,
            cgst_amount: 0,
            sgst_amount: 0,
            igst_amount: 0,
        }]);
    };

    // Remove line item
    const removeLine = (index) => {
        setLines(lines.filter((_, i) => i !== index));
    };

    // Handle line item change
    const updateLine = (index, field, value) => {
        setLines(prevLines => {
            const newLines = [...prevLines];
            const line = { ...newLines[index], [field]: value };

            // If product changed, update product-related fields
            if (field === 'product_id' && value) {
                const product = products.find(p => p.id === value);
                if (product) {
                    line.name = product.item_name || product.name || '';
                    line.hsn_code = product.hsn_code || '39232100';
                    line.gst_rate = product.default_gst_rate || 18;
                    line.price_unit = product.selling_price || 0;
                    line.product_uom = product.product_uom || 'Units';
                }
            }

            // Recompute amounts if quantity, price, discount, or gst_rate changed
            if (['product_uom_qty', 'price_unit', 'discount', 'gst_rate', 'product_id'].includes(field)) {
                const computed = computeLineAmounts(line, document.fiscal_position);
                Object.assign(line, computed);
            }

            newLines[index] = line;
            return newLines;
        });
    };

    // Save document
    const handleSave = async (newState = 'draft') => {
        setError('');
        setSuccess('');
        setSaving(true);

        try {
            // Validate
            if (!document.partner_id && !document.partner_name) {
                throw new Error('Please select a customer');
            }
            if (lines.length === 0) {
                throw new Error('Please add at least one line item');
            }

            const payload = {
                ...document,
                state: newState,
                doc_type: newState === 'sale' ? 'sales_order' : 'quotation',
                customer_name: document.partner_name,
                customer_id: document.partner_id,
                customer_gstin: document.partner_gstin,
                customer_address: document.invoice_address,
                ...totals,
                order_line: lines.map(line => ({
                    ...line,
                    product_name_raw: line.name,
                    qty: line.product_uom_qty,
                    unit_price: line.price_unit,
                    base_amount: line.price_subtotal,
                    line_total: line.price_total,
                })),
            };

            const res = await fetch('/api/documents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to save document');
            }

            setSuccess(`Document ${data.name || data.document?.name} saved successfully!`);

            // Redirect after short delay
            setTimeout(() => {
                router.push(`/documents/${data.id || data.document?.id}`);
            }, 1500);

        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
        }).format(amount || 0);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push('/documents')}
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                                New Quotation
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Create professional quotation with GST breakdown
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={() => handleSave('draft')}
                            disabled={saving}
                        >
                            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                            Save Draft
                        </Button>
                        <Button
                            onClick={() => handleSave('sale')}
                            disabled={saving}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                            Confirm Order
                        </Button>
                    </div>
                </div>
            </div>

            {/* Messages */}
            {error && (
                <div className="max-w-7xl mx-auto px-4 py-2">
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-center gap-2 text-red-700 dark:text-red-300">
                        <AlertCircle className="h-4 w-4" />
                        {error}
                    </div>
                </div>
            )}
            {success && (
                <div className="max-w-7xl mx-auto px-4 py-2">
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 flex items-center gap-2 text-green-700 dark:text-green-300">
                        <Check className="h-4 w-4" />
                        {success}
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
                {/* Customer & Order Details */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Customer Card */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Building2 className="h-4 w-4" />
                                Customer Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Customer *</Label>
                                <Select
                                    value={document.partner_id}
                                    onValueChange={handleCustomerChange}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select customer..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {customers.map(c => (
                                            <SelectItem key={c.id} value={c.id}>
                                                {c.name || c.customer_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>GSTIN</Label>
                                    <Input
                                        value={document.partner_gstin}
                                        onChange={(e) => setDocument(prev => ({ ...prev, partner_gstin: e.target.value }))}
                                        placeholder="22AAAAA0000A1Z5"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Place of Supply</Label>
                                    <Select
                                        value={document.place_of_supply}
                                        onValueChange={handlePlaceOfSupplyChange}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select state..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {INDIAN_STATES.map(s => (
                                                <SelectItem key={s.code} value={s.code}>
                                                    {s.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Billing Address</Label>
                                <Textarea
                                    value={document.invoice_address}
                                    onChange={(e) => setDocument(prev => ({ ...prev, invoice_address: e.target.value }))}
                                    rows={2}
                                    placeholder="Customer billing address..."
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Order Details Card */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Order Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Order Date</Label>
                                    <Input
                                        type="date"
                                        value={document.date_order}
                                        onChange={(e) => setDocument(prev => ({ ...prev, date_order: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Validity Date</Label>
                                    <Input
                                        type="date"
                                        value={document.validity_date}
                                        onChange={(e) => setDocument(prev => ({ ...prev, validity_date: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Payment Terms</Label>
                                    <Select
                                        value={document.payment_term_note}
                                        onValueChange={(v) => setDocument(prev => ({ ...prev, payment_term_note: v }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select terms..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {PAYMENT_TERMS.map(t => (
                                                <SelectItem key={t.value} value={t.value}>
                                                    {t.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Customer Reference</Label>
                                    <Input
                                        value={document.client_order_ref}
                                        onChange={(e) => setDocument(prev => ({ ...prev, client_order_ref: e.target.value }))}
                                        placeholder="PO Number..."
                                    />
                                </div>
                            </div>
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-blue-700 dark:text-blue-300">Tax Position:</span>
                                    <span className="font-medium text-blue-800 dark:text-blue-200">
                                        {document.fiscal_position === 'interstate' ? 'Inter-State (IGST)' : 'Intra-State (CGST + SGST)'}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Line Items */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Package className="h-4 w-4" />
                                Order Lines
                            </CardTitle>
                            <Button size="sm" onClick={addLine}>
                                <Plus className="h-4 w-4 mr-1" />
                                Add Line
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12">#</TableHead>
                                        <TableHead className="min-w-[200px]">Product</TableHead>
                                        <TableHead className="w-24">HSN</TableHead>
                                        <TableHead className="w-20">Qty</TableHead>
                                        <TableHead className="w-20">UoM</TableHead>
                                        <TableHead className="w-28">Price</TableHead>
                                        <TableHead className="w-20">Disc %</TableHead>
                                        <TableHead className="w-20">GST %</TableHead>
                                        <TableHead className="w-28 text-right">Subtotal</TableHead>
                                        <TableHead className="w-28 text-right">
                                            {document.fiscal_position === 'interstate' ? 'IGST' : 'CGST + SGST'}
                                        </TableHead>
                                        <TableHead className="w-28 text-right">Total</TableHead>
                                        <TableHead className="w-12"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {lines.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={12} className="text-center py-8 text-gray-500">
                                                No line items. Click "Add Line" to add products.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        lines.map((line, idx) => (
                                            <TableRow key={line.id}>
                                                <TableCell className="text-gray-500">{idx + 1}</TableCell>
                                                <TableCell>
                                                    <Select
                                                        value={line.product_id}
                                                        onValueChange={(v) => updateLine(idx, 'product_id', v)}
                                                    >
                                                        <SelectTrigger className="h-8">
                                                            <SelectValue placeholder="Select product..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {products.map(p => (
                                                                <SelectItem key={p.id} value={p.id}>
                                                                    {p.item_name || p.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        className="h-8 w-20"
                                                        value={line.hsn_code}
                                                        onChange={(e) => updateLine(idx, 'hsn_code', e.target.value)}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        className="h-8 w-16"
                                                        value={line.product_uom_qty}
                                                        onChange={(e) => updateLine(idx, 'product_uom_qty', parseFloat(e.target.value) || 0)}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        className="h-8 w-16"
                                                        value={line.product_uom}
                                                        onChange={(e) => updateLine(idx, 'product_uom', e.target.value)}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        className="h-8 w-24"
                                                        value={line.price_unit}
                                                        onChange={(e) => updateLine(idx, 'price_unit', parseFloat(e.target.value) || 0)}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        className="h-8 w-16"
                                                        value={line.discount}
                                                        onChange={(e) => updateLine(idx, 'discount', parseFloat(e.target.value) || 0)}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Select
                                                        value={String(line.gst_rate)}
                                                        onValueChange={(v) => updateLine(idx, 'gst_rate', parseFloat(v))}
                                                    >
                                                        <SelectTrigger className="h-8 w-16">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {GST_RATES.map(r => (
                                                                <SelectItem key={r.value} value={String(r.value)}>
                                                                    {r.value}%
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {formatCurrency(line.price_subtotal)}
                                                </TableCell>
                                                <TableCell className="text-right text-gray-600 dark:text-gray-400">
                                                    {document.fiscal_position === 'interstate'
                                                        ? formatCurrency(line.igst_amount)
                                                        : formatCurrency(line.cgst_amount + line.sgst_amount)
                                                    }
                                                </TableCell>
                                                <TableCell className="text-right font-semibold">
                                                    {formatCurrency(line.price_total)}
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-red-500 hover:text-red-700"
                                                        onClick={() => removeLine(idx)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Totals & Summary */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Terms & Notes */}
                    <Card className="lg:col-span-2">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Terms & Conditions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                value={document.note}
                                onChange={(e) => setDocument(prev => ({ ...prev, note: e.target.value }))}
                                rows={4}
                                placeholder="Enter terms and conditions..."
                            />
                        </CardContent>
                    </Card>

                    {/* Totals Card */}
                    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Calculator className="h-4 w-4" />
                                Order Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">Untaxed Amount:</span>
                                <span className="font-medium">{formatCurrency(totals.amount_untaxed)}</span>
                            </div>
                            {document.fiscal_position === 'interstate' ? (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">IGST:</span>
                                    <span className="font-medium">{formatCurrency(totals.igst_total)}</span>
                                </div>
                            ) : (
                                <>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">CGST:</span>
                                        <span className="font-medium">{formatCurrency(totals.cgst_total)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">SGST:</span>
                                        <span className="font-medium">{formatCurrency(totals.sgst_total)}</span>
                                    </div>
                                </>
                            )}
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                                <div className="flex justify-between items-end">
                                    <span className="text-lg font-medium text-gray-900 dark:text-white">Total:</span>
                                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                        {formatCurrency(totals.amount_total)}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {amountToWords(totals.amount_total)}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
