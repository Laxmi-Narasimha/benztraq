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
    Sparkles
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
import OdooPartnerForm from './OdooPartnerForm';

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
 * Modern Searchable Dropdown - Notion/HubSpot Style
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
    filterFn = null
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const triggerRef = useRef(null);
    const inputRef = useRef(null);
    const listRef = useRef(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    const updatePosition = useCallback(() => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const dropdownHeight = 280;
        const spaceBelow = viewportHeight - rect.bottom;

        setPosition({
            top: spaceBelow >= dropdownHeight ? rect.bottom + window.scrollY + 4 : rect.top + window.scrollY - dropdownHeight - 4,
            left: rect.left + window.scrollX,
            width: Math.max(rect.width, 280)
        });
    }, []);

    useEffect(() => {
        if (isOpen) {
            updatePosition();
            window.addEventListener('scroll', updatePosition, true);
            window.addEventListener('resize', updatePosition);
            return () => {
                window.removeEventListener('scroll', updatePosition, true);
                window.removeEventListener('resize', updatePosition);
            };
        }
    }, [isOpen, updatePosition]);

    useEffect(() => {
        if (!isOpen) return;
        const handleClick = (e) => {
            if (triggerRef.current?.contains(e.target)) return;
            if (e.target.closest('.dropdown-portal-content')) return;
            setIsOpen(false);
            setSearch('');
            setHighlightedIndex(0);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [isOpen]);

    let filteredOptions = options;
    if (filterFn) filteredOptions = filteredOptions.filter(filterFn);
    filteredOptions = filteredOptions.filter(opt => {
        if (!search) return true;
        const searchLower = search.toLowerCase();
        return searchKeys.some(key => {
            const val = opt[key];
            return val && String(val).toLowerCase().includes(searchLower);
        });
    });

    const displayOptions = filteredOptions.slice(0, 100);

    const handleSelect = useCallback((option) => {
        onChange(option[valueKey]);
        setIsOpen(false);
        setSearch('');
        setHighlightedIndex(0);
    }, [onChange, valueKey]);

    const handleClear = useCallback((e) => {
        e.stopPropagation();
        onChange('');
        setSearch('');
    }, [onChange]);

    const handleKeyDown = useCallback((e) => {
        if (!isOpen) return;
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex(prev => Math.min(prev + 1, displayOptions.length - 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(prev => Math.max(prev - 1, 0));
                break;
            case 'Enter':
                e.preventDefault();
                if (displayOptions[highlightedIndex]) handleSelect(displayOptions[highlightedIndex]);
                break;
            case 'Escape':
                e.preventDefault();
                setIsOpen(false);
                setSearch('');
                setHighlightedIndex(0);
                break;
        }
    }, [isOpen, displayOptions, highlightedIndex, handleSelect]);

    useEffect(() => {
        if (listRef.current && isOpen) {
            const highlighted = listRef.current.querySelector(`[data-index="${highlightedIndex}"]`);
            if (highlighted) highlighted.scrollIntoView({ block: 'nearest' });
        }
    }, [highlightedIndex, isOpen]);

    useEffect(() => { setHighlightedIndex(0); }, [search]);

    const selectedOption = options.find(opt => opt[valueKey] === value);

    return (
        <div className={`relative ${className}`}>
            <button
                ref={triggerRef}
                type="button"
                disabled={disabled}
                onClick={() => {
                    if (!disabled) {
                        setIsOpen(!isOpen);
                        setTimeout(() => document.getElementById(`dropdown-input-${valueKey}`)?.focus(), 50);
                    }
                }}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-left 
                    bg-white rounded-xl transition-all duration-200
                    ${disabled ? 'bg-stone-50 cursor-not-allowed text-stone-400' : 'hover:bg-stone-50 cursor-pointer'}
                    ${isOpen ? 'ring-2 ring-teal-500/20 border-teal-500 shadow-lg' : 'border border-stone-200 hover:border-stone-300'}`}
            >
                <div className="flex-1 truncate mr-2">
                    {selectedOption ? (
                        <span className="text-stone-800 font-medium">{selectedOption[displayKey]}</span>
                    ) : (
                        <span className="text-stone-400">{placeholder}</span>
                    )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                    {value && !disabled && (
                        <span onClick={handleClear} className="p-1 hover:bg-stone-100 rounded-lg transition-colors">
                            <X className="w-3.5 h-3.5 text-stone-400 hover:text-stone-600" />
                        </span>
                    )}
                    <ChevronDown className={`w-4 h-4 text-stone-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </button>

            {mounted && isOpen && createPortal(
                <div
                    className="dropdown-portal-content fixed z-50 bg-white rounded-xl border border-stone-200/60 shadow-2xl overflow-hidden
                        animate-in fade-in slide-in-from-top-2 duration-150"
                    style={{ top: position.top, left: position.left, width: position.width }}
                >
                    <div className="p-2 border-b border-stone-100">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                            <input
                                id={`dropdown-input-${valueKey}`}
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Type to search..."
                                className="w-full pl-9 pr-3 py-2 text-sm bg-stone-50 rounded-lg border-0 
                                    focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 transition-all"
                            />
                        </div>
                    </div>

                    <div ref={listRef} className="overflow-y-auto max-h-[240px] p-1">
                        {displayOptions.length === 0 ? (
                            <div className="px-4 py-6 text-sm text-stone-500 text-center">
                                <Search className="w-6 h-6 text-stone-300 mx-auto mb-2" />
                                No results found
                            </div>
                        ) : (
                            displayOptions.map((option, idx) => (
                                <button
                                    key={option[valueKey] || idx}
                                    data-index={idx}
                                    type="button"
                                    onClick={() => handleSelect(option)}
                                    onMouseEnter={() => setHighlightedIndex(idx)}
                                    className={`w-full px-3 py-2.5 text-left text-sm rounded-lg transition-colors
                                        flex items-center justify-between
                                        ${idx === highlightedIndex ? 'bg-teal-50 text-teal-700' : 'text-stone-700 hover:bg-stone-50'}
                                        ${value === option[valueKey] ? 'font-medium' : ''}`}
                                >
                                    <span className="truncate">{option[displayKey]}</span>
                                    {value === option[valueKey] && <Check className="w-4 h-4 text-teal-600 flex-shrink-0" />}
                                </button>
                            ))
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
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [pendingCustomerName, setPendingCustomerName] = useState('');

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

    const [lines, setLines] = useState([]);
    const [totals, setTotals] = useState({
        amount_untaxed: 0, amount_tax: 0, amount_total: 0,
        cgst_total: 0, sgst_total: 0, igst_total: 0,
    });

    useEffect(() => { loadCustomers(); loadProducts(); }, []);
    useEffect(() => { setTotals(computeDocumentTotals(lines)); }, [lines]);

    const loadCustomers = async () => {
        try {
            const res = await fetch('/api/customers?limit=1000');
            const data = await res.json();
            if (data.customers && Array.isArray(data.customers)) {
                setCustomers(data.customers.map(c => ({
                    ...c,
                    name: c.name || c.customer_name || 'Unknown',
                    gstin: c.gstin || '',
                    state_code: c.state_code || '',
                    address: c.billing_address || c.address || '',
                })));
            }
        } catch (err) {
            console.error('Failed to load customers:', err);
            setError('Failed to load customers');
        }
    };

    const loadProducts = async () => {
        try {
            const res = await fetch('/api/products?limit=2000');
            const data = await res.json();
            const productList = data.products || data || [];
            setProducts(productList.map(p => ({
                ...p,
                name: p.item_name || p.name || 'Unknown',
                hsn_code: p.hsn_code || '39232100',
                selling_price: p.selling_price || 0,
                default_gst_rate: p.default_gst_rate || 18,
            })));
        } catch (err) {
            console.error('Failed to load products:', err);
        }
    };

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
            if (lines.length > 0) {
                setLines(prevLines => prevLines.map(line => ({
                    ...line,
                    ...computeLineAmounts(line, fiscalPosition)
                })));
            }
        } else {
            setDocument(prev => ({
                ...prev,
                partner_id: '', partner_name: '', partner_gstin: '',
                partner_state_code: '', invoice_address: '', place_of_supply: '',
            }));
        }
    }, [customers, lines]);

    const handleQuickCreateCustomer = useCallback(async (name) => {
        try {
            const response = await fetch('/api/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, is_company: true, company_type: 'company' }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Failed to create customer');

            const newCustomer = result.customer;
            const normalizedCustomer = {
                ...newCustomer,
                name: newCustomer.name || newCustomer.customer_name || name,
                gstin: newCustomer.gstin || '',
                state_code: newCustomer.state_code || '',
                address: newCustomer.billing_address || newCustomer.address || '',
            };
            setCustomers(prev => [...prev, normalizedCustomer]);

            const stateCode = normalizedCustomer.state_code || '';
            const fiscalPosition = stateCode ? determineFiscalPosition(COMPANY_STATE_CODE, stateCode) : 'intrastate';
            setDocument(prev => ({
                ...prev,
                partner_id: normalizedCustomer.id,
                partner_name: normalizedCustomer.name,
                partner_gstin: normalizedCustomer.gstin,
                partner_state_code: stateCode,
                invoice_address: normalizedCustomer.address,
                place_of_supply: stateCode,
                fiscal_position: fiscalPosition,
            }));
            setSuccess(`Customer "${name}" created!`);
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.message || 'Failed to create customer');
        }
    }, []);

    const handleCustomerCreated = useCallback((newCustomer) => {
        const normalizedCustomer = {
            ...newCustomer,
            name: newCustomer.name || newCustomer.customer_name || 'New Customer',
            gstin: newCustomer.gstin || '',
            state_code: newCustomer.state_code || '',
            address: newCustomer.billing_address || newCustomer.address || '',
        };
        setCustomers(prev => [...prev, normalizedCustomer]);

        const stateCode = normalizedCustomer.state_code || '';
        const fiscalPosition = stateCode ? determineFiscalPosition(COMPANY_STATE_CODE, stateCode) : 'intrastate';
        setDocument(prev => ({
            ...prev,
            partner_id: normalizedCustomer.id,
            partner_name: normalizedCustomer.name,
            partner_gstin: normalizedCustomer.gstin,
            partner_state_code: stateCode,
            invoice_address: normalizedCustomer.address,
            place_of_supply: stateCode,
            fiscal_position: fiscalPosition,
        }));
        setShowCustomerModal(false);
        setPendingCustomerName('');
        setSuccess(`Customer "${normalizedCustomer.name}" created!`);
        setTimeout(() => setSuccess(''), 3000);
    }, []);

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

    const removeLine = (index) => { setLines(lines.filter((_, i) => i !== index)); };

    const updateLine = (index, field, value) => {
        setLines(prevLines => {
            const newLines = [...prevLines];
            const line = { ...newLines[index], [field]: value };
            if (field === 'product_id' && value) {
                const product = products.find(p => p.id === value);
                if (product) {
                    line.name = product.name;
                    line.hsn_code = product.hsn_code;
                    line.gst_rate = product.default_gst_rate;
                    line.price_unit = product.selling_price;
                }
            }
            if (['product_uom_qty', 'price_unit', 'discount', 'gst_rate', 'product_id'].includes(field)) {
                Object.assign(line, computeLineAmounts(line, document.fiscal_position));
            }
            newLines[index] = line;
            return newLines;
        });
    };

    const handleSave = async (newState = 'draft') => {
        setError('');
        setSuccess('');
        setSaving(true);

        try {
            if (!document.partner_id) throw new Error('Please select a customer');
            if (lines.length === 0) throw new Error('Please add at least one product');

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
            if (!res.ok) throw new Error(data.error || 'Failed to save document');

            setSuccess('Document saved! Redirecting...');
            setTimeout(() => { router.push(`/documents/${data.id || data.document?.id}`); }, 1500);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-stone-100/50">
                {/* Modern Header */}
                <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-stone-200/50">
                    <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.push('/documents')}
                                className="p-2 -ml-2 hover:bg-stone-100 rounded-xl transition-colors text-stone-500 hover:text-stone-700"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div>
                                <h1 className="text-xl font-semibold text-stone-800">New Quotation</h1>
                                <p className="text-sm text-stone-500">Create a professional quote</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => handleSave('draft')}
                                disabled={saving}
                                className="px-4 py-2.5 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 
                                    disabled:opacity-50 flex items-center gap-2 text-sm font-medium transition-all shadow-sm"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 text-stone-500" />}
                                Save Draft
                            </button>
                            <button
                                onClick={() => handleSave('sale')}
                                disabled={saving}
                                className="px-5 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl 
                                    hover:from-teal-600 hover:to-cyan-700 disabled:opacity-50 flex items-center gap-2 
                                    text-sm font-medium shadow-lg shadow-teal-500/25 transition-all active:scale-[0.98]"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                Confirm Order
                            </button>
                        </div>
                    </div>
                </header>

                {/* Messages */}
                <div className="max-w-6xl mx-auto px-6">
                    {error && (
                        <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-700 animate-in slide-in-from-top-2">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <span className="font-medium">{error}</span>
                            <button onClick={() => setError('')} className="ml-auto p-1 hover:bg-red-100 rounded-lg">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                    {success && (
                        <div className="mt-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3 text-emerald-700 animate-in slide-in-from-top-2">
                            <Check className="w-5 h-5 flex-shrink-0" />
                            <span className="font-medium">{success}</span>
                        </div>
                    )}
                </div>

                {/* Main Content */}
                <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
                    {/* Two Column Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Customer Section */}
                        <section className="bg-white rounded-2xl border border-stone-200/60 p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/20">
                                    <Building2 className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="font-semibold text-stone-800">Customer</h2>
                                    <p className="text-xs text-stone-500">Select or create a customer</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-stone-600 mb-2">
                                        Customer <span className="text-red-500">*</span>
                                    </label>
                                    <OdooCustomerSelect
                                        customers={customers}
                                        value={document.partner_id}
                                        onChange={handleCustomerChange}
                                        loading={customers.length === 0}
                                        onCreateNew={(name, openForm) => {
                                            if (openForm) {
                                                setPendingCustomerName(name);
                                                setShowCustomerModal(true);
                                            } else {
                                                handleQuickCreateCustomer(name);
                                            }
                                        }}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-stone-600 mb-2">GSTIN</label>
                                        <input
                                            type="text"
                                            value={document.partner_gstin}
                                            onChange={(e) => setDocument(prev => ({ ...prev, partner_gstin: e.target.value.toUpperCase() }))}
                                            placeholder="22AAAAA0000A1Z5"
                                            className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm transition-all
                                                focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 hover:border-stone-300"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-stone-600 mb-2">Place of Supply</label>
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
                                    <label className="block text-sm font-medium text-stone-600 mb-2">Billing Address</label>
                                    <textarea
                                        value={document.invoice_address}
                                        onChange={(e) => setDocument(prev => ({ ...prev, invoice_address: e.target.value }))}
                                        rows={2}
                                        placeholder="Customer billing address..."
                                        className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl text-sm resize-none transition-all
                                            focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 hover:border-stone-300"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Order Details Section */}
                        <section className="bg-white rounded-2xl border border-stone-200/60 p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                                    <FileText className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="font-semibold text-stone-800">Order Details</h2>
                                    <p className="text-xs text-stone-500">Dates and payment terms</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-stone-600 mb-2">Order Date</label>
                                        <input
                                            type="date"
                                            value={document.date_order}
                                            onChange={(e) => setDocument(prev => ({ ...prev, date_order: e.target.value }))}
                                            className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm transition-all
                                                focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 hover:border-stone-300"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-stone-600 mb-2">Valid Until</label>
                                        <input
                                            type="date"
                                            value={document.validity_date}
                                            onChange={(e) => setDocument(prev => ({ ...prev, validity_date: e.target.value }))}
                                            className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm transition-all
                                                focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 hover:border-stone-300"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-stone-600 mb-2">Payment Terms</label>
                                        <div className="relative">
                                            <select
                                                value={document.payment_term_note}
                                                onChange={(e) => setDocument(prev => ({ ...prev, payment_term_note: e.target.value }))}
                                                className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm appearance-none transition-all
                                                    focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 hover:border-stone-300"
                                            >
                                                {PAYMENT_TERMS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-stone-600 mb-2">Customer PO #</label>
                                        <input
                                            type="text"
                                            value={document.client_order_ref}
                                            onChange={(e) => setDocument(prev => ({ ...prev, client_order_ref: e.target.value }))}
                                            placeholder="Optional"
                                            className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm transition-all
                                                focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 hover:border-stone-300"
                                        />
                                    </div>
                                </div>

                                {/* Tax Position Badge */}
                                <div className={`p-4 rounded-xl flex items-center justify-between text-sm
                                    ${document.fiscal_position === 'interstate'
                                        ? 'bg-amber-50 border border-amber-200'
                                        : 'bg-emerald-50 border border-emerald-200'}`}
                                >
                                    <span className={document.fiscal_position === 'interstate' ? 'text-amber-700' : 'text-emerald-700'}>
                                        Tax Position
                                    </span>
                                    <span className={`px-3 py-1 rounded-lg font-medium ${document.fiscal_position === 'interstate'
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-emerald-100 text-emerald-800'}`}>
                                        {document.fiscal_position === 'interstate' ? 'Inter-State (IGST)' : 'Intra-State (CGST+SGST)'}
                                    </span>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Products Section */}
                    <section className="bg-white rounded-2xl border border-stone-200/60 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-gradient-to-r from-stone-50 to-white">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
                                    <Package className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="font-semibold text-stone-800">Products</h2>
                                    <p className="text-xs text-stone-500">{lines.length} item{lines.length !== 1 ? 's' : ''} added</p>
                                </div>
                            </div>
                            <button
                                onClick={addLine}
                                className="px-4 py-2.5 bg-stone-800 text-white text-sm font-medium rounded-xl 
                                    hover:bg-stone-700 flex items-center gap-2 shadow-lg transition-all active:scale-[0.98]"
                            >
                                <Plus className="w-4 h-4" />
                                Add Product
                            </button>
                        </div>

                        {/* Product Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-stone-50/50 border-b border-stone-100">
                                        <th className="px-4 py-3 text-left font-semibold text-stone-500 uppercase text-xs tracking-wider w-12">#</th>
                                        <th className="px-4 py-3 text-left font-semibold text-stone-500 uppercase text-xs tracking-wider min-w-[250px]">Product</th>
                                        <th className="px-4 py-3 text-left font-semibold text-stone-500 uppercase text-xs tracking-wider w-24">Qty</th>
                                        <th className="px-4 py-3 text-left font-semibold text-stone-500 uppercase text-xs tracking-wider w-28">Price</th>
                                        <th className="px-4 py-3 text-left font-semibold text-stone-500 uppercase text-xs tracking-wider w-20">GST</th>
                                        <th className="px-4 py-3 text-right font-semibold text-stone-500 uppercase text-xs tracking-wider w-32">Total</th>
                                        <th className="px-4 py-3 w-12"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100">
                                    {lines.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-16 text-center text-stone-500">
                                                <Package className="w-12 h-12 text-stone-200 mx-auto mb-3" />
                                                <p className="font-medium">No products added</p>
                                                <button onClick={addLine} className="mt-2 text-teal-600 hover:underline text-sm">Add your first product</button>
                                            </td>
                                        </tr>
                                    ) : (
                                        lines.map((line, idx) => (
                                            <tr key={line.id} className="hover:bg-stone-50/50 transition-colors group">
                                                <td className="px-4 py-4 text-stone-400 font-medium">{idx + 1}</td>
                                                <td className="px-4 py-4">
                                                    <SearchableDropdown
                                                        options={products}
                                                        value={line.product_id}
                                                        onChange={(v) => updateLine(idx, 'product_id', v)}
                                                        placeholder="Search product..."
                                                        displayKey="name"
                                                        valueKey="id"
                                                        searchKeys={["name", "hsn_code", "item_code"]}
                                                        className="w-full"
                                                    />
                                                </td>
                                                <td className="px-4 py-4">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={line.product_uom_qty}
                                                        onChange={(e) => updateLine(idx, 'product_uom_qty', parseFloat(e.target.value) || 1)}
                                                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm text-center
                                                            focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition-all"
                                                    />
                                                </td>
                                                <td className="px-4 py-4">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={line.price_unit}
                                                        onChange={(e) => updateLine(idx, 'price_unit', parseFloat(e.target.value) || 0)}
                                                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm text-right font-medium
                                                            focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition-all"
                                                    />
                                                </td>
                                                <td className="px-4 py-4">
                                                    <select
                                                        value={line.gst_rate}
                                                        onChange={(e) => updateLine(idx, 'gst_rate', parseFloat(e.target.value))}
                                                        className="w-full px-2 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm
                                                            focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition-all"
                                                    >
                                                        {GST_RATES.map(r => <option key={r.value} value={r.value}>{r.value}%</option>)}
                                                    </select>
                                                </td>
                                                <td className="px-4 py-4 text-right font-semibold text-stone-800">
                                                    {formatCurrency(line.price_total)}
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <button
                                                        onClick={() => removeLine(idx)}
                                                        className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg 
                                                            transition-all opacity-0 group-hover:opacity-100"
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
                    </section>

                    {/* Summary Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Notes */}
                        <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200/60 p-6 shadow-sm">
                            <h3 className="font-semibold text-stone-800 mb-4">Notes & Terms</h3>
                            <textarea
                                value={document.note}
                                onChange={(e) => setDocument(prev => ({ ...prev, note: e.target.value }))}
                                rows={4}
                                placeholder="Add any notes or terms..."
                                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm resize-none transition-all
                                    focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white hover:border-stone-300"
                            />
                        </div>

                        {/* Totals Card */}
                        <div className="bg-gradient-to-br from-stone-800 to-stone-900 rounded-2xl p-6 text-white shadow-xl">
                            <div className="flex items-center gap-2 mb-6">
                                <Calculator className="w-5 h-5 text-stone-400" />
                                <h3 className="font-semibold">Order Summary</h3>
                            </div>

                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between text-stone-400">
                                    <span>Subtotal</span>
                                    <span className="text-white font-medium">{formatCurrency(totals.amount_untaxed)}</span>
                                </div>
                                <div className="border-t border-stone-700 my-3"></div>

                                {document.fiscal_position === 'interstate' ? (
                                    <div className="flex justify-between text-stone-400">
                                        <span>IGST</span>
                                        <span className="text-white font-medium">{formatCurrency(totals.igst_total)}</span>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex justify-between text-stone-400">
                                            <span>CGST</span>
                                            <span className="text-white font-medium">{formatCurrency(totals.cgst_total)}</span>
                                        </div>
                                        <div className="flex justify-between text-stone-400">
                                            <span>SGST</span>
                                            <span className="text-white font-medium">{formatCurrency(totals.sgst_total)}</span>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="mt-6 pt-4 border-t border-stone-700">
                                <div className="flex justify-between items-end">
                                    <span className="text-stone-400">Total</span>
                                    <span className="text-3xl font-bold">{formatCurrency(totals.amount_total)}</span>
                                </div>
                                <p className="text-xs text-stone-500 mt-2 text-right">{amountToWords(totals.amount_total)}</p>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* Customer Modal */}
            <OdooPartnerForm
                isOpen={showCustomerModal}
                onClose={() => { setShowCustomerModal(false); setPendingCustomerName(''); }}
                onSave={handleCustomerCreated}
                initialName={pendingCustomerName}
            />
        </>
    );
}
