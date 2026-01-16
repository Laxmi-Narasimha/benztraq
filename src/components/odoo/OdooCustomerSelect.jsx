'use client';

import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, ChevronDown, Plus, Building2, User, Check, Loader2 } from 'lucide-react';

/**
 * Odoo-Style Customer Select Dropdown
 * Features:
 * - Type to search with instant results
 * - Shows top 7 matches in inline dropdown
 * - "Search More..." opens full modal
 * - "Start typing..." prompt when empty
 * - No focus loss issues
 */

// Memoized option item to prevent re-renders
const OptionItem = memo(function OptionItem({ customer, isSelected, onClick }) {
    return (
        <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onClick(customer); }}
            className={`w-full px-3 py-2 text-left text-sm hover:bg-indigo-50 flex items-center justify-between group transition-colors
                ${isSelected ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'}`}
        >
            <div className="flex items-center gap-2 min-w-0">
                <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="truncate font-medium">{customer.name}</span>
                {customer.city && (
                    <span className="text-xs text-gray-400 truncate">• {customer.city}</span>
                )}
            </div>
            {isSelected && <Check className="w-4 h-4 text-indigo-600 flex-shrink-0" />}
        </button>
    );
});

// Full Search Modal Component
function CustomerSearchModal({
    isOpen,
    onClose,
    customers,
    onSelect,
    selectedId,
    onCreateNew
}) {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const inputRef = useRef(null);

    const PAGE_SIZE = 80;

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const filteredCustomers = customers.filter(c => {
        if (!search) return true;
        const s = search.toLowerCase();
        return c.name?.toLowerCase().includes(s) ||
            c.city?.toLowerCase().includes(s) ||
            c.email?.toLowerCase().includes(s);
    });

    const totalCount = filteredCustomers.length;
    const startIdx = (page - 1) * PAGE_SIZE;
    const endIdx = Math.min(startIdx + PAGE_SIZE, totalCount);
    const pageCustomers = filteredCustomers.slice(startIdx, endIdx);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col animate-in zoom-in-95 fade-in duration-150">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50 rounded-t-xl">
                    <h2 className="font-semibold text-gray-900">Search: Customer</h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="px-4 py-3 border-b flex items-center gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            placeholder="Search..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm 
                                focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        />
                    </div>
                    <span className="text-sm text-gray-500 whitespace-nowrap">
                        {startIdx + 1}-{endIdx} / {totalCount}
                    </span>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="p-1.5 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            ‹
                        </button>
                        <button
                            onClick={() => setPage(p => p + 1)}
                            disabled={endIdx >= totalCount}
                            className="p-1.5 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            ›
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0">
                            <tr>
                                <th className="px-4 py-2 text-left font-medium text-gray-600">Name</th>
                                <th className="px-4 py-2 text-left font-medium text-gray-600">Phone</th>
                                <th className="px-4 py-2 text-left font-medium text-gray-600">Email</th>
                                <th className="px-4 py-2 text-left font-medium text-gray-600">City</th>
                                <th className="px-4 py-2 text-left font-medium text-gray-600">Country</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {pageCustomers.map(customer => (
                                <tr
                                    key={customer.id}
                                    onClick={() => { onSelect(customer); onClose(); }}
                                    className={`cursor-pointer transition-colors
                                        ${selectedId === customer.id ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}
                                >
                                    <td className="px-4 py-2.5 font-medium text-gray-900">{customer.name}</td>
                                    <td className="px-4 py-2.5 text-gray-600">{customer.phone || customer.mobile || '-'}</td>
                                    <td className="px-4 py-2.5 text-gray-600">{customer.email || '-'}</td>
                                    <td className="px-4 py-2.5 text-gray-600">{customer.city || '-'}</td>
                                    <td className="px-4 py-2.5 text-gray-600">India</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t bg-gray-50 rounded-b-xl flex items-center gap-2">
                    <button
                        onClick={onCreateNew}
                        className="px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded hover:bg-indigo-700 transition-colors"
                    >
                        New
                    </button>
                    <button
                        onClick={onClose}
                        className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm font-medium rounded hover:bg-gray-300 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

// Main Component
export default function OdooCustomerSelect({
    customers = [],
    value,
    onChange,
    onCreateNew,
    placeholder = "Type to find a customer...",
    loading = false,
    className = ""
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
    const containerRef = useRef(null);
    const inputRef = useRef(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    // Update position when dropdown opens
    useEffect(() => {
        if (isOpen && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setPosition({
                top: rect.bottom + window.scrollY + 2,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    }, [isOpen]);

    // Close on outside click
    useEffect(() => {
        if (!isOpen) return;
        const handleClick = (e) => {
            if (containerRef.current?.contains(e.target)) return;
            if (e.target.closest('.odoo-dropdown-portal')) return;
            setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [isOpen]);

    const selectedCustomer = customers.find(c => c.id === value);

    // Filter customers based on search
    const filteredCustomers = customers.filter(c => {
        if (!search) return true;
        const s = search.toLowerCase();
        return c.name?.toLowerCase().includes(s) || c.city?.toLowerCase().includes(s);
    }).slice(0, 7);

    const handleSelect = useCallback((customer) => {
        onChange(customer.id);
        setSearch('');
        setIsOpen(false);
    }, [onChange]);

    const handleClear = useCallback((e) => {
        e.stopPropagation();
        onChange('');
        setSearch('');
    }, [onChange]);

    const handleInputChange = useCallback((e) => {
        setSearch(e.target.value);
        if (!isOpen) setIsOpen(true);
    }, [isOpen]);

    const handleInputFocus = useCallback(() => {
        setIsOpen(true);
    }, []);

    return (
        <>
            <div ref={containerRef} className={`relative ${className}`}>
                <div
                    className={`flex items-center border rounded-lg bg-white transition-all cursor-text
                        ${isOpen ? 'ring-2 ring-indigo-500/20 border-indigo-500' : 'border-gray-300 hover:border-gray-400'}`}
                    onClick={() => inputRef.current?.focus()}
                >
                    {selectedCustomer && !isOpen ? (
                        <div className="flex-1 px-3 py-2 flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-gray-400" />
                            <span className="font-medium text-gray-900 truncate">{selectedCustomer.name}</span>
                        </div>
                    ) : (
                        <input
                            ref={inputRef}
                            type="text"
                            value={search}
                            onChange={handleInputChange}
                            onFocus={handleInputFocus}
                            placeholder={placeholder}
                            className="flex-1 px-3 py-2 text-sm bg-transparent border-none outline-none placeholder:text-gray-400"
                        />
                    )}
                    <div className="flex items-center gap-1 pr-2">
                        {loading && <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />}
                        {value && (
                            <button type="button" onClick={handleClear} className="p-1 hover:bg-gray-100 rounded-full">
                                <X className="w-3.5 h-3.5 text-gray-400" />
                            </button>
                        )}
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </div>
                </div>

                {/* Dropdown Portal */}
                {mounted && isOpen && createPortal(
                    <div
                        className="odoo-dropdown-portal fixed z-50 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden"
                        style={{ top: position.top, left: position.left, width: position.width }}
                    >
                        {filteredCustomers.length === 0 && !search ? (
                            <div className="px-3 py-4 text-sm text-gray-500 text-center">
                                Start typing...
                            </div>
                        ) : filteredCustomers.length === 0 ? (
                            <div className="px-3 py-4 text-sm text-gray-500 text-center">
                                No customers found
                            </div>
                        ) : (
                            <div className="max-h-[250px] overflow-y-auto">
                                {filteredCustomers.map(customer => (
                                    <OptionItem
                                        key={customer.id}
                                        customer={customer}
                                        isSelected={value === customer.id}
                                        onClick={handleSelect}
                                    />
                                ))}
                            </div>
                        )}

                        <div className="border-t border-gray-100">
                            <button
                                type="button"
                                onClick={() => { setShowModal(true); setIsOpen(false); }}
                                className="w-full px-3 py-2 text-sm text-left text-indigo-600 hover:bg-indigo-50 font-medium transition-colors"
                            >
                                Search More...
                            </button>
                        </div>
                    </div>,
                    document.body
                )}
            </div>

            {/* Full Search Modal */}
            <CustomerSearchModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                customers={customers}
                onSelect={handleSelect}
                selectedId={value}
                onCreateNew={() => {
                    setShowModal(false);
                    onCreateNew?.();
                }}
            />
        </>
    );
}
