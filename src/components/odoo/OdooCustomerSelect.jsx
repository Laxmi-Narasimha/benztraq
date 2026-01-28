'use client';

import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, ChevronDown, Plus, Building2, User, Check, Loader2, MapPin, Phone, Mail } from 'lucide-react';

/**
 * Premium Odoo-Style Customer Select Dropdown
 * Features:
 * - Warm, inviting color palette
 * - Fluid animations and glassmorphism effects
 * - Enhanced customer cards with details
 * - Smooth keyboard navigation
 */

// Premium Customer Card
const CustomerCard = memo(function CustomerCard({ customer, isSelected, isHighlighted, onClick, index }) {
    return (
        <button
            type="button"
            data-index={index}
            onClick={(e) => { e.stopPropagation(); onClick(customer); }}
            className={`w-full px-4 py-3 text-left flex items-start gap-3 transition-all duration-200
                ${isHighlighted
                    ? 'bg-gradient-to-r from-teal-50 to-cyan-50 border-l-2 border-l-teal-500'
                    : 'hover:bg-stone-50 border-l-2 border-l-transparent'}
                ${isSelected ? 'bg-teal-50/50' : ''}`}
        >
            {/* Avatar */}
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm
                ${isHighlighted || isSelected
                    ? 'bg-gradient-to-br from-teal-500 to-cyan-600 text-white'
                    : 'bg-gradient-to-br from-stone-100 to-stone-200 text-stone-500'}`}>
                <Building2 className="w-5 h-5" />
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className={`font-semibold truncate ${isHighlighted || isSelected ? 'text-teal-900' : 'text-stone-800'}`}>
                        {customer.name}
                    </span>
                    {isSelected && (
                        <span className="flex-shrink-0 w-5 h-5 bg-teal-500 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-stone-500">
                    {customer.city && (
                        <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {customer.city}
                        </span>
                    )}
                    {customer.phone && (
                        <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {customer.phone}
                        </span>
                    )}
                </div>
            </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col animate-in zoom-in-95 fade-in duration-200 border border-stone-200/50">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-stone-50 to-stone-100/50 rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/20">
                            <Building2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-stone-800">Search Customers</h2>
                            <p className="text-xs text-stone-500">{totalCount} customers available</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-stone-200 rounded-xl transition-colors">
                        <X className="w-5 h-5 text-stone-500" />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="px-6 py-4 border-b bg-white flex items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            placeholder="Search by name, city, or email..."
                            className="w-full pl-12 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm 
                                focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-stone-500">
                        <span className="font-medium">{startIdx + 1}-{endIdx}</span>
                        <span className="text-stone-400">of</span>
                        <span className="font-medium">{totalCount}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="p-2 hover:bg-stone-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            ‹
                        </button>
                        <button
                            onClick={() => setPage(p => p + 1)}
                            disabled={endIdx >= totalCount}
                            className="p-2 hover:bg-stone-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            ›
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-stone-50 sticky top-0">
                            <tr>
                                <th className="px-6 py-3 text-left font-semibold text-stone-600 uppercase text-xs tracking-wider">Customer</th>
                                <th className="px-6 py-3 text-left font-semibold text-stone-600 uppercase text-xs tracking-wider">Contact</th>
                                <th className="px-6 py-3 text-left font-semibold text-stone-600 uppercase text-xs tracking-wider">Location</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                            {pageCustomers.map(customer => (
                                <tr
                                    key={customer.id}
                                    onClick={() => { onSelect(customer); onClose(); }}
                                    className={`cursor-pointer transition-colors group
                                        ${selectedId === customer.id ? 'bg-teal-50' : 'hover:bg-stone-50'}`}
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center
                                                ${selectedId === customer.id
                                                    ? 'bg-gradient-to-br from-teal-500 to-cyan-600 text-white'
                                                    : 'bg-stone-100 text-stone-500 group-hover:bg-stone-200'}`}>
                                                <Building2 className="w-4 h-4" />
                                            </div>
                                            <span className="font-medium text-stone-800">{customer.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-stone-600">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Phone className="w-3.5 h-3.5 text-stone-400" />
                                                {customer.phone || customer.mobile || '-'}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-stone-500">
                                                <Mail className="w-3 h-3 text-stone-400" />
                                                {customer.email || '-'}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-stone-600">
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-3.5 h-3.5 text-stone-400" />
                                            {customer.city || '-'}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t bg-stone-50/50 rounded-b-2xl flex items-center gap-3">
                    <button
                        onClick={onCreateNew}
                        className="px-4 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-600 text-white text-sm font-medium rounded-xl 
                            hover:from-teal-600 hover:to-cyan-700 transition-all shadow-lg shadow-teal-500/20 flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        New Customer
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2.5 bg-white text-stone-700 text-sm font-medium rounded-xl border border-stone-200
                            hover:bg-stone-50 transition-colors"
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
    placeholder = "Search or select a customer...",
    loading = false,
    className = ""
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const containerRef = useRef(null);
    const inputRef = useRef(null);
    const listRef = useRef(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    // Smart positioning logic
    const updatePosition = useCallback(() => {
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const dropdownHeight = 380;

        const spaceBelow = viewportHeight - rect.bottom;
        const spaceAbove = rect.top;

        let top;
        if (spaceBelow >= dropdownHeight || spaceBelow >= spaceAbove) {
            top = rect.bottom + window.scrollY + 4;
        } else {
            top = rect.top + window.scrollY - dropdownHeight - 4;
        }

        setPosition({
            top,
            left: rect.left + window.scrollX,
            width: Math.max(rect.width, 360)
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

    // Close on outside click
    useEffect(() => {
        if (!isOpen) return;
        const handleClick = (e) => {
            if (containerRef.current?.contains(e.target)) return;
            if (e.target.closest('.odoo-dropdown-portal')) return;
            setIsOpen(false);
            setHighlightedIndex(0);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [isOpen]);

    const selectedCustomer = customers.find(c => c.id === value);

    // Filter customers
    const filteredCustomers = customers.filter(c => {
        if (!search) return true;
        const s = search.toLowerCase();
        return c.name?.toLowerCase().includes(s) || c.city?.toLowerCase().includes(s);
    }).slice(0, 7);

    // Handle Selection
    const handleSelect = useCallback((customer) => {
        onChange(customer.id);
        setSearch('');
        setIsOpen(false);
        setHighlightedIndex(0);
    }, [onChange]);

    // Keyboard Navigation
    const handleKeyDown = useCallback((e) => {
        if (!isOpen && e.key === 'ArrowDown') {
            setIsOpen(true);
            return;
        }
        if (!isOpen) return;

        const maxIndex = filteredCustomers.length - 1;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex(prev => Math.min(prev + 1, maxIndex));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(prev => Math.max(prev - 1, 0));
                break;
            case 'Enter':
                e.preventDefault();
                if (filteredCustomers[highlightedIndex]) {
                    handleSelect(filteredCustomers[highlightedIndex]);
                }
                break;
            case 'Escape':
                e.preventDefault();
                setIsOpen(false);
                setHighlightedIndex(0);
                inputRef.current?.blur();
                break;
        }
    }, [isOpen, filteredCustomers, highlightedIndex, handleSelect]);

    const handleClear = useCallback((e) => {
        e.stopPropagation();
        onChange('');
        setSearch('');
    }, [onChange]);

    const handleInputChange = useCallback((e) => {
        setSearch(e.target.value);
        if (!isOpen) setIsOpen(true);
        setHighlightedIndex(0);
    }, [isOpen]);

    const handleInputFocus = useCallback(() => {
        setIsOpen(true);
    }, []);

    return (
        <>
            <div ref={containerRef} className={`relative ${className}`}>
                <div
                    className={`flex items-center rounded-xl bg-white transition-all duration-200 cursor-text
                        border-2 hover:shadow-md
                        ${isOpen
                            ? 'border-teal-500 ring-4 ring-teal-500/10 shadow-lg'
                            : 'border-stone-200 hover:border-stone-300'}`}
                    onClick={() => inputRef.current?.focus()}
                >
                    {/* Icon */}
                    <div className={`pl-4 transition-colors ${isOpen ? 'text-teal-500' : 'text-stone-400'}`}>
                        <Building2 className="w-5 h-5" />
                    </div>

                    {selectedCustomer && !isOpen ? (
                        <div className="flex-1 px-3 py-3 flex items-center gap-2">
                            <span className="font-medium text-stone-800 truncate">{selectedCustomer.name}</span>
                            {selectedCustomer.city && (
                                <span className="text-sm text-stone-500 flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {selectedCustomer.city}
                                </span>
                            )}
                        </div>
                    ) : (
                        <input
                            ref={inputRef}
                            type="text"
                            value={search}
                            onChange={handleInputChange}
                            onFocus={handleInputFocus}
                            onKeyDown={handleKeyDown}
                            placeholder={placeholder}
                            className="flex-1 px-3 py-3 text-sm bg-transparent border-none outline-none placeholder:text-stone-400"
                        />
                    )}

                    <div className="flex items-center gap-1 pr-3">
                        {loading && <Loader2 className="w-4 h-4 text-stone-400 animate-spin" />}
                        {value && (
                            <button type="button" onClick={handleClear} className="p-1.5 hover:bg-stone-100 rounded-lg transition-colors">
                                <X className="w-4 h-4 text-stone-400" />
                            </button>
                        )}
                        <ChevronDown className={`w-5 h-5 text-stone-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                    </div>
                </div>

                {/* Dropdown Portal */}
                {mounted && isOpen && createPortal(
                    <div
                        className="odoo-dropdown-portal fixed z-50 bg-white rounded-2xl border border-stone-200/60 shadow-2xl overflow-hidden
                            animate-in fade-in slide-in-from-top-2 duration-200"
                        style={{ top: position.top, left: position.left, width: position.width }}
                    >
                        {/* Create Options */}
                        {search.trim() && (
                            <div className="p-2 border-b border-stone-100 bg-gradient-to-r from-stone-50 to-stone-100/50">
                                <button
                                    type="button"
                                    onClick={() => {
                                        onCreateNew?.(search.trim(), false);
                                        setSearch('');
                                        setIsOpen(false);
                                    }}
                                    className="w-full px-4 py-2.5 text-sm text-left text-teal-600 hover:bg-teal-50 font-medium 
                                        transition-colors flex items-center gap-2 rounded-lg"
                                >
                                    <Plus className="w-4 h-4" />
                                    Create "{search.trim()}"
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        onCreateNew?.(search.trim(), true);
                                        setSearch('');
                                        setIsOpen(false);
                                    }}
                                    className="w-full px-4 py-2.5 text-sm text-left text-amber-600 hover:bg-amber-50 font-medium 
                                        transition-colors flex items-center gap-2 rounded-lg"
                                >
                                    <Plus className="w-4 h-4" />
                                    Create and edit...
                                </button>
                            </div>
                        )}

                        {filteredCustomers.length === 0 && !search ? (
                            <div className="px-4 py-8 text-sm text-stone-500 text-center">
                                <Search className="w-8 h-8 mx-auto text-stone-300 mb-2" />
                                <p>Start typing to search...</p>
                            </div>
                        ) : filteredCustomers.length === 0 && search ? (
                            <div className="px-4 py-6 text-sm text-stone-500 text-center">
                                <p>No customers match your search</p>
                            </div>
                        ) : (
                            <div ref={listRef} className="max-h-[300px] overflow-y-auto divide-y divide-stone-100">
                                {filteredCustomers.map((customer, idx) => (
                                    <CustomerCard
                                        key={customer.id}
                                        index={idx}
                                        customer={customer}
                                        isSelected={value === customer.id}
                                        isHighlighted={idx === highlightedIndex}
                                        onClick={handleSelect}
                                    />
                                ))}
                            </div>
                        )}

                        <div className="p-2 border-t border-stone-100 bg-stone-50/50">
                            <button
                                type="button"
                                onClick={() => { setShowModal(true); setIsOpen(false); }}
                                className="w-full px-4 py-2.5 text-sm text-left text-stone-600 hover:bg-white 
                                    font-medium transition-colors rounded-lg flex items-center gap-2"
                            >
                                <Search className="w-4 h-4" />
                                Search all customers...
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
