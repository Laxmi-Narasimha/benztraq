"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import ProductForm from "@/components/products/ProductForm";

/**
 * Products Management Page
 * Enterprise-grade product catalog with 6,448+ products
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

    // Form state - kept in parent for controlled form
    const [formData, setFormData] = useState({
        item_code: "",
        item_name: "",
        description: "",
        item_group_id: "",
        brand_id: "",
        stock_uom: "PCS",
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
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    // Handle form field change - stable callback
    const handleFieldChange = useCallback((field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    // Reset form
    const resetForm = useCallback(() => {
        setFormData({
            item_code: "",
            item_name: "",
            description: "",
            item_group_id: "",
            brand_id: "",
            stock_uom: "PCS",
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
    }, []);

    // Create product
    const handleCreate = async () => {
        if (!formData.item_code || !formData.item_name) {
            toast.error("Part Code and Item Name are required");
            return;
        }

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
            stock_uom: product.stock_uom || "PCS",
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

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Products</h1>
                    <p className="text-muted-foreground">
                        Manage your product catalog with Part Codes, dimensions, and GST compliance
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
                        <ProductForm
                            formData={formData}
                            onFieldChange={handleFieldChange}
                            itemGroups={itemGroups}
                            brands={brands}
                            hsnCodes={hsnCodes}
                        />
                        <DialogFooter>
                            <Button variant="outline" onClick={() => {
                                setIsCreateOpen(false);
                                resetForm();
                            }}>
                                Cancel
                            </Button>
                            <Button onClick={handleCreate}>Create Product</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by Part Code, Name, or Description..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                            <SelectTrigger className="w-[200px]">
                                <Filter className="h-4 w-4 mr-2" />
                                <SelectValue placeholder="All Categories" />
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
                        <Button variant="outline" onClick={fetchProducts} className="gap-2">
                            <RefreshCw className="h-4 w-4" />
                            Refresh
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
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Part Code</TableHead>
                                <TableHead>Item Name</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>UOM</TableHead>
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
                                    <TableCell colSpan={9} className="text-center py-10">
                                        Loading products...
                                    </TableCell>
                                </TableRow>
                            ) : products.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                                        No products found. Add your first product.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                products.map((product) => (
                                    <TableRow key={product.id}>
                                        <TableCell className="font-mono text-sm">
                                            {product.item_code}
                                        </TableCell>
                                        <TableCell className="font-medium max-w-[250px] truncate">
                                            {product.item_name}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {product.item_group?.name || "-"}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{product.stock_uom}</Badge>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {formatDimensions(product)}
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">
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
                                    <ChevronLeft className="h-4 w-4" />
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                                    disabled={pagination.page >= pagination.totalPages}
                                >
                                    Next
                                    <ChevronRight className="h-4 w-4" />
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
                    <ProductForm
                        formData={formData}
                        onFieldChange={handleFieldChange}
                        itemGroups={itemGroups}
                        brands={brands}
                        hsnCodes={hsnCodes}
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setIsEditOpen(false);
                            setEditingProduct(null);
                            resetForm();
                        }}>
                            Cancel
                        </Button>
                        <Button onClick={handleUpdate}>Update Product</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
