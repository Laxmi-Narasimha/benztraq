/**
 * Quotation Generator - Multi-Step Wizard
 * 
 * Step 1: Select machines
 * Step 2: Review/Edit quotation data
 * Step 3: Generate and download PDF
 * 
 * @module components/ergopack/quotation-generator
 */

'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
    Package, ChevronRight, ChevronLeft, FileText, Download,
    Check, Edit2, Loader2, Building2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    ERGOPACK_PRODUCTS,
    COMPANY_INFO,
    QUOTATION_TERMS,
    generateQuotationNumber,
    formatCurrency,
    numberToWords
} from '@/lib/ergopack/products';
import { pdf } from '@react-pdf/renderer';
import QuotationPDF from './quotation-pdf';

export default function QuotationGenerator({ open, onOpenChange, contact }) {
    const [step, setStep] = useState(1);
    const [isGenerating, setIsGenerating] = useState(false);

    // Selected products with quantities
    const [selectedProducts, setSelectedProducts] = useState({});

    // Quotation data (editable)
    const [quotationData, setQuotationData] = useState({
        quotationNumber: '',
        quotationDate: '',
        customerName: '',
        customerAddress: '',
        customerCity: '',
        products: [],
    });

    // Initialize data when contact changes
    useEffect(() => {
        if (contact && open) {
            setQuotationData({
                quotationNumber: generateQuotationNumber(),
                quotationDate: new Date().toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                }),
                customerName: contact.company_name || '',
                customerAddress: contact.state || '',
                customerCity: contact.city || '',
                products: [],
            });
            setSelectedProducts({});
            setStep(1);
        }
    }, [contact, open]);

    const toggleProduct = (productId) => {
        setSelectedProducts(prev => {
            if (prev[productId]) {
                const { [productId]: _, ...rest } = prev;
                return rest;
            }
            return { ...prev, [productId]: 1 };
        });
    };

    const updateQuantity = (productId, qty) => {
        const quantity = Math.max(1, parseInt(qty) || 1);
        setSelectedProducts(prev => ({ ...prev, [productId]: quantity }));
    };

    const handleProceedToReview = () => {
        const products = Object.entries(selectedProducts).map(([id, quantity]) => {
            const product = ERGOPACK_PRODUCTS.find(p => p.id === id);
            return { ...product, quantity };
        });
        setQuotationData(prev => ({ ...prev, products }));
        setStep(2);
    };

    const handleMakeChanges = () => {
        setStep(3); // Edit mode
    };

    const handleGeneratePDF = async () => {
        setIsGenerating(true);
        try {
            const blob = await pdf(<QuotationPDF data={quotationData} />).toBlob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Quotation-${quotationData.quotationNumber}-${quotationData.customerName.replace(/\s+/g, '-')}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            onOpenChange(false);
        } catch (error) {
            console.error('PDF generation error:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const updateProductQuantity = (index, quantity) => {
        setQuotationData(prev => {
            const products = [...prev.products];
            products[index].quantity = Math.max(1, parseInt(quantity) || 1);
            return { ...prev, products };
        });
    };

    const updateProductRate = (index, rate) => {
        setQuotationData(prev => {
            const products = [...prev.products];
            products[index].rate = parseInt(rate) || 0;
            return { ...prev, products };
        });
    };

    // Calculate totals
    const calculateTotals = () => {
        let subtotal = 0;
        quotationData.products.forEach(p => {
            subtotal += p.rate * p.quantity;
        });
        const cgst = subtotal * 0.09;
        const sgst = subtotal * 0.09;
        const total = subtotal + cgst + sgst;
        return { subtotal, cgst, sgst, total };
    };

    const selectedCount = Object.keys(selectedProducts).length;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-light flex items-center gap-2">
                        <FileText className="w-5 h-5 text-amber-400" />
                        Create Quotation
                    </DialogTitle>
                    <DialogDescription className="text-zinc-500">
                        {contact?.company_name && `For ${contact.company_name}`}
                    </DialogDescription>
                </DialogHeader>

                {/* Step Indicator */}
                <div className="flex items-center justify-center gap-2 py-4 border-b border-zinc-800">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className="flex items-center">
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                                step >= s ? "bg-amber-500 text-black" : "bg-zinc-800 text-zinc-500"
                            )}>
                                {step > s ? <Check className="w-4 h-4" /> : s}
                            </div>
                            {s < 3 && <ChevronRight className="w-4 h-4 mx-2 text-zinc-700" />}
                        </div>
                    ))}
                </div>

                {/* Step 1: Select Products */}
                {step === 1 && (
                    <div className="space-y-4 py-4">
                        <p className="text-sm text-zinc-400">Select machines to include in the quotation:</p>

                        <div className="space-y-3">
                            {ERGOPACK_PRODUCTS.map((product) => (
                                <Card
                                    key={product.id}
                                    className={cn(
                                        "bg-zinc-800/50 border-zinc-700 cursor-pointer transition-all",
                                        selectedProducts[product.id] && "border-amber-500/50 bg-amber-500/5"
                                    )}
                                    onClick={() => toggleProduct(product.id)}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-start gap-4">
                                            <Checkbox
                                                checked={!!selectedProducts[product.id]}
                                                onCheckedChange={() => toggleProduct(product.id)}
                                                className="mt-1"
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="font-medium text-white">{product.name}</h3>
                                                    <Badge className="bg-emerald-600 text-white font-semibold">
                                                        {formatCurrency(product.rate)}
                                                    </Badge>
                                                </div>
                                                <ul className="mt-2 space-y-0.5">
                                                    {product.description.map((line, i) => (
                                                        <li key={i} className="text-xs text-zinc-500">• {line}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                            {selectedProducts[product.id] && (
                                                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                                    <Label className="text-xs text-zinc-500">Qty:</Label>
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        value={selectedProducts[product.id]}
                                                        onChange={(e) => updateQuantity(product.id, e.target.value)}
                                                        className="w-16 h-8 bg-zinc-900 border-zinc-700 text-center text-sm"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        <div className="flex justify-end pt-4 border-t border-zinc-800">
                            <Button
                                onClick={handleProceedToReview}
                                disabled={selectedCount === 0}
                                className="bg-amber-500 text-black hover:bg-amber-400"
                            >
                                Continue ({selectedCount} selected)
                                <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 2: Review */}
                {step === 2 && (
                    <div className="space-y-4 py-4">
                        <div className="bg-zinc-800/50 rounded-lg p-4 space-y-3">
                            <div className="flex items-center gap-2 text-zinc-400 text-sm">
                                <Building2 className="w-4 h-4" />
                                Quotation For
                            </div>
                            <p className="text-white font-medium">{quotationData.customerName}</p>
                            <p className="text-zinc-500 text-sm">
                                {quotationData.customerCity}{quotationData.customerAddress && `, ${quotationData.customerAddress}`}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <p className="text-sm text-zinc-400">Products:</p>
                            {quotationData.products.map((p, i) => (
                                <div key={i} className="flex items-center justify-between bg-zinc-800/30 rounded-lg p-3">
                                    <div>
                                        <p className="text-white text-sm">{p.name}</p>
                                        <p className="text-zinc-500 text-xs">Qty: {p.quantity}</p>
                                    </div>
                                    <p className="text-amber-400">{formatCurrency(p.rate * p.quantity)}</p>
                                </div>
                            ))}
                        </div>

                        <div className="bg-zinc-800/50 rounded-lg p-4">
                            <div className="flex justify-between text-sm text-zinc-400 mb-1">
                                <span>Subtotal</span>
                                <span>{formatCurrency(calculateTotals().subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-zinc-400 mb-1">
                                <span>CGST (9%)</span>
                                <span>{formatCurrency(calculateTotals().cgst)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-zinc-400 mb-2">
                                <span>SGST (9%)</span>
                                <span>{formatCurrency(calculateTotals().sgst)}</span>
                            </div>
                            <div className="flex justify-between text-lg font-medium text-white pt-2 border-t border-zinc-700">
                                <span>Total</span>
                                <span className="text-amber-400">{formatCurrency(calculateTotals().total)}</span>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-zinc-800">
                            <Button
                                variant="outline"
                                onClick={() => setStep(1)}
                                className="border-zinc-700 text-zinc-400 hover:bg-zinc-800"
                            >
                                <ChevronLeft className="w-4 h-4 mr-1" />
                                Back
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleMakeChanges}
                                className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                            >
                                <Edit2 className="w-4 h-4 mr-2" />
                                Make Changes
                            </Button>
                            <Button
                                onClick={handleGeneratePDF}
                                disabled={isGenerating}
                                className="flex-1 bg-amber-500 text-black hover:bg-amber-400"
                            >
                                {isGenerating ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Download className="w-4 h-4 mr-2" />
                                )}
                                Generate PDF
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 3: Edit Mode */}
                {step === 3 && (
                    <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-zinc-400 text-xs uppercase">Quotation #</Label>
                                <Input
                                    value={quotationData.quotationNumber}
                                    onChange={(e) => setQuotationData(prev => ({ ...prev, quotationNumber: e.target.value }))}
                                    className="bg-zinc-800 border-zinc-700"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-zinc-400 text-xs uppercase">Date</Label>
                                <Input
                                    value={quotationData.quotationDate}
                                    onChange={(e) => setQuotationData(prev => ({ ...prev, quotationDate: e.target.value }))}
                                    className="bg-zinc-800 border-zinc-700"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-zinc-400 text-xs uppercase">Company Name</Label>
                            <Input
                                value={quotationData.customerName}
                                onChange={(e) => setQuotationData(prev => ({ ...prev, customerName: e.target.value }))}
                                className="bg-zinc-800 border-zinc-700"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-zinc-400 text-xs uppercase">City</Label>
                                <Input
                                    value={quotationData.customerCity}
                                    onChange={(e) => setQuotationData(prev => ({ ...prev, customerCity: e.target.value }))}
                                    className="bg-zinc-800 border-zinc-700"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-zinc-400 text-xs uppercase">State/Address</Label>
                                <Input
                                    value={quotationData.customerAddress}
                                    onChange={(e) => setQuotationData(prev => ({ ...prev, customerAddress: e.target.value }))}
                                    className="bg-zinc-800 border-zinc-700"
                                />
                            </div>
                        </div>

                        <div className="border-t border-zinc-800 pt-4">
                            <Label className="text-zinc-400 text-xs uppercase mb-3 block">Products</Label>
                            {quotationData.products.map((p, i) => (
                                <div key={i} className="bg-zinc-800/30 rounded-lg p-3 mb-3">
                                    <p className="text-white text-sm mb-2">{p.name}</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label className="text-zinc-500 text-[10px]">Quantity</Label>
                                            <Input
                                                type="number"
                                                min="1"
                                                value={p.quantity}
                                                onChange={(e) => updateProductQuantity(i, e.target.value)}
                                                className="bg-zinc-900 border-zinc-700 h-8"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-zinc-500 text-[10px]">Rate (₹)</Label>
                                            <Input
                                                type="number"
                                                value={p.rate}
                                                onChange={(e) => updateProductRate(i, e.target.value)}
                                                className="bg-zinc-900 border-zinc-700 h-8"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-zinc-800">
                            <Button
                                variant="outline"
                                onClick={() => setStep(2)}
                                className="border-zinc-700 text-zinc-400 hover:bg-zinc-800"
                            >
                                <ChevronLeft className="w-4 h-4 mr-1" />
                                Back
                            </Button>
                            <Button
                                onClick={handleGeneratePDF}
                                disabled={isGenerating}
                                className="flex-1 bg-amber-500 text-black hover:bg-amber-400"
                            >
                                {isGenerating ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Download className="w-4 h-4 mr-2" />
                                )}
                                Generate PDF
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
