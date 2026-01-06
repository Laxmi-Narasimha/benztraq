"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
    Plus,
    Search,
    Package,
    Filter,
    RefreshCw,
    Edit,
    Trash2,
    MoreHorizontal,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

/**
 * Products Management Page
 * Full CRUD interface for product catalog
 */
export default function ProductsPage() {
    // State
    const [products, setProducts] = useState([]);
    const [itemGroups, setItemGroups] = useState([]);
    const [brands, setBrands] = useState([]);
    const [hsnCodes, setHsnCodes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedGroup, setSelectedGroup] = useState("all");
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 25,
        total: 0,
        totalPages: 0
    });

    // Dialog states
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState({
        item_code: "",
        item_name: "",
        description: "",
        item_group_id: "",
        brand_id: "",
        stock_uom: "Nos",
        standard_rate: 0,
        hsn_sac_code: "",
        gst_rate: 18,
        length: "",
        width: "",
        height: "",
        dimension_uom: "mm",
        thickness_micron: "",
        gsm: "",
        ply_count: ""
    });

    // Fetch products
    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
                search,
                ...(selectedGroup !== "all" && { item_group_id: selectedGroup })
            });

            const res = await fetch(`/api/products?${params}`);
            const data = await res.json();

            if (res.ok) {
                setProducts(data.products || []);
                setPagination(prev => ({
                    ...prev,
                    total: data.pagination?.total || 0,
                    totalPages: data.pagination?.totalPages || 0
                }));
            } else {
                toast.error(data.error || "Failed to fetch products");
            }
        } catch (error) {
            console.error("Error fetching products:", error);
            toast.error("Failed to load products");
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.limit, search, selectedGroup]);

    // Fetch item groups
    const fetchItemGroups = useCallback(async () => {
        try {
            const res = await fetch("/api/products/item-groups");
            const data = await res.json();
            if (res.ok) {
                setItemGroups(data.itemGroups || []);
            }
        } catch (error) {
            console.error("Error fetching item groups:", error);
        }
    }, []);

    // Fetch brands
    const fetchBrands = useCallback(async () => {
        try {
            const res = await fetch("/api/products/brands");
            const data = await res.json();
            if (res.ok) {
                setBrands(data.brands || []);
            }
        } catch (error) {
            console.error("Error fetching brands:", error);
        }
    }, []);

    // Fetch HSN codes
    const fetchHsnCodes = useCallback(async () => {
        try {
            const res = await fetch("/api/products/hsn-codes");
            const data = await res.json();
            if (res.ok) {
                setHsnCodes(data.hsnCodes || []);
            }
        } catch (error) {
            console.error("Error fetching HSN codes:", error);
        }
    }, []);

    // Initial load
    useEffect(() => {
        fetchProducts();
        fetchItemGroups();
        fetchBrands();
        fetchHsnCodes();
    }, [fetchProducts, fetchItemGroups, fetchBrands, fetchHsnCodes]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            setPagination(prev => ({ ...prev, page: 1 }));
            fetchProducts();
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    // Handle form input change
    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Reset form
    const resetForm = () => {
        setFormData({
            item_code: "",
            item_name: "",
            description: "",
            item_group_id: "",
            brand_id: "",
            stock_uom: "Nos",
            standard_rate: 0,
            hsn_sac_code: "",
            gst_rate: 18,
            length: "",
            width: "",
            height: "",
            dimension_uom: "mm",
            thickness_micron: "",
            gsm: "",
            ply_count: ""
        });
    };

    // Create product
    const handleCreate = async () => {
        try {
            const res = await fetch("/api/products", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    standard_rate: parseFloat(formData.standard_rate) || 0,
                    gst_rate: parseFloat(formData.gst_rate) || 18,
                    length: formData.length ? parseFloat(formData.length) : null,
                    width: formData.width ? parseFloat(formData.width) : null,
                    height: formData.height ? parseFloat(formData.height) : null,
                    thickness_micron: formData.thickness_micron ? parseFloat(formData.thickness_micron) : null,
                    gsm: formData.gsm ? parseFloat(formData.gsm) : null,
                    ply_count: formData.ply_count ? parseInt(formData.ply_count) : null,
                    item_group_id: formData.item_group_id || null,
                    brand_id: formData.brand_id || null,
                    hsn_sac_code: formData.hsn_sac_code || null
                })
            });

            const data = await res.json();
            if (res.ok) {
                toast.success("Product created successfully");
                setIsCreateOpen(false);
                resetForm();
                fetchProducts();
            } else {
                toast.error(data.error || "Failed to create product");
            }
        } catch (error) {
            console.error("Error creating product:", error);
            toast.error("Failed to create product");
        }
    };

    // Edit product
    const handleEdit = (product) => {
        setEditingProduct(product);
        setFormData({
            item_code: product.item_code || "",
            item_name: product.item_name || "",
            description: product.description || "",
            item_group_id: product.item_group_id || "",
            brand_id: product.brand_id || "",
            stock_uom: product.stock_uom || "Nos",
            standard_rate: product.standard_rate || 0,
            hsn_sac_code: product.hsn_sac_code || "",
            gst_rate: product.gst_rate || 18,
            length: product.length || "",
            width: product.width || "",
            height: product.height || "",
            dimension_uom: product.dimension_uom || "mm",
            thickness_micron: product.thickness_micron || "",
            gsm: product.gsm || "",
            ply_count: product.ply_count || ""
        });
        setIsEditOpen(true);
    };

    // Update product
    const handleUpdate = async () => {
        if (!editingProduct) return;

        try {
            const res = await fetch(`/api/products/${editingProduct.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    standard_rate: parseFloat(formData.standard_rate) || 0,
                    gst_rate: parseFloat(formData.gst_rate) || 18,
                    length: formData.length ? parseFloat(formData.length) : null,
                    width: formData.width ? parseFloat(formData.width) : null,
                    height: formData.height ? parseFloat(formData.height) : null,
                    thickness_micron: formData.thickness_micron ? parseFloat(formData.thickness_micron) : null,
                    gsm: formData.gsm ? parseFloat(formData.gsm) : null,
                    ply_count: formData.ply_count ? parseInt(formData.ply_count) : null,
                    item_group_id: formData.item_group_id || null,
                    brand_id: formData.brand_id || null,
                    hsn_sac_code: formData.hsn_sac_code || null
                })
            });

            const data = await res.json();
            if (res.ok) {
                toast.success("Product updated successfully");
                setIsEditOpen(false);
                setEditingProduct(null);
                resetForm();
                fetchProducts();
            } else {
                toast.error(data.error || "Failed to update product");
            }
        } catch (error) {
            console.error("Error updating product:", error);
            toast.error("Failed to update product");
        }
    };

    // Delete product
    const handleDelete = async (product) => {
        if (!confirm(`Are you sure you want to disable "${product.item_name}"?`)) {
            return;
        }

        try {
            const res = await fetch(`/api/products/${product.id}`, {
                method: "DELETE"
            });

            const data = await res.json();
            if (res.ok) {
                toast.success("Product disabled successfully");
                fetchProducts();
            } else {
                toast.error(data.error || "Failed to delete product");
            }
        } catch (error) {
            console.error("Error deleting product:", error);
            toast.error("Failed to delete product");
        }
    };

    // Format dimensions
    const formatDimensions = (product) => {
        if (!product.length && !product.width && !product.height) return "-";
        const dims = [product.length, product.width, product.height]
            .filter(Boolean)
            .join(" × ");
        return `${dims} ${product.dimension_uom || "mm"}`;
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 0
        }).format(amount || 0);
    };

    // Product Form Component
    const ProductForm = ({ onSubmit, submitLabel }) => (
        <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="item_code">Item Code *</Label>
                    <Input
                        id="item_code"
                        value={formData.item_code}
                        onChange={(e) => handleInputChange("item_code", e.target.value)}
                        placeholder="VCI-BAG-001"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="item_name">Item Name *</Label>
                    <Input
                        id="item_name"
                        value={formData.item_name}
                        onChange={(e) => handleInputChange("item_name", e.target.value)}
                        placeholder="VCI 3D Bag 1200x800x800mm"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Product description..."
                    rows={2}
                />
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="item_group_id">Category</Label>
                    <Select
                        value={formData.item_group_id}
                        onValueChange={(v) => handleInputChange("item_group_id", v)}
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
                    <Label htmlFor="brand_id">Brand</Label>
                    <Select
                        value={formData.brand_id}
                        onValueChange={(v) => handleInputChange("brand_id", v)}
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
                    <Label htmlFor="stock_uom">Unit of Measure</Label>
                    <Select
                        value={formData.stock_uom}
                        onValueChange={(v) => handleInputChange("stock_uom", v)}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Nos">Nos</SelectItem>
                            <SelectItem value="Kg">Kg</SelectItem>
                            <SelectItem value="Roll">Roll</SelectItem>
                            <SelectItem value="Pcs">Pcs</SelectItem>
                            <SelectItem value="Box">Box</SelectItem>
                            <SelectItem value="Set">Set</SelectItem>
                            <SelectItem value="Mtr">Mtr</SelectItem>
                            <SelectItem value="SqMtr">SqMtr</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="standard_rate">Standard Rate (₹)</Label>
                    <Input
                        id="standard_rate"
                        type="number"
                        value={formData.standard_rate}
                        onChange={(e) => handleInputChange("standard_rate", e.target.value)}
                        placeholder="0.00"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="hsn_sac_code">HSN Code</Label>
                    <Select
                        value={formData.hsn_sac_code}
                        onValueChange={(v) => handleInputChange("hsn_sac_code", v)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select HSN" />
                        </SelectTrigger>
                        <SelectContent>
                            {hsnCodes.map((hsn) => (
                                <SelectItem key={hsn.hsn_code} value={hsn.hsn_code}>
                                    {hsn.hsn_code} - {hsn.description?.substring(0, 30)}...
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="gst_rate">GST Rate (%)</Label>
                    <Select
                        value={formData.gst_rate.toString()}
                        onValueChange={(v) => handleInputChange("gst_rate", v)}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="0">0%</SelectItem>
                            <SelectItem value="5">5%</SelectItem>
                            <SelectItem value="12">12%</SelectItem>
                            <SelectItem value="18">18%</SelectItem>
                            <SelectItem value="28">28%</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="border-t pt-4 mt-2">
                <h4 className="font-medium mb-3">Dimensions</h4>
                <div className="grid grid-cols-5 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="length">Length</Label>
                        <Input
                            id="length"
                            type="number"
                            value={formData.length}
                            onChange={(e) => handleInputChange("length", e.target.value)}
                            placeholder="0"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="width">Width</Label>
                        <Input
                            id="width"
                            type="number"
                            value={formData.width}
                            onChange={(e) => handleInputChange("width", e.target.value)}
                            placeholder="0"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="height">Height</Label>
                        <Input
                            id="height"
                            type="number"
                            value={formData.height}
                            onChange={(e) => handleInputChange("height", e.target.value)}
                            placeholder="0"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="dimension_uom">Unit</Label>
                        <Select
                            value={formData.dimension_uom}
                            onValueChange={(v) => handleInputChange("dimension_uom", v)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="mm">mm</SelectItem>
                                <SelectItem value="cm">cm</SelectItem>
                                <SelectItem value="inch">inch</SelectItem>
                                <SelectItem value="mtr">mtr</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="thickness_micron">Micron</Label>
                        <Input
                            id="thickness_micron"
                            type="number"
                            value={formData.thickness_micron}
                            onChange={(e) => handleInputChange("thickness_micron", e.target.value)}
                            placeholder="75"
                        />
                    </div>
                </div>
            </div>

            <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => {
                    setIsCreateOpen(false);
                    setIsEditOpen(false);
                    resetForm();
                }}>
                    Cancel
                </Button>
                <Button onClick={onSubmit}>{submitLabel}</Button>
            </DialogFooter>
        </div>
    );

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Products</h1>
                    <p className="text-muted-foreground">
                        Manage your product catalog with dimensions, pricing, and GST compliance
                    </p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2" onClick={resetForm}>
                            <Plus className="h-4 w-4" />
                            Add Product
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                        <DialogHeader>
                            <DialogTitle>Create New Product</DialogTitle>
                            <DialogDescription>
                                Add a new product to your catalog
                            </DialogDescription>
                        </DialogHeader>
                        <ProductForm onSubmit={handleCreate} submitLabel="Create Product" />
                    </DialogContent>
                </Dialog>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex gap-4 items-center">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by code, name, or description..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                            <SelectTrigger className="w-[200px]">
                                <Filter className="h-4 w-4 mr-2" />
                                <SelectValue placeholder="Filter by category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {itemGroups.map((group) => (
                                    <SelectItem key={group.id} value={group.id}>
                                        {group.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button variant="outline" size="icon" onClick={fetchProducts}>
                            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Products Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Product Catalog
                        <Badge variant="secondary" className="ml-2">
                            {pagination.total} products
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Item Code</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Dimensions</TableHead>
                                    <TableHead>HSN</TableHead>
                                    <TableHead className="text-right">Rate</TableHead>
                                    <TableHead className="text-right">GST</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8">
                                            <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                        </TableCell>
                                    </TableRow>
                                ) : products.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                            No products found. Create your first product to get started.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    products.map((product) => (
                                        <TableRow key={product.id}>
                                            <TableCell className="font-mono text-sm">
                                                {product.item_code}
                                            </TableCell>
                                            <TableCell className="font-medium max-w-[200px] truncate">
                                                {product.item_name}
                                            </TableCell>
                                            <TableCell>
                                                {product.item_group?.name || "-"}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {formatDimensions(product)}
                                                {product.thickness_micron && (
                                                    <span className="ml-1">({product.thickness_micron}μ)</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="font-mono text-sm">
                                                {product.hsn_sac_code || "-"}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(product.standard_rate)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {product.gst_rate}%
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleEdit(product)}>
                                                            <Edit className="h-4 w-4 mr-2" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleDelete(product)}
                                                            className="text-destructive"
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Disable
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4">
                            <p className="text-sm text-muted-foreground">
                                Page {pagination.page} of {pagination.totalPages}
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                                    disabled={pagination.page <= 1}
                                >
                                    <ChevronLeft className="h-4 w-4 mr-1" />
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                                    disabled={pagination.page >= pagination.totalPages}
                                >
                                    Next
                                    <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Edit Product</DialogTitle>
                        <DialogDescription>
                            Update product details
                        </DialogDescription>
                    </DialogHeader>
                    <ProductForm onSubmit={handleUpdate} submitLabel="Save Changes" />
                </DialogContent>
            </Dialog>
        </div>
    );
}
