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
import {
    Plus,
    Search,
    Users,
    Filter,
    RefreshCw,
    Edit,
    Trash2,
    MoreHorizontal,
    ChevronLeft,
    ChevronRight,
    Building2,
    MapPin,
    Phone,
    Mail,
    Target
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

/**
 * Customers Management Page
 * Full CRUD interface for customer management
 * 
 * STRICT DATA ISOLATION:
 * - ASMs only see customers from their assigned region
 * - Directors/VP/Developers see all data
 */
export default function CustomersPage() {
    // State
    const [customers, setCustomers] = useState([]);
    const [industries, setIndustries] = useState([]);
    const [customerGroups, setCustomerGroups] = useState([]);
    const [regions, setRegions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedIndustry, setSelectedIndustry] = useState("all");
    const [userInfo, setUserInfo] = useState({ role: '', region: '', canSeeAllData: false });
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 25,
        total: 0,
        totalPages: 0
    });

    // Dialog states
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        customer_code: "",
        customer_type: "Company",
        customer_group_id: "",
        industry_id: "",
        region_id: "",
        gstin: "",
        pan: "",
        tax_category: "Regular",
        credit_limit: 0,
        credit_days: 30,
        email: "",
        phone: "",
        status: "Active"
    });

    // Fetch customers
    const fetchCustomers = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
                search,
                ...(selectedIndustry !== "all" && { industry_id: selectedIndustry })
            });

            const res = await fetch(`/api/customers?${params}`);
            const data = await res.json();

            if (res.ok) {
                setCustomers(data.customers || []);
                setPagination(prev => ({
                    ...prev,
                    total: data.pagination?.total || 0,
                    totalPages: data.pagination?.totalPages || 0
                }));
                // Set user info for region indicator banner
                if (data.userInfo) {
                    setUserInfo(data.userInfo);
                }
            } else {
                toast.error(data.error || "Failed to fetch customers");
            }
        } catch (error) {
            console.error("Error fetching customers:", error);
            toast.error("Failed to load customers");
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.limit, search, selectedIndustry]);

    // Fetch industries
    const fetchIndustries = useCallback(async () => {
        try {
            const res = await fetch("/api/customers/industries");
            const data = await res.json();
            if (res.ok) {
                setIndustries(data.industries || []);
            }
        } catch (error) {
            console.error("Error fetching industries:", error);
        }
    }, []);

    // Fetch customer groups
    const fetchCustomerGroups = useCallback(async () => {
        try {
            const res = await fetch("/api/customers/groups");
            const data = await res.json();
            if (res.ok) {
                setCustomerGroups(data.customerGroups || []);
            }
        } catch (error) {
            console.error("Error fetching customer groups:", error);
        }
    }, []);

    // Fetch regions
    const fetchRegions = useCallback(async () => {
        try {
            const res = await fetch("/api/users?type=regions");
            const data = await res.json();
            if (res.ok) {
                setRegions(data.regions || []);
            }
        } catch (error) {
            console.error("Error fetching regions:", error);
        }
    }, []);

    // Initial load
    useEffect(() => {
        fetchCustomers();
        fetchIndustries();
        fetchCustomerGroups();
        fetchRegions();
    }, [fetchCustomers, fetchIndustries, fetchCustomerGroups, fetchRegions]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            setPagination(prev => ({ ...prev, page: 1 }));
            fetchCustomers();
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
            name: "",
            customer_code: "",
            customer_type: "Company",
            customer_group_id: "",
            industry_id: "",
            region_id: "",
            gstin: "",
            pan: "",
            tax_category: "Regular",
            credit_limit: 0,
            credit_days: 30,
            email: "",
            phone: "",
            status: "Active"
        });
    };

    // Create customer
    const handleCreate = async () => {
        try {
            const res = await fetch("/api/customers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    credit_limit: parseFloat(formData.credit_limit) || 0,
                    credit_days: parseInt(formData.credit_days) || 30,
                    customer_group_id: formData.customer_group_id || null,
                    industry_id: formData.industry_id || null,
                    region_id: formData.region_id || null
                })
            });

            const data = await res.json();
            if (res.ok) {
                toast.success("Customer created successfully");
                setIsCreateOpen(false);
                resetForm();
                fetchCustomers();
            } else {
                toast.error(data.error || "Failed to create customer");
            }
        } catch (error) {
            console.error("Error creating customer:", error);
            toast.error("Failed to create customer");
        }
    };

    // Edit customer
    const handleEdit = (customer) => {
        setEditingCustomer(customer);
        setFormData({
            name: customer.name || "",
            customer_code: customer.customer_code || "",
            customer_type: customer.customer_type || "Company",
            customer_group_id: customer.customer_group_id || "",
            industry_id: customer.industry_id || "",
            region_id: customer.region_id || "",
            gstin: customer.gstin || "",
            pan: customer.pan || "",
            tax_category: customer.tax_category || "Regular",
            credit_limit: customer.credit_limit || 0,
            credit_days: customer.credit_days || 30,
            email: customer.email || "",
            phone: customer.phone || "",
            status: customer.status || "Active"
        });
        setIsEditOpen(true);
    };

    // Update customer
    const handleUpdate = async () => {
        if (!editingCustomer) return;

        try {
            const res = await fetch(`/api/customers/${editingCustomer.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    credit_limit: parseFloat(formData.credit_limit) || 0,
                    credit_days: parseInt(formData.credit_days) || 30,
                    customer_group_id: formData.customer_group_id || null,
                    industry_id: formData.industry_id || null,
                    region_id: formData.region_id || null
                })
            });

            const data = await res.json();
            if (res.ok) {
                toast.success("Customer updated successfully");
                setIsEditOpen(false);
                setEditingCustomer(null);
                resetForm();
                fetchCustomers();
            } else {
                toast.error(data.error || "Failed to update customer");
            }
        } catch (error) {
            console.error("Error updating customer:", error);
            toast.error("Failed to update customer");
        }
    };

    // Delete customer
    const handleDelete = async (customer) => {
        if (!confirm(`Are you sure you want to deactivate "${customer.name}"?`)) {
            return;
        }

        try {
            const res = await fetch(`/api/customers/${customer.id}`, {
                method: "DELETE"
            });

            const data = await res.json();
            if (res.ok) {
                toast.success("Customer deactivated successfully");
                fetchCustomers();
            } else {
                toast.error(data.error || "Failed to delete customer");
            }
        } catch (error) {
            console.error("Error deleting customer:", error);
            toast.error("Failed to delete customer");
        }
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 0
        }).format(amount || 0);
    };

    // Get status badge variant
    const getStatusVariant = (status) => {
        switch (status) {
            case "Active": return "default";
            case "Inactive": return "secondary";
            case "Suspended": return "destructive";
            default: return "outline";
        }
    };

    // Customer Form Component
    const CustomerForm = ({ onSubmit, submitLabel }) => (
        <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Customer Name *</Label>
                    <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        placeholder="Maruti Suzuki India Ltd"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="customer_code">Customer Code</Label>
                    <Input
                        id="customer_code"
                        value={formData.customer_code}
                        onChange={(e) => handleInputChange("customer_code", e.target.value)}
                        placeholder="Auto-generated if empty"
                    />
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="customer_type">Customer Type</Label>
                    <Select
                        value={formData.customer_type}
                        onValueChange={(v) => handleInputChange("customer_type", v)}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Company">Company</SelectItem>
                            <SelectItem value="Individual">Individual</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="customer_group_id">Customer Group</Label>
                    <Select
                        value={formData.customer_group_id}
                        onValueChange={(v) => handleInputChange("customer_group_id", v)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select group" />
                        </SelectTrigger>
                        <SelectContent>
                            {customerGroups.map((group) => (
                                <SelectItem key={group.id} value={group.id}>
                                    {group.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="industry_id">Industry</Label>
                    <Select
                        value={formData.industry_id}
                        onValueChange={(v) => handleInputChange("industry_id", v)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                        <SelectContent>
                            {industries.map((ind) => (
                                <SelectItem key={ind.id} value={ind.id}>
                                    {ind.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        placeholder="contact@company.com"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        placeholder="+91 98765 43210"
                    />
                </div>
            </div>

            <div className="border-t pt-4 mt-2">
                <h4 className="font-medium mb-3">Tax Information</h4>
                <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="gstin">GSTIN</Label>
                        <Input
                            id="gstin"
                            value={formData.gstin}
                            onChange={(e) => handleInputChange("gstin", e.target.value.toUpperCase())}
                            placeholder="22AAAAA0000A1Z5"
                            maxLength={15}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="pan">PAN</Label>
                        <Input
                            id="pan"
                            value={formData.pan}
                            onChange={(e) => handleInputChange("pan", e.target.value.toUpperCase())}
                            placeholder="AAAAA1234A"
                            maxLength={10}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="tax_category">Tax Category</Label>
                        <Select
                            value={formData.tax_category}
                            onValueChange={(v) => handleInputChange("tax_category", v)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Regular">Regular</SelectItem>
                                <SelectItem value="Composition">Composition</SelectItem>
                                <SelectItem value="SEZ">SEZ</SelectItem>
                                <SelectItem value="Unregistered">Unregistered</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            <div className="border-t pt-4 mt-2">
                <h4 className="font-medium mb-3">Credit Terms</h4>
                <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="credit_limit">Credit Limit (₹)</Label>
                        <Input
                            id="credit_limit"
                            type="number"
                            value={formData.credit_limit}
                            onChange={(e) => handleInputChange("credit_limit", e.target.value)}
                            placeholder="0"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="credit_days">Credit Days</Label>
                        <Input
                            id="credit_days"
                            type="number"
                            value={formData.credit_days}
                            onChange={(e) => handleInputChange("credit_days", e.target.value)}
                            placeholder="30"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select
                            value={formData.status}
                            onValueChange={(v) => handleInputChange("status", v)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Active">Active</SelectItem>
                                <SelectItem value="Inactive">Inactive</SelectItem>
                                <SelectItem value="Suspended">Suspended</SelectItem>
                            </SelectContent>
                        </Select>
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
            {/* Region Indicator Banner */}
            {userInfo.region && !userInfo.canSeeAllData && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    <div>
                        <p className="font-medium text-blue-900">
                            Viewing data for: <span className="font-bold">{userInfo.region}</span>
                        </p>
                        <p className="text-sm text-blue-700">
                            You can only see customers from your assigned region.
                        </p>
                    </div>
                </div>
            )}

            {userInfo.canSeeAllData && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center gap-3">
                    <Target className="h-5 w-5 text-emerald-600" />
                    <div>
                        <p className="font-medium text-emerald-900">
                            Viewing: <span className="font-bold">All Regions</span>
                        </p>
                        <p className="text-sm text-emerald-700">
                            You have access to view customers from all regions.
                        </p>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
                    <p className="text-muted-foreground">
                        Manage your customer relationships, credit terms, and GST details
                    </p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2" onClick={resetForm}>
                            <Plus className="h-4 w-4" />
                            Add Customer
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                        <DialogHeader>
                            <DialogTitle>Create New Customer</DialogTitle>
                            <DialogDescription>
                                Add a new customer to your CRM
                            </DialogDescription>
                        </DialogHeader>
                        <CustomerForm onSubmit={handleCreate} submitLabel="Create Customer" />
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
                                placeholder="Search by name, code, or GSTIN..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                            <SelectTrigger className="w-[200px]">
                                <Filter className="h-4 w-4 mr-2" />
                                <SelectValue placeholder="Filter by industry" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Industries</SelectItem>
                                {industries.map((ind) => (
                                    <SelectItem key={ind.id} value={ind.id}>
                                        {ind.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button variant="outline" size="icon" onClick={fetchCustomers}>
                            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Customers Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Customer Directory
                        <Badge variant="secondary" className="ml-2">
                            {pagination.total} customers
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Industry</TableHead>
                                    <TableHead>GSTIN</TableHead>
                                    <TableHead>Credit Limit</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8">
                                            <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                        </TableCell>
                                    </TableRow>
                                ) : customers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            No customers found. Add your first customer to get started.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    customers.map((customer) => (
                                        <TableRow key={customer.id}>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{customer.name}</span>
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        {customer.customer_code && (
                                                            <span className="font-mono">{customer.customer_code}</span>
                                                        )}
                                                        {customer.email && (
                                                            <span className="flex items-center gap-1">
                                                                <Mail className="h-3 w-3" />
                                                                {customer.email}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {customer.industry?.name || "-"}
                                            </TableCell>
                                            <TableCell className="font-mono text-sm">
                                                {customer.gstin || "-"}
                                            </TableCell>
                                            <TableCell>
                                                {formatCurrency(customer.credit_limit)}
                                                <span className="text-muted-foreground text-sm ml-1">
                                                    ({customer.credit_days || 30} days)
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={getStatusVariant(customer.status)}>
                                                    {customer.status || "Active"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleEdit(customer)}>
                                                            <Edit className="h-4 w-4 mr-2" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleDelete(customer)}
                                                            className="text-destructive"
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Deactivate
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
                        <DialogTitle>Edit Customer</DialogTitle>
                        <DialogDescription>
                            Update customer details
                        </DialogDescription>
                    </DialogHeader>
                    <CustomerForm onSubmit={handleUpdate} submitLabel="Save Changes" />
                </DialogContent>
            </Dialog>
        </div>
    );
}
