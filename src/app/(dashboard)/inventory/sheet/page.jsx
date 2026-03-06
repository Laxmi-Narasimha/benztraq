'use client';

/**
 * Inventory — Google Sheets Style View
 * Replicates the FG STOCK sheet look & feel: company tabs at top,
 * compact spreadsheet cells, row numbers, alternating row colours.
 * SR NO | CUSTOMER NAME | MATERIAL TYPE | PART SIZE | CUSTOMER PART CODE |
 * UOM   | RECEIVED QTY  | DISPATCH QTY  | BALANCE   | STOCK IN KGS
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
    Search, RefreshCw, X, Check, Plus, LayoutGrid, Loader2,
    Download, FileSpreadsheet, Filter, Printer, ChevronLeft, ChevronRight
} from 'lucide-react';

// ============================================================
// Editable Qty Cell — Google Sheets formula style
// Shows: "current_value + [input]  = new_total"
// ============================================================
function EditableQtyCell({ value, type, onCommit, disabled, balance }) {
    const [editing, setEditing] = useState(false);
    const [qty, setQty] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const ref = useRef(null);
    const cellRef = useRef(null);

    useEffect(() => { if (editing && ref.current) ref.current.focus(); }, [editing]);

    const currentVal = parseFloat(value || 0);
    const addVal = parseFloat(qty) || 0;
    const isInward = type === 'inward';
    const label = isInward ? 'Received' : 'Dispatched';
    const sign = isInward ? '+' : '−';
    const color = isInward ? 'green' : 'orange';

    // Read-only
    if (disabled || !onCommit) {
        return (
            <div className="px-2 py-1 text-[12px] font-mono text-right text-neutral-700 min-h-[28px] flex items-center justify-end">
                {currentVal.toLocaleString()}
            </div>
        );
    }

    // Editing — expanded popover anchored to cell
    if (editing) {
        const newTotal = isInward ? currentVal + addVal : currentVal + addVal;
        const newBalance = isInward ? (balance + addVal) : (balance - addVal);

        return (
            <div ref={cellRef} className="relative">
                {/* Current value (stays visible) */}
                <div className={`px-2 py-1 text-[12px] font-mono text-right min-h-[28px] flex items-center justify-end ${isInward ? 'text-green-700' : 'text-orange-700'}`}>
                    {currentVal.toLocaleString()}
                    {addVal > 0 && (
                        <span className={`ml-1 font-semibold ${isInward ? 'text-green-600' : 'text-orange-600'}`}>
                            {sign}{addVal.toLocaleString()}
                        </span>
                    )}
                </div>

                {/* Popover panel */}
                <div className={`absolute z-30 ${isInward ? 'right-0' : 'left-0'} top-full mt-0.5 bg-white border-2 ${isInward ? 'border-green-500' : 'border-orange-500'} rounded-lg shadow-xl p-3 w-64`}
                    onClick={e => e.stopPropagation()}>

                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                        <span className={`text-[11px] font-bold uppercase tracking-wider ${isInward ? 'text-green-700' : 'text-orange-700'}`}>
                            {isInward ? '📥 Add Inward' : '📤 Add Outward'}
                        </span>
                        <button onClick={() => { setEditing(false); setQty(''); }}
                            className="p-0.5 text-neutral-400 hover:text-neutral-600 rounded">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {/* Current value display */}
                    <div className="bg-neutral-50 rounded px-2.5 py-1.5 mb-2 text-[11px] text-neutral-600">
                        Current {label}: <span className="font-bold font-mono text-neutral-800">{currentVal.toLocaleString()}</span>
                    </div>

                    {/* Input row */}
                    <form onSubmit={async e => {
                        e.preventDefault();
                        if (!addVal || addVal <= 0) return;
                        setSubmitting(true);
                        await onCommit(type, addVal);
                        setSubmitting(false);
                        setEditing(false);
                        setQty('');
                    }}>
                        <div className="flex items-center gap-1.5 mb-2">
                            <span className={`text-lg font-bold ${isInward ? 'text-green-500' : 'text-orange-500'}`}>{sign}</span>
                            <input ref={ref} type="number" step="0.01" min="0.01" value={qty}
                                onChange={e => setQty(e.target.value)}
                                placeholder="Enter quantity..."
                                required
                                className={`flex-1 px-2.5 py-1.5 text-sm font-mono border-2 rounded-lg bg-white focus:outline-none ${isInward ? 'border-green-300 focus:border-green-500' : 'border-orange-300 focus:border-orange-500'}`} />
                        </div>

                        {/* Live preview */}
                        {addVal > 0 && (
                            <div className={`rounded px-2.5 py-1.5 mb-2 text-[11px] font-medium ${isInward ? 'bg-green-50 text-green-800' : 'bg-orange-50 text-orange-800'}`}>
                                New {label}: <span className="font-bold font-mono">{currentVal.toLocaleString()} {sign} {addVal.toLocaleString()} = {newTotal.toLocaleString()}</span>
                                <br />
                                New Balance: <span className="font-bold font-mono">{newBalance.toLocaleString()}</span>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-1.5">
                            <button type="submit" disabled={!addVal || addVal <= 0 || submitting}
                                className={`flex-1 py-1.5 text-xs font-bold rounded-lg text-white transition disabled:opacity-40 ${isInward ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'}`}>
                                {submitting ? '...' : `${isInward ? 'Add Inward' : 'Add Outward'}`}
                            </button>
                            <button type="button" onClick={() => { setEditing(false); setQty(''); }}
                                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-neutral-300 text-neutral-600 hover:bg-neutral-100 transition">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    // Default — clickable cell
    return (
        <div onClick={() => setEditing(true)}
            className={`px-2 py-1 text-[12px] font-mono text-right cursor-pointer min-h-[28px] flex items-center justify-end transition-colors
                ${isInward ? 'hover:bg-green-100 text-green-700' : 'hover:bg-orange-100 text-orange-700'}`}>
            {currentVal.toLocaleString()}
            <span className={`ml-1 text-[10px] opacity-0 group-hover:opacity-70 font-bold ${isInward ? 'text-green-500' : 'text-orange-500'}`}>
                {sign}
            </span>
        </div>
    );
}

// ============================================================
// Sheet Tabs — company tabs at top
// ============================================================
function CompanyTabs({ companies, activeCompany, onTabChange, itemCounts }) {
    const scrollRef = useRef(null);

    const scroll = (direction) => {
        if (scrollRef.current) {
            const scrollAmount = Math.max(300, scrollRef.current.clientWidth / 2);
            scrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
        }
    };

    return (
        <div className="flex items-stretch bg-[#e8ecf1] border-b border-neutral-300 w-full min-w-0 h-[36px]">
            {/* Left Scroll Button */}
            <button
                onClick={() => scroll('left')}
                className="flex items-center justify-center bg-white/50 hover:bg-white text-neutral-500 px-1 border-r border-neutral-300 z-10 shrink-0 transition-colors"
                title="Scroll Left"
            >
                <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Scrollable Container */}
            <div ref={scrollRef}
                className="flex-1 flex items-stretch overflow-x-auto flex-shrink-0 select-none scrollbar-hide scroll-smooth"
                style={{ WebkitOverflowScrolling: 'touch' }}>
                <button onClick={() => onTabChange('ALL')}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 text-[11px] font-bold tracking-wide border-r border-neutral-300 whitespace-nowrap transition-all
                        ${activeCompany === 'ALL' ? 'bg-white text-neutral-900 border-b-2 border-b-blue-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-800 hover:bg-white/60'}`}>
                    FG STOCK
                    <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full text-[9px] font-semibold">{itemCounts?.ALL || 0}</span>
                </button>
                {companies.map(c => {
                    const active = activeCompany === c;
                    const count = itemCounts?.[c] || 0;
                    return (
                        <button key={c} onClick={() => onTabChange(c)}
                            className={`flex-shrink-0 flex items-center gap-1 px-3 text-[11px] font-semibold border-r border-neutral-300 whitespace-nowrap transition-all
                                ${active ? 'bg-white text-neutral-900 border-b-2 border-b-green-500 shadow-sm' : 'text-neutral-500 hover:text-neutral-800 hover:bg-white/60'}`}>
                            {c}
                            <span className={`text-[9px] font-medium px-1 py-0.5 rounded-full ${active ? 'bg-green-100 text-green-700' : 'bg-neutral-200 text-neutral-500'}`}>{count}</span>
                        </button>
                    );
                })}
            </div>

            {/* Right Scroll Button */}
            <button
                onClick={() => scroll('right')}
                className="flex items-center justify-center bg-white/50 hover:bg-white text-neutral-500 px-1 border-l border-neutral-300 z-10 shrink-0 shadow-[-4px_0_10px_rgba(0,0,0,0.05)] transition-colors"
                title="Scroll Right"
            >
                <ChevronRight className="w-4 h-4" />
            </button>
        </div>
    );
}

// ============================================================
// Main Sheet Page
// ============================================================
export default function InventorySheetPage() {
    const { profile } = useAuth();
    const searchParams = useSearchParams();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [companies, setCompanies] = useState([]);
    const [activeCompany, setActiveCompany] = useState('ALL');
    const [search, setSearch] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [txnSuccess, setTxnSuccess] = useState(null);
    const [materialFilter, setMaterialFilter] = useState('ALL');
    const [initialCompanySet, setInitialCompanySet] = useState(false);

    // Only store_manager can do inward/outward — all others are view-only
    const canWrite = profile?.role === 'store_manager';

    const fetchAll = useCallback(async (showRefresh = false) => {
        if (showRefresh) setRefreshing(true);
        try {
            const res = await fetch('/api/inventory?limit=2000&showZero=true&allWarehouses=true&sortBy=customer_name&sortDir=asc');
            const data = await res.json();
            const allItems = data.items || [];
            setItems(allItems);

            // Extract unique companies
            const companySet = [...new Set(allItems.map(i => i.customer_name))].sort();
            setCompanies(companySet);

            // Auto-select company from URL ?company= param (only on first load)
            if (!initialCompanySet) {
                const companyParam = searchParams.get('company');
                if (companyParam && companySet.includes(companyParam)) {
                    setActiveCompany(companyParam);
                }
                setInitialCompanySet(true);
            }
        } catch (err) {
            console.error('Failed to fetch:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [initialCompanySet, searchParams]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    // Item counts per company
    const itemCounts = useMemo(() => {
        const counts = { ALL: items.length };
        items.forEach(i => {
            counts[i.customer_name] = (counts[i.customer_name] || 0) + 1;
        });
        return counts;
    }, [items]);

    // Unique material types for filter
    const materialTypes = useMemo(() => {
        return [...new Set(items.map(i => i.material_type).filter(Boolean))].sort();
    }, [items]);

    // Filtered items
    const visible = useMemo(() => {
        let result = items;
        if (activeCompany !== 'ALL') {
            result = result.filter(i => i.customer_name === activeCompany);
        }
        if (materialFilter !== 'ALL') {
            result = result.filter(i => i.material_type === materialFilter);
        }
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(i =>
                (i.customer_name || '').toLowerCase().includes(q) ||
                (i.material_type || '').toLowerCase().includes(q) ||
                (i.part_size || '').toLowerCase().includes(q) ||
                (i.customer_part_code || '').toLowerCase().includes(q)
            );
        }
        return result;
    }, [items, activeCompany, materialFilter, search]);

    // Export visible data as CSV
    const exportCSV = (asExcel = false) => {
        const headers = ['SR NO', 'CUSTOMER NAME', 'MATERIAL TYPE', 'PART SIZE', 'PART CODE', 'UOM', 'RECEIVED QTY', 'DISPATCH QTY', 'BALANCE', 'STOCK IN KG'];
        const csvRows = [headers.join(',')];
        visible.forEach((item, idx) => {
            const row = [
                item.sr_no || idx + 1,
                `"${(item.customer_name || '').replace(/"/g, '""')}"`,
                `"${(item.material_type || '').replace(/"/g, '""')}"`,
                `"${(item.part_size || '').replace(/"/g, '""')}"`,
                `"${(item.customer_part_code || '').replace(/"/g, '""')}"`,
                item.uom || 'PCS',
                item.total_received || 0,
                item.total_dispatched || 0,
                parseFloat(item.balance_qty || 0),
                parseFloat(item.stock_in_kg || 0).toFixed(2)
            ];
            csvRows.push(row.join(','));
        });
        const blob = new Blob([csvRows.join('\n')], { type: asExcel ? 'application/vnd.ms-excel' : 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `FG_STOCK_${activeCompany === 'ALL' ? 'All' : activeCompany}_${new Date().toISOString().split('T')[0]}.${asExcel ? 'xls' : 'csv'}`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleTransaction = async (itemId, type, quantity) => {
        try {
            const res = await fetch(`/api/inventory/${itemId}/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, quantity }),
            });
            const data = await res.json();
            if (res.ok) {
                setItems(prev => prev.map(item =>
                    item.id === itemId ? { ...item, ...data.item } : item
                ));
                setTxnSuccess(itemId);
                setTimeout(() => setTxnSuccess(null), 1500);
            }
        } catch (err) {
            console.error('Transaction failed:', err);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-screen">
            <Loader2 className="w-8 h-8 animate-spin text-neutral-300" />
        </div>
    );

    return (
        <>
            <style jsx global>{`
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>

            <div className="h-[calc(100vh-56px)] flex flex-col bg-white">
                {/* Toolbar */}
                <div className="flex items-center gap-2 px-3 py-2 border-b border-neutral-200 flex-shrink-0 bg-white">
                    <div className="flex-1 min-w-0">
                        <h1 className="text-[14px] font-bold text-neutral-800 tracking-tight">📦 FG STOCK — Inventory</h1>
                        <p className="text-[10px] text-neutral-400">{visible.length} item{visible.length !== 1 ? 's' : ''}{activeCompany !== 'ALL' ? ` • ${activeCompany}` : ` • ${companies.length} companies`}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                        {/* Material Type Filter */}
                        <div className="relative">
                            <select value={materialFilter} onChange={e => setMaterialFilter(e.target.value)}
                                className="appearance-none pl-6 pr-2 py-1 text-xs border border-neutral-300 rounded bg-neutral-50 focus:outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer text-neutral-600">
                                <option value="ALL">All Materials</option>
                                {materialTypes.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                            <Filter className="absolute left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-neutral-400 pointer-events-none" />
                        </div>
                        <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-neutral-400" />
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
                                className="pl-7 pr-2 py-1 text-xs border border-neutral-300 rounded bg-neutral-50 w-28 sm:w-36 focus:w-44 transition-all focus:outline-none focus:ring-1 focus:ring-blue-400" />
                        </div>
                        {/* Export Buttons */}
                        <button onClick={() => exportCSV(true)}
                            className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors">
                            <FileSpreadsheet className="w-3 h-3" /> Excel
                        </button>
                        <button onClick={() => exportCSV(false)}
                            className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded border border-teal-300 bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors">
                            <Download className="w-3 h-3" /> CSV
                        </button>
                        <button onClick={() => window.print()}
                            className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded border border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors">
                            <Printer className="w-3 h-3" /> Print
                        </button>
                        <div className="w-px h-5 bg-neutral-300" />
                        <button onClick={() => fetchAll(true)} disabled={refreshing}
                            className="p-1.5 border border-neutral-300 rounded bg-white hover:bg-neutral-50 disabled:opacity-50">
                            <RefreshCw className={`w-3.5 h-3.5 text-neutral-500 ${refreshing ? 'animate-spin' : ''}`} />
                        </button>
                        <Link href="/inventory"
                            className="flex items-center gap-1 px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[11px] font-semibold rounded border border-neutral-300 transition-colors">
                            <LayoutGrid className="w-3 h-3" /> Card View
                        </Link>
                    </div>
                </div>

                {/* Company Tabs */}
                <CompanyTabs companies={companies} activeCompany={activeCompany} onTabChange={setActiveCompany} itemCounts={itemCounts} />

                {/* Spreadsheet */}
                <div className="flex-1 overflow-auto">
                    <table className="w-full border-collapse" style={{ minWidth: 900 }}>
                        <colgroup>
                            <col style={{ width: 50 }} />
                            <col style={{ width: 160 }} />
                            <col style={{ minWidth: 140 }} />
                            <col style={{ minWidth: 140 }} />
                            <col style={{ width: 130 }} />
                            <col style={{ width: 50 }} />
                            <col style={{ width: 100 }} />
                            <col style={{ width: 100 }} />
                            <col style={{ width: 90 }} />
                            <col style={{ width: 80 }} />
                        </colgroup>
                        <thead className="sticky top-0 z-20">
                            <tr>
                                <th className="border border-neutral-300 px-1 py-1.5 text-[9px] font-bold tracking-widest text-center bg-[#dce3ed] text-neutral-600 uppercase">SR NO</th>
                                <th className="border border-neutral-300 px-2 py-1.5 text-[9px] font-bold tracking-widest text-left bg-[#dce3ed] text-neutral-600 uppercase">CUSTOMER NAME</th>
                                <th className="border border-neutral-300 px-2 py-1.5 text-[9px] font-bold tracking-widest text-left bg-[#dce3ed] text-neutral-600 uppercase">MATERIAL TYPE</th>
                                <th className="border border-neutral-300 px-2 py-1.5 text-[9px] font-bold tracking-widest text-left bg-[#dce3ed] text-neutral-600 uppercase">PART SIZE</th>
                                <th className="border border-neutral-300 px-2 py-1.5 text-[9px] font-bold tracking-widest text-left bg-[#dce3ed] text-neutral-600 uppercase">PART CODE</th>
                                <th className="border border-neutral-300 px-1 py-1.5 text-[9px] font-bold tracking-widest text-center bg-[#dce3ed] text-neutral-600 uppercase">UOM</th>
                                <th className="border border-neutral-300 px-2 py-1.5 text-[9px] font-bold tracking-widest text-right bg-[#d4edda] text-green-800 uppercase">RECEIVED QTY</th>
                                <th className="border border-neutral-300 px-2 py-1.5 text-[9px] font-bold tracking-widest text-right bg-[#f8d7da] text-red-800 uppercase">DISPATCH QTY</th>
                                <th className="border border-neutral-300 px-2 py-1.5 text-[9px] font-bold tracking-widest text-right bg-[#cce5ff] text-blue-800 uppercase">BALANCE</th>
                                <th className="border border-neutral-300 px-2 py-1.5 text-[9px] font-bold tracking-widest text-right bg-[#dce3ed] text-neutral-600 uppercase">STOCK KG</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visible.length === 0 && (
                                <tr><td colSpan={10} className="py-16 text-center text-neutral-400 text-sm">
                                    {search ? 'No items match your search' : 'No inventory items'}
                                </td></tr>
                            )}
                            {visible.map((item, idx) => {
                                const balance = parseFloat(item.balance_qty || 0);
                                const justUpdated = txnSuccess === item.id;
                                return (
                                    <tr key={item.id}
                                        className={`group transition-colors hover:bg-blue-50/50 ${justUpdated ? 'bg-green-100' : ''}`}
                                        style={{ background: justUpdated ? undefined : (idx % 2 === 0 ? '#fff' : '#f8fafc') }}>
                                        <td className="border border-neutral-200 text-center text-[10px] font-mono text-neutral-400 bg-[#e8edf3] px-1">{item.sr_no || idx + 1}</td>
                                        <td className="border border-neutral-200 px-2 py-1 text-[12px] font-semibold text-neutral-800">
                                            <Link href={`/inventory/company/${encodeURIComponent(item.customer_name)}`} className="hover:text-blue-600 transition">
                                                {item.customer_name}
                                            </Link>
                                        </td>
                                        <td className="border border-neutral-200 px-2 py-1 text-[12px] text-neutral-700">{item.material_type || '—'}</td>
                                        <td className="border border-neutral-200 px-2 py-1 text-[12px] text-neutral-600">{item.part_size || '—'}</td>
                                        <td className="border border-neutral-200 px-2 py-1 text-[11px] font-mono text-neutral-500">{item.customer_part_code || '—'}</td>
                                        <td className="border border-neutral-200 text-center text-[11px] text-neutral-500 px-1">{item.uom}</td>
                                        <td className="border border-neutral-200 bg-green-50/40">
                                            <EditableQtyCell value={item.total_received} type="inward" balance={balance}
                                                onCommit={canWrite ? (type, qty) => handleTransaction(item.id, type, qty) : null}
                                                disabled={!canWrite} />
                                        </td>
                                        <td className="border border-neutral-200 bg-red-50/30">
                                            <EditableQtyCell value={item.total_dispatched} type="outward" balance={balance}
                                                onCommit={canWrite ? (type, qty) => handleTransaction(item.id, type, qty) : null}
                                                disabled={!canWrite} />
                                        </td>
                                        <td className={`border border-neutral-200 px-2 py-1 text-right font-mono text-[13px] font-bold
                                            ${balance <= 0 ? 'text-red-600 bg-red-50' : balance < 50 ? 'text-amber-600 bg-amber-50/40' : 'text-blue-700 bg-blue-50/40'}`}>
                                            {balance.toLocaleString()}
                                        </td>
                                        <td className="border border-neutral-200 px-2 py-1 text-right text-[11px] font-mono text-neutral-500">
                                            {parseFloat(item.stock_in_kg || 0).toFixed(1)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}
