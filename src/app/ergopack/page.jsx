/**
 * Ergopack Dashboard - Spreadsheet View
 * 
 * Full-screen, Google Sheets–style inline-editable contact list.
 * Columns: Company, Contact Person, Email, Phone, City, Status, Last Activity, ✏️
 * Pencil icon opens the full contact detail page.
 * Dark theme matching the Ergopack layout.
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Plus, X, Loader2, Search, RefreshCw, Pencil,
    AlertCircle, Building2, Save, ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const STATUSES = [
    { value: 'open', label: 'Open', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    { value: 'contacted', label: 'Contacted', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' },
    { value: 'proposal_sent', label: 'Proposal Sent', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    { value: 'deal_done', label: 'Won', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    { value: 'lost', label: 'Lost', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
    { value: 'not_serviceable', label: 'Not Serviceable', color: 'bg-zinc-600/30 text-zinc-400 border-zinc-600/30' },
];

const STATUS_COLORS = Object.fromEntries(STATUSES.map(s => [s.value, s.color]));

/* ─── Inline Editable Cell ─── */
function Cell({ value, onChange, placeholder = '—', className = '' }) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(value || '');
    const ref = useRef(null);

    useEffect(() => { setDraft(value || ''); }, [value]);
    useEffect(() => { if (editing && ref.current) ref.current.focus(); }, [editing]);

    if (!editing) {
        return (
            <div className={cn('px-2.5 py-2 text-[12px] text-zinc-200 cursor-text hover:bg-zinc-800/50 min-h-[36px] flex items-center', className)}
                onClick={() => setEditing(true)}>
                {value || <span className="text-zinc-600 italic">{placeholder}</span>}
            </div>
        );
    }
    return (
        <input ref={ref} value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={() => { setEditing(false); if (draft.trim() !== (value || '')) onChange(draft.trim()); }}
            onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); if (e.key === 'Escape') { setDraft(value || ''); setEditing(false); } }}
            className="w-full px-2.5 py-1.5 text-[12px] bg-zinc-900 text-white border border-blue-500/60 rounded-sm outline-none"
            placeholder={placeholder} />
    );
}

/* ─── Add Lead Row ─── */
function AddRow({ onSave, onCancel }) {
    const [f, setF] = useState({ companyName: '', contactPerson: '', email: '', phone: '', city: '', status: 'open' });
    const ref = useRef(null);
    useEffect(() => { ref.current?.focus(); }, []);

    return (
        <tr className="bg-emerald-950/15 border-b border-zinc-800">
            <td className="border-r border-zinc-800 px-2 py-1.5">
                <input ref={ref} value={f.companyName} onChange={e => setF({ ...f, companyName: e.target.value })}
                    placeholder="Company name *" className="w-full text-[12px] bg-transparent text-white outline-none placeholder-zinc-600" />
            </td>
            <td className="border-r border-zinc-800 px-2 py-1.5">
                <input value={f.contactPerson} onChange={e => setF({ ...f, contactPerson: e.target.value })}
                    placeholder="Contact person" className="w-full text-[12px] bg-transparent text-white outline-none placeholder-zinc-600" />
            </td>
            <td className="border-r border-zinc-800 px-2 py-1.5">
                <input value={f.email} onChange={e => setF({ ...f, email: e.target.value })}
                    placeholder="Email" className="w-full text-[12px] bg-transparent text-white outline-none placeholder-zinc-600" />
            </td>
            <td className="border-r border-zinc-800 px-2 py-1.5">
                <input value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })}
                    placeholder="Phone" className="w-full text-[12px] bg-transparent text-white outline-none placeholder-zinc-600" />
            </td>
            <td className="border-r border-zinc-800 px-2 py-1.5">
                <input value={f.city} onChange={e => setF({ ...f, city: e.target.value })}
                    placeholder="City" className="w-full text-[12px] bg-transparent text-white outline-none placeholder-zinc-600" />
            </td>
            <td className="border-r border-zinc-800 px-2 py-1.5">
                <select value={f.status} onChange={e => setF({ ...f, status: e.target.value })}
                    className="w-full text-[11px] bg-zinc-900 text-white border-none outline-none cursor-pointer rounded">
                    {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
            </td>
            <td className="border-r border-zinc-800" />
            <td className="text-center">
                <div className="flex items-center justify-center gap-1">
                    <button onClick={() => { if (f.companyName.trim()) onSave(f); }}
                        disabled={!f.companyName.trim()}
                        className="p-1 text-emerald-400 hover:text-emerald-300 disabled:opacity-30"><Save className="w-3.5 h-3.5" /></button>
                    <button onClick={onCancel} className="p-1 text-zinc-500 hover:text-zinc-300"><X className="w-3.5 h-3.5" /></button>
                </div>
            </td>
        </tr>
    );
}

/* ─── Main Dashboard ─── */
export default function ErgopackDashboard() {
    const router = useRouter();
    const [contacts, setContacts] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [adding, setAdding] = useState(false);
    const [saving, setSaving] = useState({});
    const [error, setError] = useState('');

    const fetchContacts = useCallback(async () => {
        try {
            const res = await fetch('/api/ergopack/contacts');
            const data = await res.json();
            if (data.contacts) setContacts(data.contacts);
            if (data.stats) setStats(data.stats);
        } catch { setError('Failed to load contacts'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchContacts(); }, [fetchContacts]);

    const createContact = async (form) => {
        try {
            const res = await fetch('/api/ergopack/contacts', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (res.ok) { setContacts(prev => [data.contact, ...prev]); setAdding(false); toast.success('Lead added'); }
            else setError(data.error);
        } catch { setError('Failed to create'); }
    };

    const updateContact = async (id, patch) => {
        setSaving(s => ({ ...s, [id]: true }));
        try {
            const res = await fetch('/api/ergopack/contacts', {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, ...patch }),
            });
            const data = await res.json();
            if (res.ok) setContacts(prev => prev.map(c => c.id === id ? { ...c, ...data.contact } : c));
            else setError(data.error);
        } catch { setError('Failed to update'); }
        finally { setSaving(s => ({ ...s, [id]: false })); }
    };

    // Filters + sort
    const visible = contacts
        .filter(c => {
            if (statusFilter !== 'all' && c.status !== statusFilter) return false;
            if (search) {
                const q = search.toLowerCase();
                return c.company_name?.toLowerCase().includes(q) || c.contact_person?.toLowerCase().includes(q) ||
                    c.city?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q);
            }
            return true;
        })
        .sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0));

    const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '';

    // Stats
    const wonCount = stats?.deal_done || 0;
    const lostCount = stats?.lost || 0;
    const closedDeals = wonCount + lostCount;
    const conversionRate = closedDeals > 0 ? Math.round((wonCount / closedDeals) * 100) : 0;

    if (loading) return <div className="flex items-center justify-center h-screen bg-[#0a0a0a]"><Loader2 className="w-8 h-8 animate-spin text-zinc-600" /></div>;

    return (
        <div className="h-screen flex flex-col bg-[#0a0a0a] text-white overflow-hidden">

            {/* ── Status Tabs ── */}
            <div className="flex items-center gap-1.5 px-4 py-2 border-b border-zinc-800/50 flex-shrink-0 overflow-x-auto">
                {[{ value: 'all', label: 'All', count: stats?.total || 0 }, ...STATUSES.map(s => ({ ...s, count: stats?.[s.value] || 0 }))].map(tab => (
                    <button key={tab.value} onClick={() => setStatusFilter(tab.value)}
                        className={cn(
                            'px-3 py-1 text-[11px] font-medium rounded-full transition-all whitespace-nowrap border',
                            statusFilter === tab.value
                                ? 'bg-white text-black border-white'
                                : tab.value === 'all'
                                    ? 'text-zinc-400 border-zinc-700 hover:border-zinc-500'
                                    : `${STATUS_COLORS[tab.value] || 'text-zinc-400 border-zinc-700'} hover:opacity-90`
                        )}>
                        {tab.label} ({tab.count})
                    </button>
                ))}
                <div className="flex-1" />
                <span className="text-[10px] text-zinc-600 whitespace-nowrap mr-1">Win Rate: <span className="text-emerald-400 font-semibold">{conversionRate}%</span></span>
            </div>

            {/* ── Toolbar ── */}
            <div className="flex items-center gap-3 px-4 py-2.5 border-b border-zinc-800/50 flex-shrink-0">
                <div className="flex-1 min-w-0">
                    <h1 className="text-sm font-semibold text-white tracking-tight">Ergopack Leads</h1>
                    <p className="text-[10px] text-zinc-600">{visible.length} contact{visible.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
                        className="pl-8 pr-3 py-1.5 text-xs border border-zinc-700 rounded-md bg-zinc-900/80 text-white w-40 focus:w-52 transition-all focus:outline-none focus:border-zinc-500 placeholder-zinc-600" />
                </div>
                <button onClick={() => setAdding(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-zinc-200 text-black text-[11px] font-semibold rounded-md transition-colors">
                    <Plus className="w-3.5 h-3.5" /> Add Lead
                </button>
                <button onClick={fetchContacts} className="p-1.5 text-zinc-500 hover:text-white rounded-md hover:bg-zinc-800 transition-colors">
                    <RefreshCw className="w-3.5 h-3.5" />
                </button>
            </div>

            {error && (
                <div className="flex items-center gap-2 px-4 py-1.5 bg-red-950/30 border-b border-red-800/30 text-xs text-red-400 flex-shrink-0">
                    <AlertCircle className="w-3.5 h-3.5" /> {error}
                    <button onClick={() => setError('')} className="ml-auto"><X className="w-3 h-3" /></button>
                </div>
            )}

            {/* ── Spreadsheet ── */}
            <div className="flex-1 overflow-auto">
                <table className="w-full border-collapse" style={{ minWidth: 860 }}>
                    <colgroup>
                        <col className="w-[26%]" />  {/* Company */}
                        <col className="w-[14%]" />  {/* Contact Person */}
                        <col className="w-[16%]" />  {/* Email */}
                        <col className="w-[12%]" />  {/* Phone */}
                        <col className="w-[9%]" />   {/* City */}
                        <col className="w-[9%]" />   {/* Status */}
                        <col className="w-[10%]" />  {/* Last Activity */}
                        <col className="w-[4%]" />   {/* Edit */}
                    </colgroup>
                    <thead className="sticky top-0 z-20">
                        <tr className="bg-zinc-900/95 backdrop-blur-sm">
                            {['COMPANY', 'CONTACT PERSON', 'EMAIL', 'PHONE', 'CITY', 'STATUS', 'LAST ACTIVITY', ''].map((h, i) => (
                                <th key={i} className={cn(
                                    'px-2.5 py-2 text-[9px] font-bold tracking-[0.1em] text-zinc-500 uppercase border-b border-zinc-700',
                                    i < 7 ? 'text-left border-r border-zinc-800/60' : 'text-center'
                                )}>{h}{i === 7 && <Pencil className="w-3 h-3 mx-auto text-zinc-600" />}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {adding && <AddRow onSave={createContact} onCancel={() => setAdding(false)} />}

                        {visible.length === 0 && !adding && (
                            <tr><td colSpan={8} className="py-20 text-center">
                                <div className="flex flex-col items-center gap-3 text-zinc-600">
                                    <Building2 className="w-10 h-10 opacity-20" />
                                    <p className="text-sm">{search ? 'No leads match your search' : 'No leads yet'}</p>
                                    {!search && <button onClick={() => setAdding(true)} className="text-xs text-blue-400 hover:text-blue-300">+ Add your first lead</button>}
                                </div>
                            </td></tr>
                        )}

                        {visible.map((c, idx) => (
                            <tr key={c.id}
                                className={cn(
                                    'group transition-colors hover:bg-zinc-800/40',
                                    idx % 2 === 1 && 'bg-zinc-900/20'
                                )}
                                style={{ opacity: saving[c.id] ? 0.5 : 1 }}>

                                {/* Company */}
                                <td className="border-b border-zinc-800/40 border-r border-r-zinc-800/60">
                                    <Cell value={c.company_name} onChange={v => updateContact(c.id, { companyName: v })} placeholder="Company..." />
                                </td>

                                {/* Contact Person */}
                                <td className="border-b border-zinc-800/40 border-r border-r-zinc-800/60">
                                    <Cell value={c.contact_person} onChange={v => updateContact(c.id, { contactPerson: v })} placeholder="Contact..." />
                                </td>

                                {/* Email */}
                                <td className="border-b border-zinc-800/40 border-r border-r-zinc-800/60">
                                    <Cell value={c.email} onChange={v => updateContact(c.id, { email: v })} placeholder="Email..." />
                                </td>

                                {/* Phone */}
                                <td className="border-b border-zinc-800/40 border-r border-r-zinc-800/60">
                                    <Cell value={c.phone} onChange={v => updateContact(c.id, { phone: v })} placeholder="Phone..." />
                                </td>

                                {/* City */}
                                <td className="border-b border-zinc-800/40 border-r border-r-zinc-800/60">
                                    <Cell value={c.city} onChange={v => updateContact(c.id, { city: v })} placeholder="City..." />
                                </td>

                                {/* Status */}
                                <td className="border-b border-zinc-800/40 border-r border-r-zinc-800/60 px-1.5">
                                    <select value={c.status || 'open'}
                                        onChange={e => updateContact(c.id, { status: e.target.value })}
                                        className={cn(
                                            'w-full bg-transparent text-[11px] px-1.5 py-1.5 rounded cursor-pointer focus:outline-none appearance-none',
                                            STATUS_COLORS[c.status] || 'text-zinc-400'
                                        )}>
                                        {STATUSES.map(s => <option key={s.value} value={s.value} className="bg-zinc-900 text-white">{s.label}</option>)}
                                    </select>
                                </td>

                                {/* Last Activity */}
                                <td className="border-b border-zinc-800/40 border-r border-r-zinc-800/60 px-2.5 py-2">
                                    {c.latest_activity ? (
                                        <div className="text-[10px] text-zinc-500" title={c.latest_activity.title}>
                                            <span className="text-zinc-400">{c.latest_activity.title?.substring(0, 22)}{c.latest_activity.title?.length > 22 ? '…' : ''}</span>
                                            <br /><span className="text-zinc-600">{fmtDate(c.latest_activity.created_at)}</span>
                                        </div>
                                    ) : <span className="text-[10px] text-zinc-700 px-1">—</span>}
                                </td>

                                {/* Edit → opens full detail page */}
                                <td className="border-b border-zinc-800/40 text-center">
                                    <Link href={`/ergopack/contacts/${c.id}`}
                                        className="inline-flex p-1.5 text-zinc-600 hover:text-white hover:bg-zinc-700 rounded transition-all"
                                        title="View / Edit details">
                                        <Pencil className="w-3.5 h-3.5" />
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
