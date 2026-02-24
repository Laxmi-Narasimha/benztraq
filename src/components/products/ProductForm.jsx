"use client";

import { memo, useState } from "react";
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
import { cn } from "@/lib/utils";

/**
 * Comprehensive Product Form with tab sections
 * Based on Odoo's Create Product layout with fields from Refrens inventory
 *
 * Tabs: General | Pricing | Dimensions & Weight | Settings
 */
const ProductForm = memo(function ProductForm({
    formData,
    onFieldChange,
    itemGroups = [],
    brands = [],
    hsnCodes = []
}) {
    const [activeTab, setActiveTab] = useState("general");

    const tabs = [
        { id: "general", label: "General" },
        { id: "pricing", label: "Pricing & Tax" },
        { id: "dimensions", label: "Dimensions & Weight" },
        { id: "settings", label: "Settings" },
    ];

    return (
        <div className="max-h-[70vh] overflow-y-auto pr-1">
            {/* Tab Navigation */}
            <div className="flex border-b border-stone-200 mb-5 sticky top-0 bg-white z-10">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
                            activeTab === tab.id
                                ? "border-stone-900 text-stone-900"
                                : "border-transparent text-stone-400 hover:text-stone-600"
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ── GENERAL TAB ── */}
            {activeTab === "general" && (
                <div className="grid gap-5 py-2">
                    {/* Item Type */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Item Type</Label>
                        <div className="flex gap-5">
                            {["Goods", "Service"].map(type => (
                                <label key={type} className="flex items-center gap-2 cursor-pointer">
                                    <div className={cn(
                                        "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors",
                                        (formData.item_type || "Goods") === type
                                            ? "border-stone-900" : "border-stone-300"
                                    )}>
                                        {(formData.item_type || "Goods") === type && (
                                            <div className="w-2 h-2 rounded-full bg-stone-900" />
                                        )}
                                    </div>
                                    <input
                                        type="radio"
                                        name="item_type"
                                        value={type}
                                        checked={(formData.item_type || "Goods") === type}
                                        onChange={() => onFieldChange("item_type", type)}
                                        className="hidden"
                                    />
                                    <span className="text-sm">{type}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* SKU / Part Code + Item Name */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="item_code">SKU / Part Code <span className="text-red-500">*</span></Label>
                            <Input
                                id="item_code"
                                value={formData.item_code}
                                onChange={(e) => onFieldChange("item_code", e.target.value)}
                                placeholder="e.g. VCI-3D-1200"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="item_name">Item Name <span className="text-red-500">*</span></Label>
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
                                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                                <SelectContent>
                                    {itemGroups.map((group) => (
                                        <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
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
                                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                                <SelectContent>
                                    {brands.map((brand) => (
                                        <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
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
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PCS">PCS</SelectItem>
                                    <SelectItem value="Nos">Nos</SelectItem>
                                    <SelectItem value="KG">KG</SelectItem>
                                    <SelectItem value="MTR">MTR</SelectItem>
                                    <SelectItem value="SQM">SQM</SelectItem>
                                    <SelectItem value="ROLL">ROLL</SelectItem>
                                    <SelectItem value="SET">SET</SelectItem>
                                    <SelectItem value="BOX">BOX</SelectItem>
                                    <SelectItem value="COILS">COILS</SelectItem>
                                    <SelectItem value="PKT">PKT</SelectItem>
                                    <SelectItem value="PAIR">PAIR</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* HSN + Tags */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>HSN/SAC Code</Label>
                            <Select
                                value={formData.hsn_sac_code || ""}
                                onValueChange={(v) => onFieldChange("hsn_sac_code", v)}
                            >
                                <SelectTrigger><SelectValue placeholder="Select HSN..." /></SelectTrigger>
                                <SelectContent>
                                    {hsnCodes.map((hsn) => (
                                        <SelectItem key={hsn.code} value={hsn.code}>
                                            {hsn.code} — {hsn.description?.slice(0, 40)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="tags">Tags</Label>
                            <Input
                                id="tags"
                                value={formData.tags || ""}
                                onChange={(e) => onFieldChange("tags", e.target.value)}
                                placeholder="e.g. VCI, Export, Premium (comma separated)"
                            />
                        </div>
                    </div>

                    {/* Internal Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="internal_notes">Internal Notes</Label>
                        <Textarea
                            id="internal_notes"
                            value={formData.internal_notes || ""}
                            onChange={(e) => onFieldChange("internal_notes", e.target.value)}
                            placeholder="Internal notes (not visible to customers)"
                            rows={2}
                        />
                    </div>
                </div>
            )}

            {/* ── PRICING & TAX TAB ── */}
            {activeTab === "pricing" && (
                <div className="grid gap-5 py-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="standard_rate">Selling Price (₹) <span className="text-red-500">*</span></Label>
                            <Input
                                id="standard_rate"
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.standard_rate}
                                onChange={(e) => onFieldChange("standard_rate", e.target.value)}
                                placeholder="0.00"
                            />
                            <p className="text-xs text-stone-400">per {formData.stock_uom || 'Unit'}</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="buying_price">Buying / Cost Price (₹)</Label>
                            <Input
                                id="buying_price"
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.buying_price || ""}
                                onChange={(e) => onFieldChange("buying_price", e.target.value)}
                                placeholder="0.00"
                            />
                            <p className="text-xs text-stone-400">per {formData.stock_uom || 'Unit'}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="landed_cost">Landed Cost (₹)</Label>
                            <Input
                                id="landed_cost"
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.landed_cost || ""}
                                onChange={(e) => onFieldChange("landed_cost", e.target.value)}
                                placeholder="0.00"
                            />
                            <p className="text-xs text-stone-400">Including freight, duties, etc.</p>
                        </div>
                        <div className="space-y-2">
                            <Label>GST Rate (%)</Label>
                            <Select
                                value={String(formData.gst_rate)}
                                onValueChange={(v) => onFieldChange("gst_rate", v)}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0">0% (Exempt)</SelectItem>
                                    <SelectItem value="5">5%</SelectItem>
                                    <SelectItem value="12">12%</SelectItem>
                                    <SelectItem value="18">18%</SelectItem>
                                    <SelectItem value="28">28%</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            )}

            {/* ── DIMENSIONS & WEIGHT TAB ── */}
            {activeTab === "dimensions" && (
                <div className="grid gap-5 py-2">
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Dimensions</Label>
                        <div className="grid grid-cols-4 gap-3">
                            <div className="space-y-1">
                                <Label htmlFor="length" className="text-xs text-stone-400">Length</Label>
                                <Input id="length" type="number" value={formData.length}
                                    onChange={(e) => onFieldChange("length", e.target.value)} placeholder="0" />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="width" className="text-xs text-stone-400">Breadth</Label>
                                <Input id="width" type="number" value={formData.width}
                                    onChange={(e) => onFieldChange("width", e.target.value)} placeholder="0" />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="height" className="text-xs text-stone-400">Height</Label>
                                <Input id="height" type="number" value={formData.height}
                                    onChange={(e) => onFieldChange("height", e.target.value)} placeholder="0" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-stone-400">Unit</Label>
                                <Select value={formData.dimension_uom} onValueChange={(v) => onFieldChange("dimension_uom", v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="mm">mm</SelectItem>
                                        <SelectItem value="cm">cm</SelectItem>
                                        <SelectItem value="m">m</SelectItem>
                                        <SelectItem value="in">in</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Weight */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="gross_weight">Gross Weight (kg)</Label>
                            <Input id="gross_weight" type="number" step="0.01"
                                value={formData.gross_weight || ""}
                                onChange={(e) => onFieldChange("gross_weight", e.target.value)}
                                placeholder="0.00" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="net_weight">Net Weight (kg)</Label>
                            <Input id="net_weight" type="number" step="0.01"
                                value={formData.net_weight || ""}
                                onChange={(e) => onFieldChange("net_weight", e.target.value)}
                                placeholder="0.00" />
                        </div>
                    </div>

                    {/* Packaging Specs */}
                    <div className="border-t border-stone-100 pt-4">
                        <Label className="text-sm font-medium mb-3 block">Packaging Specifications</Label>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="thickness_micron" className="text-xs text-stone-400">Thickness (micron)</Label>
                                <Input id="thickness_micron" type="number"
                                    value={formData.thickness_micron}
                                    onChange={(e) => onFieldChange("thickness_micron", e.target.value)}
                                    placeholder="0" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="gsm" className="text-xs text-stone-400">GSM</Label>
                                <Input id="gsm" type="number"
                                    value={formData.gsm}
                                    onChange={(e) => onFieldChange("gsm", e.target.value)}
                                    placeholder="0" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="ply_count" className="text-xs text-stone-400">Ply Count</Label>
                                <Input id="ply_count" type="number"
                                    value={formData.ply_count}
                                    onChange={(e) => onFieldChange("ply_count", e.target.value)}
                                    placeholder="0" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── SETTINGS TAB ── */}
            {activeTab === "settings" && (
                <div className="grid gap-5 py-2">
                    <div className="space-y-4">
                        <Label className="text-sm font-medium">Product Flags</Label>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { key: "is_sales_item", label: "Sales Item", desc: "Can be sold to customers" },
                                { key: "is_purchase_item", label: "Purchase Item", desc: "Can be purchased from suppliers" },
                                { key: "is_stock_item", label: "Stock Item", desc: "Maintained in inventory" },
                                { key: "maintain_stock", label: "Track Inventory", desc: "Track stock levels" },
                            ].map(({ key, label, desc }) => (
                                <label key={key} className="flex items-start gap-3 p-3 border border-stone-200 rounded-lg cursor-pointer hover:bg-stone-50 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={formData[key] ?? true}
                                        onChange={(e) => onFieldChange(key, e.target.checked)}
                                        className="mt-0.5 w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-500"
                                    />
                                    <div>
                                        <p className="text-sm font-medium text-stone-800">{label}</p>
                                        <p className="text-xs text-stone-400">{desc}</p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Tracking Method</Label>
                        <Select
                            value={formData.tracking_method || "none"}
                            onValueChange={(v) => onFieldChange("tracking_method", v)}
                        >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">No Tracking</SelectItem>
                                <SelectItem value="serial">By Serial Number</SelectItem>
                                <SelectItem value="batch">By Batch / Lot</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Invoicing Policy</Label>
                        <Select
                            value={formData.invoicing_policy || "ordered"}
                            onValueChange={(v) => onFieldChange("invoicing_policy", v)}
                        >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ordered">Ordered Quantities</SelectItem>
                                <SelectItem value="delivered">Delivered Quantities</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-stone-400">
                            {formData.invoicing_policy === "delivered"
                                ? "Invoice only after delivery."
                                : "You can invoice before delivery."}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
});

export default ProductForm;
