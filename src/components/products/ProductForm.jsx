"use client";

import { memo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

/**
 * ProductForm Component
 * Separated from ProductsPage to prevent re-render on every keystroke
 * 
 * @param {Object} props
 * @param {Object} props.formData - Current form data state
 * @param {Function} props.onFieldChange - Callback when field changes
 * @param {Array} props.itemGroups - Available item groups/categories
 * @param {Array} props.brands - Available brands
 * @param {Array} props.hsnCodes - Available HSN codes
 */
const ProductForm = memo(function ProductForm({
    formData,
    onFieldChange,
    itemGroups = [],
    brands = [],
    hsnCodes = []
}) {
    return (
        <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
            {/* Part Code & Item Name */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="item_code">Part Code *</Label>
                    <Input
                        id="item_code"
                        value={formData.item_code}
                        onChange={(e) => onFieldChange("item_code", e.target.value)}
                        placeholder="VCIBAG001"
                    />
                    <p className="text-xs text-muted-foreground">
                        Unique identifier used by staff
                    </p>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="item_name">Item Name *</Label>
                    <Input
                        id="item_name"
                        value={formData.item_name}
                        onChange={(e) => onFieldChange("item_name", e.target.value)}
                        placeholder="VCI 3D Bag 1200x800x800mm"
                    />
                </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => onFieldChange("description", e.target.value)}
                    placeholder="Product description..."
                    rows={2}
                />
            </div>

            {/* Category, Brand, UOM */}
            <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                        value={formData.item_group_id || ""}
                        onValueChange={(v) => onFieldChange("item_group_id", v)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                            {itemGroups.map((group) => (
                                <SelectItem key={group.id} value={group.id}>
                                    {group.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Brand</Label>
                    <Select
                        value={formData.brand_id || ""}
                        onValueChange={(v) => onFieldChange("brand_id", v)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select brand" />
                        </SelectTrigger>
                        <SelectContent>
                            {brands.map((brand) => (
                                <SelectItem key={brand.id} value={brand.id}>
                                    {brand.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Unit of Measure</Label>
                    <Select
                        value={formData.stock_uom}
                        onValueChange={(v) => onFieldChange("stock_uom", v)}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="PCS">PCS</SelectItem>
                            <SelectItem value="KGS">KGS</SelectItem>
                            <SelectItem value="ROLL">ROLL</SelectItem>
                            <SelectItem value="SQM">SQM</SelectItem>
                            <SelectItem value="MTR">MTR</SelectItem>
                            <SelectItem value="LTR">LTR</SelectItem>
                            <SelectItem value="SET">SET</SelectItem>
                            <SelectItem value="NOS">NOS</SelectItem>
                            <SelectItem value="BOX">BOX</SelectItem>
                            <SelectItem value="COILS">COILS</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Price, HSN, GST */}
            <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="standard_rate">Standard Rate (₹)</Label>
                    <Input
                        id="standard_rate"
                        type="number"
                        value={formData.standard_rate}
                        onChange={(e) => onFieldChange("standard_rate", e.target.value)}
                        placeholder="0"
                    />
                </div>
                <div className="space-y-2">
                    <Label>HSN Code</Label>
                    <Select
                        value={formData.hsn_sac_code || ""}
                        onValueChange={(v) => onFieldChange("hsn_sac_code", v)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select HSN" />
                        </SelectTrigger>
                        <SelectContent>
                            {hsnCodes.map((hsn) => (
                                <SelectItem key={hsn.hsn_code} value={hsn.hsn_code}>
                                    {hsn.hsn_code} - {hsn.description?.substring(0, 30)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>GST Rate (%)</Label>
                    <Select
                        value={String(formData.gst_rate)}
                        onValueChange={(v) => onFieldChange("gst_rate", v)}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="5">5%</SelectItem>
                            <SelectItem value="12">12%</SelectItem>
                            <SelectItem value="18">18%</SelectItem>
                            <SelectItem value="28">28%</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Dimensions */}
            <div className="space-y-2">
                <Label className="text-sm font-medium">Dimensions</Label>
                <div className="grid grid-cols-5 gap-3">
                    <div className="space-y-1">
                        <Label htmlFor="length" className="text-xs text-muted-foreground">Length</Label>
                        <Input
                            id="length"
                            type="number"
                            value={formData.length}
                            onChange={(e) => onFieldChange("length", e.target.value)}
                            placeholder="0"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="width" className="text-xs text-muted-foreground">Width</Label>
                        <Input
                            id="width"
                            type="number"
                            value={formData.width}
                            onChange={(e) => onFieldChange("width", e.target.value)}
                            placeholder="0"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="height" className="text-xs text-muted-foreground">Height</Label>
                        <Input
                            id="height"
                            type="number"
                            value={formData.height}
                            onChange={(e) => onFieldChange("height", e.target.value)}
                            placeholder="0"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Unit</Label>
                        <Select
                            value={formData.dimension_uom}
                            onValueChange={(v) => onFieldChange("dimension_uom", v)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="mm">mm</SelectItem>
                                <SelectItem value="cm">cm</SelectItem>
                                <SelectItem value="m">m</SelectItem>
                                <SelectItem value="inch">inch</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="thickness_micron" className="text-xs text-muted-foreground">Micron</Label>
                        <Input
                            id="thickness_micron"
                            type="number"
                            value={formData.thickness_micron}
                            onChange={(e) => onFieldChange("thickness_micron", e.target.value)}
                            placeholder="75"
                        />
                    </div>
                </div>
            </div>

            {/* Additional Properties */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="gsm">GSM (g/m²)</Label>
                    <Input
                        id="gsm"
                        type="number"
                        value={formData.gsm}
                        onChange={(e) => onFieldChange("gsm", e.target.value)}
                        placeholder="For paper products"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="ply_count">Ply Count</Label>
                    <Input
                        id="ply_count"
                        type="number"
                        value={formData.ply_count}
                        onChange={(e) => onFieldChange("ply_count", e.target.value)}
                        placeholder="For layered products"
                    />
                </div>
            </div>
        </div>
    );
});

export default ProductForm;
