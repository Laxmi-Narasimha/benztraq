'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AddProductModal({ open, onOpenChange, onSuccess, defaultCompany = '' }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        customer_name: defaultCompany,
        material_type: '',
        part_size: '',
        customer_part_code: '',
        uom: 'PCS',
        kg_per_piece: '',
        notes: '',
        warehouse: 'FG STOCK'
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const res = await fetch('/api/inventory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to add product');
            }

            if (onSuccess) {
                onSuccess(data.item);
            }
            onOpenChange(false);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>Add New Product {defaultCompany ? `for ${defaultCompany}` : '/ Company'}</DialogTitle>
                    <DialogDescription>
                        Create a new product in the inventory. {defaultCompany ? '' : 'If the company does not exist, it will be added.'}
                    </DialogDescription>
                </DialogHeader>

                {error && (
                    <Alert variant="destructive" className="bg-red-50 dark:bg-red-900/20 text-red-600 border-red-200 dark:border-red-800">
                        <AlertCircle className="w-4 h-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2 col-span-2">
                            <Label htmlFor="customer_name">Company Name <span className="text-red-500">*</span></Label>
                            <Input
                                id="customer_name"
                                name="customer_name"
                                value={formData.customer_name}
                                onChange={handleChange}
                                required
                                readOnly={!!defaultCompany}
                                className={defaultCompany ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 cursor-not-allowed" : ""}
                                placeholder="Enter company name..."
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="material_type">Material Type</Label>
                            <Input
                                id="material_type"
                                name="material_type"
                                value={formData.material_type}
                                onChange={handleChange}
                                placeholder="e.g. LD BAG"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="part_size">Dimensions / Part Size</Label>
                            <Input
                                id="part_size"
                                name="part_size"
                                value={formData.part_size}
                                onChange={handleChange}
                                placeholder="e.g. 110 X 440 X 300"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="customer_part_code">Part Code</Label>
                            <Input
                                id="customer_part_code"
                                name="customer_part_code"
                                value={formData.customer_part_code}
                                onChange={handleChange}
                                placeholder="Internal/Customer code"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="uom">Unit of Measure</Label>
                            <select
                                id="uom"
                                name="uom"
                                value={formData.uom}
                                onChange={handleChange}
                                className="flex h-9 w-full rounded-md border border-neutral-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:focus-visible:ring-neutral-300"
                            >
                                <option value="PCS">Pieces (PCS)</option>
                                <option value="KGS">Kilograms (KGS)</option>
                                <option value="NOS">Numbers (NOS)</option>
                                <option value="MTR">Meters (MTR)</option>
                                <option value="BOX">Boxes</option>
                                <option value="ROLL">Rolls</option>
                            </select>
                        </div>

                        <div className="space-y-2 col-span-2 sm:col-span-1">
                            <Label htmlFor="kg_per_piece">Weight (Kg per piece)</Label>
                            <Input
                                id="kg_per_piece"
                                name="kg_per_piece"
                                type="number"
                                step="any"
                                min="0"
                                value={formData.kg_per_piece}
                                onChange={handleChange}
                                placeholder="0.0"
                            />
                        </div>

                        <div className="space-y-2 col-span-2">
                            <Label htmlFor="notes">Additional Notes</Label>
                            <Input
                                id="notes"
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                placeholder="Optional notes"
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-2 border-t border-neutral-200 dark:border-neutral-800">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Save Product
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
