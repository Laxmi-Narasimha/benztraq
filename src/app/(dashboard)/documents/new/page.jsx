'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import {
    ArrowLeft,
    Plus,
    Trash2,
    Save,
    Check,
    Loader2,
    AlertCircle,
    Building2,
    FileText,
    Package,
    Calculator,
    Search,
    ChevronDown,
    X,
    Filter
} from 'lucide-react';
import {
    computeLineAmounts,
    computeDocumentTotals,
    determineFiscalPosition,
    amountToWords,
    GST_RATES,
    COMPANY_STATE_CODE
} from '@/lib/services/tax-computation';
import OdooCustomerSelect from '@/components/odoo/OdooCustomerSelect';

// Indian States
const INDIAN_STATES = [
    { code: 'AN', name: 'Andaman and Nicobar' },
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

const PAYMENT_TERMS = [
    { value: 'immediate', label: 'Immediate Payment' },
    { value: 'advance', label: '100% Advance' },
    { value: 'advance_50', label: '50% Advance' },
    { value: 'net15', label: '15 Days' },
    { value: 'net30', label: '30 Days' },
    { value: 'net45', label: '45 Days' },
    { value: 'net60', label: '60 Days' },
];

/**
 * Portal-based Searchable Dropdown
 * Renders the dropdown menu in a portal to avoid clipping issues in overflow containers.
 */
function SearchableDropdown({
    options,
    value,
    onChange,
    placeholder = "Select...",
    displayKey = "name",
    valueKey = "id",
    searchKeys = ["name"],
    className = "",
    disabled = false,
    filterFn = null // Optional filter function
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
    const triggerRef = useRef(null);
    const inputRef = useRef(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Update position when opening
    useEffect(() => {
        if (isOpen && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setPosition({
                top: rect.bottom + window.scrollY + 4,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    }, [isOpen]);

    // Handle outside click
    useEffect(() => {
        if (!isOpen) return;
        const handleClick = (e) => {
            if (triggerRef.current && triggerRef.current.contains(e.target)) return;
            // Check if click is inside the portal content (we can't easily ref it due to portal, but we can check class or Id)
            if (e.target.closest('.dropdown-portal-content')) return;
            setIsOpen(false);
            setSearch('');
        };
        window.addEventListener('mousedown', handleClick);
        window.addEventListener('resize', () => setIsOpen(false));
        return () => {
            window.removeEventListener('mousedown', handleClick);
            window.removeEventListener('resize', () => setIsOpen(false));
        };
    }, [isOpen]);

    const handleSelect = (option) => {
        onChange(option[valueKey]);
        setIsOpen(false);
        setSearch('');
    };

    const handleClear = (e) => {
        e.stopPropagation();
        onChange('');
        setSearch('');
    };

    const selectedOption = options.find(opt => opt[valueKey] === value);

    // Filter options
    let filteredOptions = options;
    if (filterFn) {
        filteredOptions = filteredOptions.filter(filterFn);
    }

    filteredOptions = filteredOptions.filter(opt => {
        if (!search) return true;
        const searchLower = search.toLowerCase();
        return searchKeys.some(key => {
            const val = opt[key];
            return val && String(val).toLowerCase().includes(searchLower);
        });
    });

    return (
        <div className={`relative ${className}`}>
            <button
                ref={triggerRef}
                type="button"
                disabled={disabled}
                onClick={() => {
                    if (!disabled) {
                        setIsOpen(!isOpen);
                        // Focus input after render
                        setTimeout(() => {
                            const input = document.getElementById(`dropdown-input-${valueKey}`);
                            if (input) input.focus();
                        }, 50);
                    }
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-left 
                    bg-white border rounded-lg shadow-sm transition-all
                    ${disabled ? 'bg-gray-100 cursor-not-allowed border-gray-200' : 'hover:border-indigo-400 cursor-pointer border-gray-300'}
                    ${isOpen ? 'ring-2 ring-indigo-500/20 border-indigo-500' : ''}`}
            >
                <div className="flex-1 truncate mr-2">
                    {selectedOption ? (
                        <span className="text-gray-900 font-medium">{selectedOption[displayKey]}</span>
                    ) : (
                        <span className="text-gray-400">{placeholder}</span>
                    )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                    {value && !disabled && (
                        <span
                            onClick={handleClear}
                            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X className="w-3 h-3 text-gray-400 hover:text-gray-600" />
                        </span>
                    )}
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </button>

            {/* Portal Content */}
            {mounted && isOpen && createPortal(
                <div
                    className="dropdown-portal-content fixed z-50 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100"
                    style={{
                        top: position.top,
                        left: position.left,
                        width: position.width,
                        maxHeight: '300px' // Ensure it fits in viewport usually
                    }}
                >
                    <div className="p-2 border-b border-gray-100 bg-gray-50/50">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                id={`dropdown-input-${valueKey}`}
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Type to search..."
                                className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-md 
                                    focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                            />
                        </div>
                    </div>

                    <div className="overflow-y-auto flex-1 p-1">
                        {filteredOptions.length === 0 ? (
                            <div className="px-3 py-6 text-sm text-gray-500 text-center flex flex-col items-center">
                                <Search className="w-8 h-8 text-gray-300 mb-2" />
                                <p>No matching results</p>
                            </div>
                        ) : (
                            filteredOptions.slice(0, 100).map((option, idx) => (
                                <button
                                    key={option[valueKey] || idx}
                                    type="button"
                                    onClick={() => handleSelect(option)}
                                    className={`w-full px-3 py-2 text-left text-sm rounded-md transition-colors
                                        flex items-center justify-between group
                                        ${value === option[valueKey] ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}`}
                                >
                                    <div className="flex flex-col">
                                        <span>{option[displayKey]}</span>
                                        {option.subtext && <span className="text-xs text-gray-400 font-normal">{option.subtext}</span>}
                                    </div>
                                    {value === option[valueKey] && (
                                        <Check className="w-4 h-4 text-indigo-600" />
                                    )}
                                </button>
                            ))
                        )}
                        {filteredOptions.length > 100 && (
                            <div className="px-3 py-2 text-xs text-center text-gray-400 border-t border-gray-100 bg-gray-50">
                                Showing 100 of {filteredOptions.length} results
                            </div>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}

// Format currency
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
    }).format(amount || 0);
};

export default function NewQuotationPage() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [productFilterMode, setProductFilterMode] = useState('all'); // 'all', 'customer_linked'

    // Document state
    const [document, setDocument] = useState({
        partner_id: '',
        partner_name: '',
        partner_gstin: '',
        partner_state_code: '',
        invoice_address: '',
        date_order: new Date().toISOString().split('T')[0],
        validity_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        state: 'draft',
        fiscal_position: 'intrastate',
        place_of_supply: '',
        payment_term_note: 'advance',
        client_order_ref: '',
        note: '',
    });

    // Line items
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

    // Load data on mount
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
            console.log('Fetching customers...');
            const res = await fetch('/api/customers?limit=1000'); // Fetch more to be safe
            const data = await res.json();

            if (data.customers && Array.isArray(data.customers)) {
                // Normalize and prepare customer data for dropdown
                const normalized = data.customers.map(c => ({
                    ...c,
                    name: c.name || c.customer_name || 'Unknown',
                    gstin: c.gstin || '',
                    state_code: c.state_code || '',
                    address: c.billing_address || c.address || '',
                    // Create subtext for better search
                    subtext: [c.customer_code, c.gstin, c.state_code].filter(Boolean).join(' • ')
                }));
                console.log(`Loaded ${normalized.length} customers`);
                setCustomers(normalized);
            } else {
                console.warn('Unexpected customer data format:', data);
                setCustomers([]);
            }
        } catch (err) {
            console.error('Failed to load customers:', err);
            setError('Failed to load customers list. Please try refreshing.');
        }
    };

    const loadProducts = async () => {
        try {
            const res = await fetch('/api/products?limit=2000');
            const data = await res.json();
            const productList = data.products || data || [];
            // Normalize product names
            setProducts(productList.map(p => ({
                ...p,
                name: p.item_name || p.name || 'Unknown',
                hsn_code: p.hsn_code || '39232100',
                selling_price: p.selling_price || 0,
                default_gst_rate: p.default_gst_rate || 18,
                subtext: [p.item_code, p.description?.substring(0, 30)].filter(Boolean).join(' • ')
            })));
        } catch (err) {
            console.error('Failed to load products:', err);
        }
    };

    // Filter products based on selected customer
    const getProductFilter = useCallback(() => {
        if (productFilterMode === 'all' || !document.partner_id) return null;

        const customer = customers.find(c => c.id === document.partner_id);
        if (!customer) return null;

        // Smart Filtering Logic:
        // 1. If customer has a code like "CUST-001", maybe products don't match that.
        // 2. Try to match the first word of customer name (e.g. "TATA" from "Tata Motors")

        const namePrefix = customer.name.split(' ')[0].substring(0, 3).toUpperCase();

        return (product) => {
            if (!product.item_code) return true;
            const code = product.item_code.toUpperCase();
            // Match if product code starts with name prefix OR matches customer code patterns
            return code.startsWith(namePrefix); // Simple prefix match
        };
    }, [productFilterMode, document.partner_id, customers]);

    // Handle customer selection
    const handleCustomerChange = useCallback((customerId) => {
        const customer = customers.find(c => c.id === customerId);
        if (customer) {
            const stateCode = customer.state_code || '';
            const fiscalPosition = determineFiscalPosition(COMPANY_STATE_CODE, stateCode);

            setDocument(prev => ({
                ...prev,
                partner_id: customer.id,
                partner_name: customer.name,
                partner_gstin: customer.gstin,
                partner_state_code: stateCode,
                invoice_address: customer.address,
                place_of_supply: stateCode,
                fiscal_position: fiscalPosition,
            }));

            // Automatically switch to 'customer_linked' filter if useful?
            // For now, keep as is or user can toggle.
            setProductFilterMode('customer_linked');

            // Recompute line items with new fiscal position
            if (lines.length > 0) {
                setLines(prevLines => prevLines.map(line => ({
                    ...line,
                    ...computeLineAmounts(line, fiscalPosition)
                })));
            }
        } else {
            setDocument(prev => ({
                ...prev,
                partner_id: '',
                partner_name: '',
                partner_gstin: '',
                partner_state_code: '',
                invoice_address: '',
                place_of_supply: '',
            }));
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

        if (lines.length > 0) {
            setLines(prevLines => prevLines.map(line => ({
                ...line,
                ...computeLineAmounts(line, fiscalPosition)
            })));
        }
    }, [lines]);

    // Add new line
    const addLine = () => {
        setLines([...lines, {
            id: `temp_${Date.now()}`,
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

    // Remove line
    const removeLine = (index) => {
        setLines(lines.filter((_, i) => i !== index));
    };

    // Update line
    const updateLine = (index, field, value) => {
        setLines(prevLines => {
            const newLines = [...prevLines];
            const line = { ...newLines[index], [field]: value };

            // If product changed, update product-related fields
            if (field === 'product_id' && value) {
                const product = products.find(p => p.id === value);
                if (product) {
                    line.name = product.name;
                    line.hsn_code = product.hsn_code;
                    line.gst_rate = product.default_gst_rate;
                    line.price_unit = product.selling_price;
                }
            }

            // Recompute amounts
            if (['product_uom_qty', 'price_unit', 'discount', 'gst_rate', 'product_id'].includes(field)) {
                const computed = computeLineAmounts(line, document.fiscal_position);
                Object.assign(line, computed);
            }

            newLines[index] = line;
            return newLines;
        });
    };

    // Handle product selection for a line
    const handleProductSelect = (index, productId) => {
        updateLine(index, 'product_id', productId);
    };

    // Save document
    const handleSave = async (newState = 'draft') => {
        setError('');
        setSuccess('');
        setSaving(true);

        try {
            if (!document.partner_id) {
                throw new Error('Please select a customer first');
            }
            if (lines.length === 0) {
                throw new Error('Please add at least one product line');
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

            setSuccess(`Document saved successfully! Redirecting...`);
            setTimeout(() => {
                router.push(`/documents/${data.id || data.document?.id}`);
            }, 1500);

        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-white border-b shadow-sm backdrop-blur-sm bg-white/90">
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/documents')}
                            className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 tracking-tight">New Quotation</h1>
                            <p className="text-sm text-gray-500">Create professional quotation with logic-based selection</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => handleSave('draft')}
                            disabled={saving}
                            className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 
                                disabled:opacity-50 flex items-center gap-2 text-sm font-medium transition-colors shadow-sm bg-white"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 text-gray-500" />}
                            Save Draft
                        </button>
                        <button
                            onClick={() => handleSave('sale')}
                            disabled={saving}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 
                                disabled:opacity-50 flex items-center gap-2 text-sm font-medium shadow-md shadow-indigo-100 transition-all active:scale-95"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            Confirm Order
                        </button>
                    </div>
                </div>
            </div>

            {/* Messages */}
            {error && (
                <div className="max-w-7xl mx-auto px-4 mt-6">
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-700 shadow-sm animate-in slide-in-from-top-2">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium">{error}</span>
                    </div>
                </div>
            )}
            {success && (
                <div className="max-w-7xl mx-auto px-4 mt-6">
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 text-green-700 shadow-sm animate-in slide-in-from-top-2">
                        <Check className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium">{success}</span>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
                {/* Customer & Order Details */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Customer Card */}
                    <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-6 space-y-6 hover:shadow-md transition-shadow duration-300">
                        <div className="flex items-center justify-between">
                            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-indigo-500" />
                                Customer Details
                            </h2>
                            <span className="text-xs px-2 py-1 bg-indigo-50 text-indigo-700 rounded-full font-medium">Step 1</span>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Customer <span className="text-red-500">*</span>
                                </label>
                                <OdooCustomerSelect
                                    customers={customers}
                                    value={document.partner_id}
                                    onChange={handleCustomerChange}
                                    placeholder="Type to find a customer..."
                                    loading={customers.length === 0}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">GSTIN</label>
                                    <input
                                        type="text"
                                        value={document.partner_gstin}
                                        onChange={(e) => setDocument(prev => ({ ...prev, partner_gstin: e.target.value.toUpperCase() }))}
                                        placeholder="22AAAAA0000A1Z5"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm transition-all
                                            focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Place of Supply</label>
                                    <SearchableDropdown
                                        options={INDIAN_STATES}
                                        value={document.place_of_supply}
                                        onChange={handlePlaceOfSupplyChange}
                                        placeholder="Select state..."
                                        displayKey="name"
                                        valueKey="code"
                                        searchKeys={["name", "code"]}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Billing Address</label>
                                <textarea
                                    value={document.invoice_address}
                                    onChange={(e) => setDocument(prev => ({ ...prev, invoice_address: e.target.value }))}
                                    rows={3}
                                    placeholder="Customer billing address..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none transition-all
                                        focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Order Details Card */}
                    <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-6 space-y-6 hover:shadow-md transition-shadow duration-300">
                        <div className="flex items-center justify-between">
                            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-indigo-500" />
                                Order Details
                            </h2>
                            <span className="text-xs px-2 py-1 bg-indigo-50 text-indigo-700 rounded-full font-medium">Step 2</span>
                        </div>

                        <div className="space-y-5">
                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Order Date</label>
                                    <input
                                        type="date"
                                        value={document.date_order}
                                        onChange={(e) => setDocument(prev => ({ ...prev, date_order: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm transition-all
                                            focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Validity Date</label>
                                    <input
                                        type="date"
                                        value={document.validity_date}
                                        onChange={(e) => setDocument(prev => ({ ...prev, validity_date: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm transition-all
                                            focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Terms</label>
                                    <div className="relative">
                                        <select
                                            value={document.payment_term_note}
                                            onChange={(e) => setDocument(prev => ({ ...prev, payment_term_note: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white transition-all
                                                focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                        >
                                            {PAYMENT_TERMS.map(t => (
                                                <option key={t.value} value={t.value}>{t.label}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Customer PO No.</label>
                                    <input
                                        type="text"
                                        value={document.client_order_ref}
                                        onChange={(e) => setDocument(prev => ({ ...prev, client_order_ref: e.target.value }))}
                                        placeholder="PO Number..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm transition-all
                                            focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                    />
                                </div>
                            </div>

                            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl flex items-center justify-between text-sm">
                                <span className="text-blue-700 font-medium">Tax Position:</span>
                                <span className={`px-2 py-1 rounded bg-white font-semibold border ${document.fiscal_position === 'interstate' ? 'text-amber-600 border-amber-200' : 'text-emerald-600 border-emerald-200'}`}>
                                    {document.fiscal_position === 'interstate' ? 'Inter-State (IGST)' : 'Intra-State (CGST + SGST)'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Line Items */}
                <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden flex flex-col">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
                        <div className="flex items-center gap-4">
                            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                                <Package className="w-5 h-5 text-indigo-500" />
                                Order Lines
                            </h2>

                            {/* Product Filter Toggle */}
                            {document.partner_id && (
                                <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border shadow-sm">
                                    <span className="text-xs text-gray-500 font-medium">Filter:</span>
                                    <button
                                        onClick={() => setProductFilterMode(m => m === 'all' ? 'customer_linked' : 'all')}
                                        className={`text-xs px-2 py-0.5 rounded-full transition-colors flex items-center gap-1
                                            ${productFilterMode === 'customer_linked' ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
                                    >
                                        <Filter className="w-3 h-3" />
                                        Linked Only
                                    </button>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={addLine}
                            className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg 
                                hover:bg-gray-800 flex items-center gap-2 shadow-lg shadow-gray-200 hover:shadow-xl transition-all active:scale-95"
                        >
                            <Plus className="w-4 h-4" />
                            Add Line
                        </button>
                    </div>

                    <div className="overflow-x-auto min-h-[300px]">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="px-4 py-3 text-left font-semibold text-gray-600 w-10">#</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-600 min-w-[280px]">Product details</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-600 w-24">HSN</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-600 w-24">Qty</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-600 w-24">Unit Price</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-600 w-20">Disc %</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-600 w-20">GST</th>
                                    <th className="px-4 py-3 text-right font-semibold text-gray-600 w-32">Subtotal</th>
                                    <th className="px-4 py-3 text-right font-semibold text-gray-600 w-32">Total</th>
                                    <th className="px-4 py-3 w-12"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {lines.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="px-4 py-16 text-center text-gray-500 bg-gray-50/20">
                                            <div className="flex flex-col items-center gap-2">
                                                <Package className="w-8 h-8 text-gray-300" />
                                                <p>No products added yet.</p>
                                                <button onClick={addLine} className="text-indigo-600 hover:underline">Add your first product</button>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    lines.map((line, idx) => (
                                        <tr key={line.id} className="hover:bg-gray-50/80 transition-colors group">
                                            <td className="px-4 py-3 text-gray-500 font-medium">{idx + 1}</td>
                                            <td className="px-4 py-3">
                                                <SearchableDropdown
                                                    options={products}
                                                    value={line.product_id}
                                                    onChange={(v) => handleProductSelect(idx, v)}
                                                    placeholder="Search product..."
                                                    displayKey="name"
                                                    valueKey="id"
                                                    searchKeys={["name", "hsn_code", "item_code"]}
                                                    filterFn={getProductFilter()}
                                                    className="w-full"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="text"
                                                    value={line.hsn_code}
                                                    onChange={(e) => updateLine(idx, 'hsn_code', e.target.value)}
                                                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm text-center"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1 border border-gray-300 rounded overflow-hidden">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={line.product_uom_qty}
                                                        onChange={(e) => updateLine(idx, 'product_uom_qty', parseFloat(e.target.value) || 1)}
                                                        className="w-full px-2 py-1.5 text-sm text-center focus:outline-none"
                                                    />
                                                    <span className="bg-gray-100 text-xs px-1 py-2 text-gray-500 border-l">
                                                        {line.product_uom?.substring(0, 3)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={line.price_unit}
                                                    onChange={(e) => updateLine(idx, 'price_unit', parseFloat(e.target.value) || 0)}
                                                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm text-right font-medium"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    value={line.discount}
                                                    onChange={(e) => updateLine(idx, 'discount', parseFloat(e.target.value) || 0)}
                                                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm text-center"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <select
                                                    value={line.gst_rate}
                                                    onChange={(e) => updateLine(idx, 'gst_rate', parseFloat(e.target.value))}
                                                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                                                >
                                                    {GST_RATES.map(r => (
                                                        <option key={r.value} value={r.value}>{r.value}%</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-4 py-3 text-right text-gray-600 font-medium">
                                                {formatCurrency(line.price_subtotal)}
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-gray-900">
                                                {formatCurrency(line.price_total)}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => removeLine(idx)}
                                                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Summary Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Terms */}
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
                        <h2 className="text-base font-semibold text-gray-900 mb-4">Terms & Conditions</h2>
                        <textarea
                            value={document.note}
                            onChange={(e) => setDocument(prev => ({ ...prev, note: e.target.value }))}
                            rows={5}
                            placeholder="Enter terms and conditions, payment details, or delivery instructions..."
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm resize-none transition-all
                                focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-gray-50/50"
                        />
                    </div>

                    {/* Totals */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 flex flex-col justify-between h-full bg-gradient-to-br from-white to-gray-50">
                        <div>
                            <h2 className="text-base font-semibold text-gray-900 mb-6 flex items-center gap-2">
                                <Calculator className="w-5 h-5 text-indigo-500" />
                                Order Summary
                            </h2>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600">Subtotal (Untaxed)</span>
                                    <span className="font-medium text-gray-900">{formatCurrency(totals.amount_untaxed)}</span>
                                </div>
                                <div className="border-t border-dashed border-gray-200 my-2"></div>

                                {document.fiscal_position === 'interstate' ? (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600 flex items-center gap-1">
                                            IGST <span className="text-xs bg-gray-100 px-1 rounded text-gray-500">Tax</span>
                                        </span>
                                        <span className="font-medium text-gray-900">{formatCurrency(totals.igst_total)}</span>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-600 flex items-center gap-1">
                                                CGST <span className="text-xs bg-gray-100 px-1 rounded text-gray-500">Tax</span>
                                            </span>
                                            <span className="font-medium text-gray-900">{formatCurrency(totals.cgst_total)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-600 flex items-center gap-1">
                                                SGST <span className="text-xs bg-gray-100 px-1 rounded text-gray-500">Tax</span>
                                            </span>
                                            <span className="font-medium text-gray-900">{formatCurrency(totals.sgst_total)}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-200">
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-lg font-bold text-gray-900">Total Amount</span>
                                <span className="text-3xl font-bold text-indigo-600 tracking-tight">
                                    {formatCurrency(totals.amount_total)}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 text-right font-medium italic">
                                {amountToWords(totals.amount_total)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
