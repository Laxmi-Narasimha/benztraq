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
 * Comprehensive Product Form — replicates Refrens "Add New Item" layout
 * 
 * Sections:
 *  1. Item/Product Details — type, toggles, name, SKU, category, unit, HSN, description, tags, dimensions, weights
 *  2. Pricing & Tax — currency, buying price, selling price, landed cost, tax rate, tax inclusive toggle
 *  3. Stock Management — initial stock, tracking method (none/batch/serial/batch+serial)
 *  4. Reorder & Overstock — reorder point, overstock point
 */
const ProductForm = memo(function ProductForm({
    formData,
    onFieldChange,
    itemGroups = [],
    brands = [],
    hsnCodes = []
}) {
    const [activeSection, setActiveSection] = useState(1);

    const sections = [
        { id: 1, label: "1. Item/Product Details" },
        { id: 2, label: "2. Pricing & Tax" },
        { id: 3, label: "3. Stock & Tracking" },
        { id: 4, label: "4. Settings" },
    ];

    return (
        <div className="max-h-[70vh] overflow-y-auto pr-1">
            {/* Section Accordion Headers */}
            {sections.map(section => (
                <div key={section.id} className="mb-1">
                    <button
                        type="button"
                        onClick={() => setActiveSection(activeSection === section.id ? 0 : section.id)}
                        className={cn(
                            "w-full flex items-center justify-between px-4 py-3 text-sm font-semibold rounded-lg transition-colors",
                            activeSection === section.id
                                ? "bg-stone-100 text-stone-900"
                                : "bg-stone-50 text-stone-500 hover:text-stone-700 hover:bg-stone-100"
                        )}
                    >
                        <span>{section.label}</span>
                        <svg className={cn("w-4 h-4 transition-transform", activeSection === section.id && "rotate-180")} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>

                    {/* ── SECTION 1: ITEM/PRODUCT DETAILS ── */}
                    {section.id === 1 && activeSection === 1 && (
                        <div className="px-4 py-4 space-y-5 border border-stone-100 rounded-b-lg -mt-1">
                            {/* Item Type */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Item Type</Label>
                                <div className="flex gap-6">
                                    {["Product", "Service"].map(type => (
                                        <label key={type} className="flex items-center gap-2 cursor-pointer">
                                            <div className={cn(
                                                "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                                                (formData.item_type || "Product") === type ? "border-sky-600" : "border-stone-300"
                                            )}>
                                                {(formData.item_type || "Product") === type && (
                                                    <div className="w-2 h-2 rounded-full bg-sky-600" />
                                                )}
                                            </div>
                                            <input type="radio" name="item_type" value={type}
                                                checked={(formData.item_type || "Product") === type}
                                                onChange={() => onFieldChange("item_type", type)} className="hidden" />
                                            <span className="text-sm">{type}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Toggle Flags */}
                            <div className="flex gap-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={formData.is_sales_item ?? true}
                                        onChange={(e) => onFieldChange("is_sales_item", e.target.checked)}
                                        className="w-4 h-4 rounded border-stone-300 text-sky-600 focus:ring-sky-500" />
                                    <span className="text-sm">This item can be sold to customers</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={formData.maintain_stock ?? true}
                                        onChange={(e) => onFieldChange("maintain_stock", e.target.checked)}
                                        className="w-4 h-4 rounded border-stone-300 text-sky-600 focus:ring-sky-500" />
                                    <span className="text-sm">Manage Stock</span>
                                </label>
                            </div>

                            {/* Item Name + SKU ID */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="item_name">Item Name <span className="text-red-500">*</span></Label>
                                    <Input id="item_name" value={formData.item_name}
                                        onChange={(e) => onFieldChange("item_name", e.target.value)}
                                        placeholder="Enter name of your item" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="item_code">SKU ID</Label>
                                    <Input id="item_code" value={formData.item_code}
                                        onChange={(e) => onFieldChange("item_code", e.target.value)}
                                        placeholder="Auto-generated if empty" />
                                </div>
                            </div>

                            {/* Category + Unit */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label>Category</Label>
                                    <Select value={formData.item_group_id || ""} onValueChange={(v) => onFieldChange("item_group_id", v)}>
                                        <SelectTrigger><SelectValue placeholder="Select a Category" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="finished_goods">Finished Goods</SelectItem>
                                            <SelectItem value="raw_materials">Raw Materials</SelectItem>
                                            <SelectItem value="sub_assemblies">Sub-assemblies / Semi-finished</SelectItem>
                                            <SelectItem value="parts_components">Parts / Components</SelectItem>
                                            <SelectItem value="scrap">Scrap</SelectItem>
                                            {itemGroups.map((group) => (
                                                <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Unit</Label>
                                    <Select value={formData.stock_uom || "PCS"} onValueChange={(v) => onFieldChange("stock_uom", v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="PCS">PCS</SelectItem>
                                            <SelectItem value="Nos">Nos</SelectItem>
                                            <SelectItem value="KG">KG</SelectItem>
                                            <SelectItem value="GM">Grams</SelectItem>
                                            <SelectItem value="MTR">Meters</SelectItem>
                                            <SelectItem value="SQM">Sq. Meters</SelectItem>
                                            <SelectItem value="ROLL">Rolls</SelectItem>
                                            <SelectItem value="SET">Sets</SelectItem>
                                            <SelectItem value="BOX">Box</SelectItem>
                                            <SelectItem value="DOZEN">Dozen</SelectItem>
                                            <SelectItem value="COILS">Coils</SelectItem>
                                            <SelectItem value="PKT">Packets</SelectItem>
                                            <SelectItem value="PAIR">Pairs</SelectItem>
                                            <SelectItem value="LTR">Litres</SelectItem>
                                            <SelectItem value="FT">Feet</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* HSN + Brand */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label>HSN / SAC Code</Label>
                                    {hsnCodes.length > 0 ? (
                                        <Select value={formData.hsn_sac_code || ""} onValueChange={(v) => onFieldChange("hsn_sac_code", v)}>
                                            <SelectTrigger><SelectValue placeholder="Enter HSN" /></SelectTrigger>
                                            <SelectContent>
                                                {hsnCodes.map((hsn) => (
                                                    <SelectItem key={hsn.code} value={hsn.code}>
                                                        {hsn.code} — {hsn.description?.slice(0, 40)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <Input value={formData.hsn_sac_code || ""}
                                            onChange={(e) => onFieldChange("hsn_sac_code", e.target.value)}
                                            placeholder="e.g. 39232100" />
                                    )}
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Brand</Label>
                                    {brands.length > 0 ? (
                                        <Select value={formData.brand_id || ""} onValueChange={(v) => onFieldChange("brand_id", v)}>
                                            <SelectTrigger><SelectValue placeholder="Select brand" /></SelectTrigger>
                                            <SelectContent>
                                                {brands.map((brand) => (
                                                    <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <Input value={formData.brand_id || ""}
                                            onChange={(e) => onFieldChange("brand_id", e.target.value)}
                                            placeholder="Enter brand name" />
                                    )}
                                </div>
                            </div>

                            {/* Description */}
                            <div className="space-y-1.5">
                                <Label htmlFor="description">Description</Label>
                                <Textarea id="description" value={formData.description}
                                    onChange={(e) => onFieldChange("description", e.target.value)}
                                    placeholder="Product description..." rows={3} />
                            </div>

                            {/* Tags */}
                            <div className="space-y-1.5">
                                <Label htmlFor="tags">Tags</Label>
                                <Input id="tags" value={formData.tags || ""}
                                    onChange={(e) => onFieldChange("tags", e.target.value)}
                                    placeholder="e.g. VCI, Export, Premium (comma separated)" />
                            </div>

                            {/* Dimensions */}
                            <div className="space-y-2 border-t border-stone-100 pt-4">
                                <Label className="text-sm font-medium">Dimensions</Label>
                                <div className="grid grid-cols-4 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-xs text-stone-400">Length (L)</Label>
                                        <Input type="number" value={formData.length}
                                            onChange={(e) => onFieldChange("length", e.target.value)} placeholder="0" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs text-stone-400">Width (W)</Label>
                                        <Input type="number" value={formData.width}
                                            onChange={(e) => onFieldChange("width", e.target.value)} placeholder="0" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs text-stone-400">Height (H)</Label>
                                        <Input type="number" value={formData.height}
                                            onChange={(e) => onFieldChange("height", e.target.value)} placeholder="0" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs text-stone-400">Dimension Unit</Label>
                                        <Select value={formData.dimension_uom || "cm"} onValueChange={(v) => onFieldChange("dimension_uom", v)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="cm">Centimeters</SelectItem>
                                                <SelectItem value="in">Inches</SelectItem>
                                                <SelectItem value="ft">Feet</SelectItem>
                                                <SelectItem value="mm">Millimeters</SelectItem>
                                                <SelectItem value="m">Meters</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            {/* Weights */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Weights</Label>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-xs text-stone-400">Gross Weight</Label>
                                        <Input type="number" step="0.01" value={formData.gross_weight || ""}
                                            onChange={(e) => onFieldChange("gross_weight", e.target.value)} placeholder="0.00" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs text-stone-400">Net Weight</Label>
                                        <Input type="number" step="0.01" value={formData.net_weight || ""}
                                            onChange={(e) => onFieldChange("net_weight", e.target.value)} placeholder="0.00" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs text-stone-400">Weight Unit</Label>
                                        <Select value={formData.weight_uom || "kg"} onValueChange={(v) => onFieldChange("weight_uom", v)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="kg">Kilograms</SelectItem>
                                                <SelectItem value="g">Grams</SelectItem>
                                                <SelectItem value="lb">Pounds</SelectItem>
                                                <SelectItem value="mt">Metric Tons</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            {/* Packaging Specs (packaging specific — thickness, gsm, ply) */}
                            <div className="space-y-2 border-t border-stone-100 pt-4">
                                <Label className="text-sm font-medium">Packaging Specifications</Label>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-xs text-stone-400">Thickness (micron)</Label>
                                        <Input type="number" value={formData.thickness_micron}
                                            onChange={(e) => onFieldChange("thickness_micron", e.target.value)} placeholder="0" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs text-stone-400">GSM</Label>
                                        <Input type="number" value={formData.gsm}
                                            onChange={(e) => onFieldChange("gsm", e.target.value)} placeholder="0" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs text-stone-400">Ply Count</Label>
                                        <Input type="number" value={formData.ply_count}
                                            onChange={(e) => onFieldChange("ply_count", e.target.value)} placeholder="0" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── SECTION 2: PRICING & TAX ── */}
                    {section.id === 2 && activeSection === 2 && (
                        <div className="px-4 py-4 space-y-5 border border-stone-100 rounded-b-lg -mt-1">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="buying_price">Buying Price (₹)</Label>
                                    <Input id="buying_price" type="number" min="0" step="0.01"
                                        value={formData.buying_price || ""}
                                        onChange={(e) => onFieldChange("buying_price", e.target.value)}
                                        placeholder="0.00" />
                                    <p className="text-xs text-stone-400">Purchase rate per {formData.stock_uom || 'unit'}</p>
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="standard_rate">Selling Price (₹) <span className="text-red-500">*</span></Label>
                                    <Input id="standard_rate" type="number" min="0" step="0.01"
                                        value={formData.standard_rate}
                                        onChange={(e) => onFieldChange("standard_rate", e.target.value)}
                                        placeholder="0.00" />
                                    <p className="text-xs text-stone-400">Sales rate per {formData.stock_uom || 'unit'}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="landed_cost">Landed Cost (₹)</Label>
                                    <Input id="landed_cost" type="number" min="0" step="0.01"
                                        value={formData.landed_cost || ""}
                                        onChange={(e) => onFieldChange("landed_cost", e.target.value)}
                                        placeholder="0.00" />
                                    <p className="text-xs text-stone-400">Additional costs (transport, handling per unit)</p>
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Tax Rate (%)</Label>
                                    <Select value={String(formData.gst_rate)} onValueChange={(v) => onFieldChange("gst_rate", v)}>
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

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={formData.price_inclusive_tax ?? false}
                                    onChange={(e) => onFieldChange("price_inclusive_tax", e.target.checked)}
                                    className="w-4 h-4 rounded border-stone-300 text-sky-600 focus:ring-sky-500" />
                                <span className="text-sm">Price is inclusive of taxes</span>
                            </label>
                        </div>
                    )}

                    {/* ── SECTION 3: STOCK & TRACKING ── */}
                    {section.id === 3 && activeSection === 3 && (
                        <div className="relative px-4 py-4 space-y-5 border border-stone-100 rounded-b-lg -mt-1">
                            {/* Coming Soon Overlay */}
                            <div className="absolute inset-0 bg-stone-50/80 backdrop-blur-[1px] z-10 rounded-b-lg flex flex-col items-center justify-center gap-2">
                                <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                    Inventory module coming soon
                                </div>
                                <p className="text-xs text-stone-500">Stock tracking, reorder points &amp; batch tracking will be available shortly.</p>
                            </div>
                            {/* Fields (greyed, behind overlay) */}
                            <div className="grid grid-cols-2 gap-4 opacity-40 pointer-events-none select-none">
                                <div className="space-y-1.5">
                                    <Label htmlFor="initial_stock">Initial Stock</Label>
                                    <Input id="initial_stock" type="number" min="0"
                                        value={formData.initial_stock || ""}
                                        onChange={() => { }} placeholder="0" disabled />
                                    <p className="text-xs text-stone-400">Opening stock balance</p>
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Tracking Method</Label>
                                    <Select value={formData.tracking_method || "none"} disabled>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            <SelectItem value="batch">Batchwise</SelectItem>
                                            <SelectItem value="serial">Serial Number</SelectItem>
                                            <SelectItem value="batch_serial">Batch + Serial No.</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="border-t border-stone-100 pt-4 opacity-40 pointer-events-none select-none">
                                <Label className="text-sm font-medium mb-3 block">Reorder &amp; Overstock</Label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-stone-400">Reorder Point</Label>
                                        <Input type="number" min="0" value="" onChange={() => { }} placeholder="Low stock alert threshold" disabled />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-stone-400">Overstock Point</Label>
                                        <Input type="number" min="0" value="" onChange={() => { }} placeholder="Max stock alert threshold" disabled />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── SECTION 4: SETTINGS ── */}
                    {section.id === 4 && activeSection === 4 && (
                        <div className="relative px-4 py-4 space-y-5 border border-stone-100 rounded-b-lg -mt-1">
                            {/* Coming Soon Overlay */}
                            <div className="absolute inset-0 bg-stone-50/80 backdrop-blur-[1px] z-10 rounded-b-lg flex flex-col items-center justify-center gap-2">
                                <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                    Advanced settings coming soon
                                </div>
                                <p className="text-xs text-stone-500">Product flags, invoicing policies & advanced settings will be configurable shortly.</p>
                            </div>
                            {/* Fields (greyed, behind overlay) */}
                            <div className="opacity-40 pointer-events-none select-none space-y-5">
                                <div className="space-y-3">
                                    <Label className="text-sm font-medium">Product Flags</Label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { key: "is_sales_item", label: "Sales Item", desc: "Can be sold to customers" },
                                            { key: "is_purchase_item", label: "Purchase Item", desc: "Can be purchased from suppliers" },
                                            { key: "is_stock_item", label: "Stock Item", desc: "Maintained in inventory" },
                                            { key: "maintain_stock", label: "Track Inventory", desc: "Track stock levels" },
                                        ].map(({ key, label, desc }) => (
                                            <label key={key} className="flex items-start gap-3 p-3 border border-stone-200 rounded-lg">
                                                <input type="checkbox" checked={true} readOnly disabled
                                                    className="mt-0.5 w-4 h-4 rounded border-stone-300 text-sky-600" />
                                                <div>
                                                    <p className="text-sm font-medium text-stone-800">{label}</p>
                                                    <p className="text-xs text-stone-400">{desc}</p>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label>Invoicing Policy</Label>
                                    <Select value="ordered" disabled>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ordered">Ordered Quantities</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="internal_notes">Internal Notes</Label>
                                    <Textarea id="internal_notes" value="" placeholder="Internal notes (not visible to customers)" rows={2} disabled />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
});

export default ProductForm;
