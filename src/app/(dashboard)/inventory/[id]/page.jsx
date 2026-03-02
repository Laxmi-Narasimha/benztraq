'use client';

/**
 * Inventory Item Detail Page
 * Shows full item details with transaction history
 * 
 * @module app/(dashboard)/inventory/[id]/page
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { useRouter, useParams } from 'next/navigation';
import {
    ArrowLeft, ArrowDownCircle, ArrowUpCircle, Package,
    Clock, User, FileText, Edit, Save, X, Hash
} from 'lucide-react';

export default function InventoryItemPage() {
    const { profile } = useAuth();
    const router = useRouter();
    const params = useParams();
    const itemId = params.id;

    const [item, setItem] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [saving, setSaving] = useState(false);

    // Transaction form
    const [txnType, setTxnType] = useState(null);
    const [txnQty, setTxnQty] = useState('');
    const [txnRef, setTxnRef] = useState('');
    const [txnLoading, setTxnLoading] = useState(false);
    const [txnError, setTxnError] = useState('');

    const canWrite = profile && ['store_manager', 'director', 'head_of_sales', 'vp', 'developer'].includes(profile.role);

    const fetchItem = async () => {
        try {
            const res = await fetch(`/api/inventory/${itemId}`);
            const data = await res.json();
            if (res.ok) {
                setItem(data.item);
                setTransactions(data.transactions || []);
                setEditForm(data.item);
            }
        } catch (err) {
            console.error('Failed to fetch item:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (itemId) fetchItem();
    }, [itemId]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/inventory/${itemId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    material_type: editForm.material_type,
                    part_size: editForm.part_size,
                    customer_part_code: editForm.customer_part_code,
                    uom: editForm.uom,
                    kg_per_piece: parseFloat(editForm.kg_per_piece) || 0,
                    notes: editForm.notes,
                }),
            });
            if (res.ok) {
                const data = await res.json();
                setItem(data.item);
                setEditing(false);
            }
        } catch (err) {
            console.error('Failed to save:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleTransaction = async (e) => {
        e.preventDefault();
        setTxnError('');
        setTxnLoading(true);
        try {
            const res = await fetch(`/api/inventory/${itemId}/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: txnType, quantity: parseFloat(txnQty), reference_note: txnRef }),
            });
            const data = await res.json();
            if (!res.ok) {
                setTxnError(data.error);
                return;
            }
            setItem(data.item);
            setTxnType(null);
            setTxnQty('');
            setTxnRef('');
            fetchItem(); // Refresh transactions
        } catch (err) {
            setTxnError('Network error');
        } finally {
            setTxnLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
                <div className="animate-pulse text-neutral-400">Loading item...</div>
            </div>
        );
    }

    if (!item) {
        return (
            <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col items-center justify-center">
                <Package className="w-12 h-12 text-neutral-300 mb-3" />
                <p className="text-neutral-500">Item not found</p>
                <button onClick={() => router.push('/inventory')} className="mt-4 text-blue-600 hover:underline text-sm">← Back to Inventory</button>
            </div>
        );
    }

    const balance = parseFloat(item.balance_qty || 0);
    const balanceColor = balance <= 0 ? 'text-red-600' : balance < 100 ? 'text-amber-600' : 'text-emerald-600';

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
            {/* Header */}
            <div className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
                <div className="px-6 py-4">
                    <button onClick={() => router.push('/inventory')} className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition mb-3">
                        <ArrowLeft className="w-4 h-4" /> Back to Inventory
                    </button>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-bold text-neutral-900 dark:text-white">{item.customer_name}</h1>
                            <p className="text-sm text-neutral-500">{item.material_type} — {item.part_size}</p>
                        </div>
                        <div className="text-right">
                            <p className={`text-3xl font-bold ${balanceColor}`}>{balance.toLocaleString()}</p>
                            <p className="text-xs text-neutral-400">{item.uom} in stock</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Item Details */}
                <div className="lg:col-span-1 space-y-4">
                    {/* Item Info Card */}
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                        <div className="px-5 py-3 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                            <h3 className="font-semibold text-sm text-neutral-900 dark:text-white">Item Details</h3>
                            {canWrite && !editing && (
                                <button onClick={() => setEditing(true)} className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition">
                                    <Edit className="w-4 h-4 text-neutral-500" />
                                </button>
                            )}
                        </div>
                        <div className="p-5 space-y-3">
                            {editing ? (
                                <>
                                    {[
                                        { label: 'Material Type', key: 'material_type' },
                                        { label: 'Part Size', key: 'part_size' },
                                        { label: 'Part Code', key: 'customer_part_code' },
                                        { label: 'Kg per Piece', key: 'kg_per_piece', type: 'number' },
                                        { label: 'Notes', key: 'notes' },
                                    ].map(field => (
                                        <div key={field.key}>
                                            <label className="text-xs text-neutral-500">{field.label}</label>
                                            <input
                                                type={field.type || 'text'}
                                                step={field.type === 'number' ? '0.000001' : undefined}
                                                value={editForm[field.key] || ''}
                                                onChange={e => setEditForm(f => ({ ...f, [field.key]: e.target.value }))}
                                                className="w-full mt-0.5 px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    ))}
                                    <div className="flex gap-2 pt-2">
                                        <button onClick={() => setEditing(false)} className="flex-1 px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition">
                                            Cancel
                                        </button>
                                        <button onClick={handleSave} disabled={saving} className="flex-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50">
                                            {saving ? 'Saving...' : 'Save'}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {[
                                        { label: 'Material Type', value: item.material_type },
                                        { label: 'Part Size', value: item.part_size },
                                        { label: 'Customer Part Code', value: item.customer_part_code },
                                        { label: 'UOM', value: item.uom },
                                        { label: 'Kg per Piece', value: item.kg_per_piece },
                                        { label: 'Warehouse', value: item.warehouse },
                                        { label: 'Total Received', value: parseFloat(item.total_received || 0).toLocaleString() },
                                        { label: 'Total Dispatched', value: parseFloat(item.total_dispatched || 0).toLocaleString() },
                                        { label: 'Stock in Kg', value: `${parseFloat(item.stock_in_kg || 0).toFixed(2)} kg` },
                                    ].map(row => (
                                        <div key={row.label} className="flex items-center justify-between py-1">
                                            <span className="text-xs text-neutral-500">{row.label}</span>
                                            <span className="text-sm font-medium text-neutral-900 dark:text-white">{row.value || '—'}</span>
                                        </div>
                                    ))}
                                    {item.notes && (
                                        <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
                                            <span className="text-xs text-neutral-500">Notes</span>
                                            <p className="text-sm text-neutral-700 dark:text-neutral-300 mt-0.5">{item.notes}</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Quick Transaction */}
                    {canWrite && (
                        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                            <div className="px-5 py-3 border-b border-neutral-200 dark:border-neutral-800">
                                <h3 className="font-semibold text-sm text-neutral-900 dark:text-white">Quick Transaction</h3>
                            </div>
                            {!txnType ? (
                                <div className="p-5 flex gap-3">
                                    <button onClick={() => setTxnType('inward')}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50 font-medium text-sm transition">
                                        <ArrowDownCircle className="w-5 h-5" /> Inward
                                    </button>
                                    <button onClick={() => setTxnType('outward')}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-orange-50 text-orange-700 hover:bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400 dark:hover:bg-orange-900/50 font-medium text-sm transition">
                                        <ArrowUpCircle className="w-5 h-5" /> Outward
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleTransaction} className="p-5 space-y-3">
                                    <div className={`text-sm font-medium flex items-center gap-2 ${txnType === 'inward' ? 'text-emerald-600' : 'text-orange-600'}`}>
                                        {txnType === 'inward' ? <ArrowDownCircle className="w-4 h-4" /> : <ArrowUpCircle className="w-4 h-4" />}
                                        {txnType === 'inward' ? 'Recording Inward' : 'Recording Outward'}
                                    </div>
                                    <input type="number" step="0.01" min="0.01" value={txnQty} onChange={e => setTxnQty(e.target.value)}
                                        placeholder={`Quantity (${item.uom})`} required autoFocus
                                        className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-lg font-semibold outline-none focus:ring-2 focus:ring-blue-500" />
                                    <input type="text" value={txnRef} onChange={e => setTxnRef(e.target.value)}
                                        placeholder="Reference (optional)"
                                        className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                                    {txnError && <p className="text-sm text-red-600">{txnError}</p>}
                                    <div className="flex gap-2">
                                        <button type="button" onClick={() => { setTxnType(null); setTxnQty(''); setTxnRef(''); setTxnError(''); }}
                                            className="flex-1 px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition">Cancel</button>
                                        <button type="submit" disabled={txnLoading}
                                            className={`flex-1 px-3 py-2 rounded-lg text-white text-sm font-medium transition disabled:opacity-50 ${txnType === 'inward' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-orange-600 hover:bg-orange-700'}`}>
                                            {txnLoading ? 'Saving...' : 'Confirm'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}
                </div>

                {/* Right: Transaction History */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                        <div className="px-5 py-3 border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-neutral-500" />
                            <h3 className="font-semibold text-sm text-neutral-900 dark:text-white">Transaction History</h3>
                            <span className="ml-auto text-xs text-neutral-400">{transactions.length} entries</span>
                        </div>

                        {transactions.length === 0 ? (
                            <div className="p-12 text-center">
                                <FileText className="w-10 h-10 text-neutral-200 mx-auto mb-2" />
                                <p className="text-sm text-neutral-400">No transactions recorded yet</p>
                                {canWrite && <p className="text-xs text-neutral-400 mt-1">Use the buttons on the left to record inward or outward</p>}
                            </div>
                        ) : (
                            <div className="divide-y divide-neutral-100 dark:divide-neutral-800 max-h-[600px] overflow-y-auto">
                                {transactions.map((txn) => (
                                    <div key={txn.id} className="px-5 py-4 flex items-start gap-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${txn.type === 'inward'
                                                ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400'
                                                : 'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400'
                                            }`}>
                                            {txn.type === 'inward' ? <ArrowDownCircle className="w-5 h-5" /> : <ArrowUpCircle className="w-5 h-5" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-lg font-bold ${txn.type === 'inward' ? 'text-emerald-600' : 'text-orange-600'}`}>
                                                    {txn.type === 'inward' ? '+' : '-'}{parseFloat(txn.quantity).toLocaleString()} {item.uom}
                                                </span>
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${txn.type === 'inward' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'
                                                    }`}>
                                                    {txn.type === 'inward' ? 'INWARD' : 'OUTWARD'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 mt-1.5 text-xs text-neutral-500">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(txn.created_at).toLocaleString('en-IN', {
                                                        day: '2-digit', month: 'short', year: 'numeric',
                                                        hour: '2-digit', minute: '2-digit', second: '2-digit'
                                                    })}
                                                </span>
                                                {txn.created_by_name && (
                                                    <span className="flex items-center gap-1">
                                                        <User className="w-3 h-3" /> {txn.created_by_name}
                                                    </span>
                                                )}
                                            </div>
                                            {txn.reference_note && (
                                                <p className="mt-1.5 text-sm text-neutral-600 dark:text-neutral-400 flex items-center gap-1">
                                                    <Hash className="w-3 h-3 text-neutral-400" /> {txn.reference_note}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
