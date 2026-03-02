'use client';

/**
 * Company Inventory Page
 * Shows all products for a specific company in a clean table.
 * QR code on rack → scans → opens this page directly.
 * Store manager can do inward/outward right from here.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft, Search, Plus, Minus, ChevronUp, ChevronDown,
    Check, X, Package, Clock, User, RefreshCw
} from 'lucide-react';
import AddProductModal from '@/components/inventory/AddProductModal';

export default function CompanyInventoryPage() {
    const { profile } = useAuth();
    const params = useParams();
    const router = useRouter();
    const companySlug = decodeURIComponent(params.slug);

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [sortCol, setSortCol] = useState('sr_no');
    const [sortDir, setSortDir] = useState('asc');
    const [refreshing, setRefreshing] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);

    // Active transaction row
    const [activeTxn, setActiveTxn] = useState(null); // { itemId, type }
    const [txnQty, setTxnQty] = useState('');
    const [txnRef, setTxnRef] = useState('');
    const [txnLoading, setTxnLoading] = useState(false);
    const [txnError, setTxnError] = useState('');
    const [txnSuccess, setTxnSuccess] = useState(null);

    const canWrite = profile && ['store_manager', 'director', 'head_of_sales', 'vp', 'developer'].includes(profile.role);

    const fetchItems = useCallback(async (showRefresh = false) => {
        if (showRefresh) setRefreshing(true);
        try {
            const res = await fetch(`/api/inventory?customer=${encodeURIComponent(companySlug)}&limit=1000&showZero=true&allWarehouses=true`);
            const data = await res.json();
            setItems(data.items || []);
        } catch (err) {
            console.error('Failed to fetch:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [companySlug]);

    useEffect(() => { fetchItems(); }, [fetchItems]);

    // Sort + filter
    const processed = useMemo(() => {
        let result = [...items];

        // search
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(i =>
                (i.material_type || '').toLowerCase().includes(q) ||
                (i.part_size || '').toLowerCase().includes(q) ||
                (i.customer_part_code || '').toLowerCase().includes(q)
            );
        }

        // sort
        result.sort((a, b) => {
            let va = a[sortCol], vb = b[sortCol];
            if (typeof va === 'string') va = va.toLowerCase();
            if (typeof vb === 'string') vb = vb.toLowerCase();
            const numA = parseFloat(va), numB = parseFloat(vb);
            if (!isNaN(numA) && !isNaN(numB)) { va = numA; vb = numB; }
            if (va < vb) return sortDir === 'asc' ? -1 : 1;
            if (va > vb) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [items, search, sortCol, sortDir]);

    const handleSort = (col) => {
        if (sortCol === col) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortCol(col);
            setSortDir('asc');
        }
    };

    const startTxn = (itemId, type) => {
        setActiveTxn({ itemId, type });
        setTxnQty('');
        setTxnRef('');
        setTxnError('');
        setTxnSuccess(null);
    };

    const cancelTxn = () => {
        setActiveTxn(null);
        setTxnQty('');
        setTxnRef('');
        setTxnError('');
    };

    const submitTxn = async (e) => {
        e.preventDefault();
        if (!activeTxn || !txnQty) return;
        setTxnLoading(true);
        setTxnError('');
        try {
            const res = await fetch(`/api/inventory/${activeTxn.itemId}/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: activeTxn.type, quantity: parseFloat(txnQty), reference_note: txnRef }),
            });
            const data = await res.json();
            if (!res.ok) {
                setTxnError(data.error || 'Failed');
                return;
            }
            // Update the item in the list with new totals
            setItems(prev => prev.map(item =>
                item.id === activeTxn.itemId ? { ...item, ...data.item } : item
            ));
            setTxnSuccess(activeTxn.itemId);
            setTimeout(() => setTxnSuccess(null), 2000);
            cancelTxn();
        } catch (err) {
            setTxnError('Network error');
        } finally {
            setTxnLoading(false);
        }
    };

    // Summary stats
    const totalItems = items.length;
    const inStock = items.filter(i => parseFloat(i.balance_qty) > 0).length;
    const zeroStock = items.filter(i => parseFloat(i.balance_qty) <= 0).length;

    const SortIcon = ({ col }) => {
        if (sortCol !== col) return <ChevronUp className="w-3 h-3 opacity-0 group-hover:opacity-30" />;
        return sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
                <div className="animate-pulse text-neutral-400 text-lg">Loading {companySlug}...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
            {/* Header */}
            <div className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-6 py-4">
                <Link href="/inventory" className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition mb-3">
                    <ArrowLeft className="w-4 h-4" /> All Companies
                </Link>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-bold text-neutral-900 dark:text-white">{companySlug}</h1>
                        <div className="flex items-center gap-4 mt-1 text-sm text-neutral-500">
                            <span>{totalItems} products</span>
                            <span className="text-emerald-600">{inStock} in stock</span>
                            {zeroStock > 0 && <span className="text-red-600">{zeroStock} zero stock</span>}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {canWrite && (
                            <button onClick={() => setShowAddModal(true)}
                                className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap">
                                <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Add Product</span>
                            </button>
                        )}
                        <button onClick={() => fetchItems(true)} disabled={refreshing}
                            className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition disabled:opacity-50">
                            <RefreshCw className={`w-4 h-4 text-neutral-500 ${refreshing ? 'animate-spin' : ''}`} />
                        </button>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                                placeholder="Search products..."
                                className="pl-9 pr-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm outline-none focus:ring-2 focus:ring-blue-500 w-56" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="p-4">
                <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-700">
                                    <Th label="#" col="sr_no" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} width="w-12" />
                                    <Th label="Material" col="material_type" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                                    <Th label="Part Size" col="part_size" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                                    <Th label="Part Code" col="customer_part_code" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                                    <Th label="UOM" col="uom" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} width="w-16" />
                                    <Th label="Received" col="total_received" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} align="right" />
                                    <Th label="Dispatched" col="total_dispatched" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} align="right" />
                                    <Th label="Balance" col="balance_qty" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} align="right" />
                                    <Th label="Kg" col="stock_in_kg" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} align="right" />
                                    {canWrite && <th className="px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-neutral-500 w-48">Action</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {processed.map(item => {
                                    const balance = parseFloat(item.balance_qty || 0);
                                    const isActive = activeTxn?.itemId === item.id;
                                    const justUpdated = txnSuccess === item.id;

                                    return (
                                        <tr key={item.id} className={`group hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition ${justUpdated ? 'bg-emerald-50 dark:bg-emerald-900/10' : ''} ${isActive ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}>
                                            <td className="px-3 py-2.5 text-xs text-neutral-400 font-mono">{item.sr_no || '—'}</td>
                                            <td className="px-3 py-2.5 font-medium text-neutral-900 dark:text-white">
                                                <Link href={`/inventory/${item.id}`} className="hover:text-blue-600 transition">
                                                    {item.material_type || '—'}
                                                </Link>
                                            </td>
                                            <td className="px-3 py-2.5 text-neutral-600 dark:text-neutral-400">{item.part_size || '—'}</td>
                                            <td className="px-3 py-2.5 text-xs text-neutral-500 font-mono">{item.customer_part_code || '—'}</td>
                                            <td className="px-3 py-2.5 text-xs text-neutral-500">{item.uom}</td>
                                            <td className="px-3 py-2.5 text-right font-mono text-neutral-700 dark:text-neutral-300">{parseFloat(item.total_received || 0).toLocaleString()}</td>
                                            <td className="px-3 py-2.5 text-right font-mono text-neutral-700 dark:text-neutral-300">{parseFloat(item.total_dispatched || 0).toLocaleString()}</td>
                                            <td className={`px-3 py-2.5 text-right font-mono font-bold text-base ${balance <= 0 ? 'text-red-600' : balance < 50 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                                {balance.toLocaleString()}
                                            </td>
                                            <td className="px-3 py-2.5 text-right font-mono text-xs text-neutral-500">{parseFloat(item.stock_in_kg || 0).toFixed(1)}</td>

                                            {canWrite && (
                                                <td className="px-3 py-2.5">
                                                    {isActive ? (
                                                        <form onSubmit={submitTxn} className="flex items-center gap-1">
                                                            <input type="number" step="0.01" min="0.01" value={txnQty} onChange={e => setTxnQty(e.target.value)}
                                                                autoFocus required placeholder="Qty"
                                                                className="w-20 px-2 py-1 text-sm border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 outline-none focus:ring-1 focus:ring-blue-500" />
                                                            <input type="text" value={txnRef} onChange={e => setTxnRef(e.target.value)}
                                                                placeholder="Ref"
                                                                className="w-16 px-2 py-1 text-xs border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 outline-none focus:ring-1 focus:ring-blue-500" />
                                                            <button type="submit" disabled={txnLoading}
                                                                className={`p-1 rounded ${activeTxn.type === 'inward' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-orange-600 hover:bg-orange-700'} text-white transition disabled:opacity-50`}>
                                                                <Check className="w-4 h-4" />
                                                            </button>
                                                            <button type="button" onClick={cancelTxn}
                                                                className="p-1 rounded bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 transition">
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </form>
                                                    ) : (
                                                        <div className="flex items-center gap-1 justify-center">
                                                            <button onClick={() => startTxn(item.id, 'inward')}
                                                                className="px-2.5 py-1 text-xs font-bold rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 dark:hover:bg-emerald-900/60 transition">
                                                                + IN
                                                            </button>
                                                            <button onClick={() => startTxn(item.id, 'outward')}
                                                                className="px-2.5 py-1 text-xs font-bold rounded bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/40 dark:text-orange-400 dark:hover:bg-orange-900/60 transition">
                                                                − OUT
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Transaction Error */}
                    {txnError && (
                        <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 text-sm border-t border-red-200 dark:border-red-800">
                            {txnError}
                        </div>
                    )}

                    {processed.length === 0 && (
                        <div className="text-center py-16 text-neutral-400">
                            <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                            <p>{search ? `No products matching "${search}"` : 'No products found'}</p>
                        </div>
                    )}
                </div>
            </div>

            <AddProductModal
                open={showAddModal}
                onOpenChange={setShowAddModal}
                defaultCompany={companySlug}
                onSuccess={(newItem) => {
                    fetchItems(true);
                }}
            />
        </div>
    );
}

/** Table header with sort */
function Th({ label, col, sortCol, sortDir, onSort, align = 'left', width = '' }) {
    const active = sortCol === col;
    return (
        <th
            className={`px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider cursor-pointer select-none group hover:bg-neutral-100 dark:hover:bg-neutral-700/50 transition ${width} ${align === 'right' ? 'text-right' : 'text-left'} ${active ? 'text-blue-600' : 'text-neutral-500'}`}
            onClick={() => onSort(col)}
        >
            <span className="inline-flex items-center gap-1">
                {label}
                {active ? (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ChevronUp className="w-3 h-3 opacity-0 group-hover:opacity-30" />}
            </span>
        </th>
    );
}
