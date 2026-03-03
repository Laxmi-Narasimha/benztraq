/**
 * Ergopack Dashboard - Spreadsheet View
 * 
 * Full-screen, Google Sheets–style inline-editable contact list.
 * Columns: Company, Contact Person, Phone, City, Status, Latest Activity, PDF, Quote, ✏️(edit)
 * Dark theme matching the Ergopack layout.
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
    Plus, Trash2, X, Loader2, Search, RefreshCw, Pencil, Download,
    FileText, AlertCircle, Building2, Clock, Phone, CheckCircle, XCircle,
    Ban, TrendingUp, ArrowUpDown, Save
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const STATUSES = [
    { value: 'open', label: 'Open', color: 'bg-blue-500/20 text-blue-400' },
    { value: 'contacted', label: 'Contacted', color: 'bg-indigo-500/20 text-indigo-400' },
    { value: 'proposal_sent', label: 'Proposal Sent', color: 'bg-amber-500/20 text-amber-400' },
    { value: 'deal_done', label: 'Won', color: 'bg-emerald-500/20 text-emerald-400' },
    { value: 'lost', label: 'Lost', color: 'bg-red-500/20 text-red-400' },
    { value: 'not_serviceable', label: 'Not Serviceable', color: 'bg-zinc-600/30 text-zinc-400' },
];

const STATUS_COLORS = Object.fromEntries(STATUSES.map(s => [s.value, s.color]));

// ============================================================
// Inline Editable Cell (dark theme)
// ============================================================
function EditableCell({ value, onChange, disabled, placeholder = '—', className = '' }) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(value || '');
    const ref = useRef(null);

    useEffect(() => { setDraft(value || ''); }, [value]);
    useEffect(() => { if (editing && ref.current) ref.current.focus(); }, [editing]);

    if (disabled) return <div className={`px-2 py-1.5 text-[12px] text-zinc-300 ${className}`}>{value || <span className="text-zinc-600">{placeholder}</span>}</div>;

    if (!editing) {
        return (
            <div className={`px-2 py-1.5 text-[12px] text-zinc-300 cursor-text hover:bg-zinc-800/60 min-h-[30px] ${className}`}
                onClick={() => setEditing(true)}>
                {value || <span className="text-zinc-600">{placeholder}</span>}
            </div>
        );
    }

    return (
        <input ref={ref} value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={() => { setEditing(false); if (draft.trim() !== (value || '')) onChange(draft.trim()); }}
            onKeyDown={e => { if (e.key === 'Enter') { e.target.blur(); } if (e.key === 'Escape') { setDraft(value || ''); setEditing(false); } }}
            className={`w-full px-2 py-1 text-[12px] bg-zinc-900 text-white border border-blue-500/50 rounded outline-none ${className}`}
            placeholder={placeholder} />
    );
}

// ============================================================
// Add Contact Row
// ============================================================
function AddRow({ onSave, onCancel }) {
    const [form, setForm] = useState({ companyName: '', contactPerson: '', phone: '', city: '', status: 'open' });
    const ref = useRef(null);
    useEffect(() => { ref.current?.focus(); }, []);

    return (
        <tr className="bg-emerald-950/20 border-b border-zinc-800">
            <td className="border border-zinc-700 px-2 py-1">
                <input ref={ref} value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })}
                    placeholder="Company name..." className="w-full text-[12px] bg-transparent text-white outline-none placeholder-zinc-600" />
            </td>
            <td className="border border-zinc-700 px-2 py-1">
                <input value={form.contactPerson} onChange={e => setForm({ ...form, contactPerson: e.target.value })}
                    placeholder="Contact person..." className="w-full text-[12px] bg-transparent text-white outline-none placeholder-zinc-600" />
            </td>
            <td className="border border-zinc-700 px-2 py-1">
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                    placeholder="Phone..." className="w-full text-[12px] bg-transparent text-white outline-none placeholder-zinc-600" />
            </td>
            <td className="border border-zinc-700 px-2 py-1">
                <input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })}
                    placeholder="City..." className="w-full text-[12px] bg-transparent text-white outline-none placeholder-zinc-600" />
            </td>
            <td className="border border-zinc-700 px-2 py-1">
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                    className="w-full text-[11px] bg-zinc-900 text-white border-none outline-none cursor-pointer">
                    {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
            </td>
            <td className="border border-zinc-700"></td>
            <td className="border border-zinc-700"></td>
            <td className="border border-zinc-700"></td>
            <td className="border border-zinc-700 text-center">
                <div className="flex items-center justify-center gap-1">
                    <button onClick={() => { if (form.companyName.trim()) onSave(form); }}
                        disabled={!form.companyName.trim()}
                        className="p-1 text-emerald-400 hover:text-emerald-300 disabled:opacity-30">
                        <Save className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={onCancel} className="p-1 text-zinc-500 hover:text-zinc-300">
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            </td>
        </tr>
    );
}

// ============================================================
// Detail Edit Panel (Slide-over for extra fields)
// ============================================================
function DetailPanel({ contact, onClose, onSave }) {
    const [form, setForm] = useState({
        email: contact.email || '',
        phone: contact.phone || '',
        website: contact.website || '',
        city: contact.city || '',
        state: contact.state || '',
        industry: contact.industry || '',
        companySize: contact.company_size || '',
        source: contact.source || '',
        notes: contact.notes || '',
        priority: contact.priority || 'medium',
    });
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        await onSave(contact.id, form);
        setSaving(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="w-full max-w-md bg-zinc-950 border-l border-zinc-800 h-full overflow-y-auto animate-slide-in-right" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
                    <div>
                        <h3 className="text-sm font-medium text-white">{contact.company_name}</h3>
                        <p className="text-[10px] text-zinc-500">{contact.contact_person || 'No contact person'}</p>
                    </div>
                    <button onClick={onClose} className="p-1 text-zinc-500 hover:text-white rounded hover:bg-zinc-800"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-5 space-y-4">
                    {[
                        { key: 'email', label: 'Email', type: 'email' },
                        { key: 'phone', label: 'Phone', type: 'tel' },
                        { key: 'website', label: 'Website', type: 'url' },
                        { key: 'city', label: 'City' },
                        { key: 'state', label: 'State' },
                        { key: 'industry', label: 'Industry' },
                        { key: 'companySize', label: 'Company Size' },
                        { key: 'source', label: 'Source' },
                    ].map(f => (
                        <div key={f.key}>
                            <label className="block text-[10px] text-zinc-500 uppercase tracking-widest mb-1">{f.label}</label>
                            <input value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                                type={f.type || 'text'}
                                className="w-full px-3 py-2 text-sm bg-zinc-900 border border-zinc-800 rounded text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50" />
                        </div>
                    ))}
                    <div>
                        <label className="block text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Priority</label>
                        <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}
                            className="w-full px-3 py-2 text-sm bg-zinc-900 border border-zinc-800 rounded text-white focus:outline-none focus:border-blue-500/50">
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Notes</label>
                        <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={4}
                            className="w-full px-3 py-2 text-sm bg-zinc-900 border border-zinc-800 rounded text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 resize-none" />
                    </div>
                    <button onClick={handleSave} disabled={saving}
                        className="w-full py-2.5 bg-white text-black font-medium text-sm rounded hover:bg-zinc-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {saving ? 'Saving...' : 'Save Details'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================================
// Main Dashboard
// ============================================================
export default function ErgopackDashboard() {
    const [contacts, setContacts] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [adding, setAdding] = useState(false);
    const [saving, setSaving] = useState({});
    const [editContact, setEditContact] = useState(null);
    const [error, setError] = useState('');
    const [sortBy, setSortBy] = useState('recent'); // recent, company, status

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
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (res.ok) {
                setContacts(prev => [data.contact, ...prev]);
                setAdding(false);
                toast.success('Lead added');
            } else { setError(data.error); }
        } catch { setError('Failed to create'); }
    };

    const updateContact = async (id, patch) => {
        setSaving(s => ({ ...s, [id]: true }));
        try {
            const res = await fetch('/api/ergopack/contacts', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, ...patch }),
            });
            const data = await res.json();
            if (res.ok) {
                setContacts(prev => prev.map(c => c.id === id ? { ...c, ...data.contact } : c));
            } else { setError(data.error); }
        } catch { setError('Failed to update'); }
        finally { setSaving(s => ({ ...s, [id]: false })); }
    };

    const deleteContact = async (id) => {
        if (!confirm('Delete this lead permanently?')) return;
        try {
            const res = await fetch(`/api/ergopack/contacts?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                setContacts(prev => prev.filter(c => c.id !== id));
                toast.success('Lead deleted');
            }
        } catch { setError('Failed to delete'); }
    };

    // Filters
    const visible = contacts
        .filter(c => {
            if (statusFilter !== 'all' && c.status !== statusFilter) return false;
            if (search) {
                const q = search.toLowerCase();
                return c.company_name?.toLowerCase().includes(q) ||
                    c.contact_person?.toLowerCase().includes(q) ||
                    c.city?.toLowerCase().includes(q) ||
                    c.email?.toLowerCase().includes(q);
            }
            return true;
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'company': return (a.company_name || '').localeCompare(b.company_name || '');
                case 'status': return (a.status || '').localeCompare(b.status || '');
                default: return new Date(b.updated_at || 0) - new Date(a.updated_at || 0);
            }
        });

    const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—';

    // Stats
    const wonCount = stats?.deal_done || 0;
    const lostCount = stats?.lost || 0;
    const closedDeals = wonCount + lostCount;
    const conversionRate = closedDeals > 0 ? Math.round((wonCount / closedDeals) * 100) : 0;

    if (loading) return <div className="flex items-center justify-center h-screen bg-[#050505]"><Loader2 className="w-8 h-8 animate-spin text-zinc-600" /></div>;

    return (
        <>
            <style jsx global>{`
                @keyframes slide-in-right { from { transform: translateX(100%); } to { transform: translateX(0); } }
                .animate-slide-in-right { animation: slide-in-right 0.25s ease-out; }
            `}</style>

            <div className="h-screen flex flex-col bg-[#050505] text-white overflow-hidden">
                {/* Stats Bar */}
                <div className="flex items-center gap-1 px-3 py-2 border-b border-zinc-800/60 flex-shrink-0 bg-zinc-950/60 overflow-x-auto">
                    <button onClick={() => setStatusFilter('all')}
                        className={`px-2.5 py-1 text-[10px] font-medium rounded-full transition-colors whitespace-nowrap ${statusFilter === 'all' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}>
                        All ({stats?.total || 0})
                    </button>
                    {STATUSES.map(s => (
                        <button key={s.value} onClick={() => setStatusFilter(s.value)}
                            className={`px-2.5 py-1 text-[10px] font-medium rounded-full transition-colors whitespace-nowrap ${statusFilter === s.value ? 'bg-white text-black' : `${s.color} hover:opacity-80`}`}>
                            {s.label} ({stats?.[s.value] || 0})
                        </button>
                    ))}
                    <div className="flex-1" />
                    <span className="text-[10px] text-zinc-600 whitespace-nowrap">Win Rate: <span className="text-emerald-400 font-medium">{conversionRate}%</span></span>
                </div>

                {/* Toolbar */}
                <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-800/60 flex-shrink-0 bg-zinc-950/60">
                    <div className="flex-1 min-w-0">
                        <h1 className="text-[14px] font-medium text-white tracking-tight">Ergopack Leads</h1>
                        <p className="text-[10px] text-zinc-600">{visible.length} contact{visible.length !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-600" />
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
                                className="pl-7 pr-2 py-1 text-xs border border-zinc-700 rounded bg-zinc-900 text-white w-28 sm:w-36 focus:w-44 transition-all focus:outline-none focus:border-blue-500/50 placeholder-zinc-600" />
                        </div>
                        <button onClick={() => setAdding(true)}
                            className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-zinc-200 text-black text-[11px] font-semibold rounded shadow-sm transition-colors">
                            <Plus className="w-3 h-3" /> Add Lead
                        </button>
                        <button onClick={fetchContacts}
                            className="p-1 text-zinc-500 hover:text-white rounded hover:bg-zinc-800 transition-colors">
                            <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="flex items-center gap-2 px-4 py-1.5 bg-red-950/30 border-b border-red-800/30 text-xs text-red-400 flex-shrink-0">
                        <AlertCircle className="w-3.5 h-3.5" /> {error}
                        <button onClick={() => setError('')} className="ml-auto"><X className="w-3 h-3" /></button>
                    </div>
                )}

                {/* Spreadsheet */}
                <div className="flex-1 overflow-auto">
                    <table className="w-full border-collapse" style={{ minWidth: 900 }}>
                        <colgroup>
                            <col style={{ minWidth: 220 }} />
                            <col style={{ width: 150 }} />
                            <col style={{ width: 120 }} />
                            <col style={{ width: 110 }} />
                            <col style={{ width: 110 }} />
                            <col style={{ width: 100 }} />
                            <col style={{ width: 50 }} />
                            <col style={{ width: 50 }} />
                            <col style={{ width: 50 }} />
                        </colgroup>
                        <thead className="sticky top-0 z-20">
                            <tr>
                                <th className="border border-zinc-700 px-2 py-1.5 text-[9px] font-bold tracking-widest text-left bg-zinc-900 text-zinc-400 uppercase">Company</th>
                                <th className="border border-zinc-700 px-2 py-1.5 text-[9px] font-bold tracking-widest text-left bg-zinc-900 text-zinc-400 uppercase">Contact Person</th>
                                <th className="border border-zinc-700 px-2 py-1.5 text-[9px] font-bold tracking-widest text-left bg-zinc-900 text-zinc-400 uppercase">Phone</th>
                                <th className="border border-zinc-700 px-2 py-1.5 text-[9px] font-bold tracking-widest text-left bg-zinc-900 text-zinc-400 uppercase">City</th>
                                <th className="border border-zinc-700 px-2 py-1.5 text-[9px] font-bold tracking-widest text-left bg-zinc-900 text-zinc-400 uppercase">Status</th>
                                <th className="border border-zinc-700 px-2 py-1.5 text-[9px] font-bold tracking-widest text-left bg-zinc-900 text-zinc-400 uppercase">Last Activity</th>
                                <th className="border border-zinc-700 px-1 py-1.5 text-[9px] font-bold text-center bg-zinc-900 text-red-500/60">PDF</th>
                                <th className="border border-zinc-700 px-1 py-1.5 text-[9px] font-bold text-center bg-zinc-900 text-blue-500/60">QT</th>
                                <th className="border border-zinc-700 bg-zinc-900 px-1 py-1.5 text-center text-zinc-500">✏️</th>
                            </tr>
                        </thead>
                        <tbody>
                            {adding && <AddRow onSave={createContact} onCancel={() => setAdding(false)} />}
                            {visible.length === 0 && !adding && (
                                <tr><td colSpan={9} className="py-16 text-center">
                                    <div className="flex flex-col items-center gap-2 text-zinc-600">
                                        <Building2 className="w-8 h-8 opacity-30" />
                                        <p className="text-sm">{search ? 'No leads match your search' : 'No leads yet. Click "Add Lead" to start.'}</p>
                                    </div>
                                </td></tr>
                            )}
                            {visible.map((c, idx) => (
                                <tr key={c.id} className="group transition-colors hover:bg-zinc-800/30"
                                    style={{ opacity: saving[c.id] ? 0.5 : 1, background: idx % 2 === 0 ? 'transparent' : 'rgba(24,24,27,0.3)' }}>
                                    {/* Company */}
                                    <td className="border border-zinc-800">
                                        <EditableCell value={c.company_name} onChange={v => updateContact(c.id, { companyName: v })} placeholder="Company..." />
                                    </td>
                                    {/* Contact Person */}
                                    <td className="border border-zinc-800">
                                        <EditableCell value={c.contact_person} onChange={v => updateContact(c.id, { contactPerson: v })} placeholder="Contact..." />
                                    </td>
                                    {/* Phone */}
                                    <td className="border border-zinc-800">
                                        <EditableCell value={c.phone} onChange={v => updateContact(c.id, { phone: v })} placeholder="Phone..." />
                                    </td>
                                    {/* City */}
                                    <td className="border border-zinc-800">
                                        <EditableCell value={c.city} onChange={v => updateContact(c.id, { city: v })} placeholder="City..." />
                                    </td>
                                    {/* Status */}
                                    <td className="border border-zinc-800 px-1">
                                        <select value={c.status || 'open'} onChange={e => updateContact(c.id, { status: e.target.value })}
                                            className={`w-full bg-transparent text-[11px] px-1 py-1.5 rounded cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500/50 ${STATUS_COLORS[c.status] || 'text-zinc-400'}`}>
                                            {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                        </select>
                                    </td>
                                    {/* Latest Activity */}
                                    <td className="border border-zinc-800 px-2 py-1.5 text-[10px] text-zinc-500 whitespace-nowrap">
                                        {c.latest_activity ? (
                                            <span title={c.latest_activity.title}>
                                                {c.latest_activity.title?.substring(0, 20)}{c.latest_activity.title?.length > 20 ? '...' : ''}
                                                <br /><span className="text-zinc-600">{fmtDate(c.latest_activity.created_at)}</span>
                                            </span>
                                        ) : <span className="text-zinc-700">—</span>}
                                    </td>
                                    {/* PDF */}
                                    <td className="border border-zinc-800 text-center">
                                        {c.presentation_file_path ? (
                                            <button onClick={async () => {
                                                try {
                                                    const res = await fetch(`/api/ergopack/presentations?contactId=${c.id}`);
                                                    const data = await res.json();
                                                    if (data.url) window.open(data.url, '_blank');
                                                } catch { toast.error('Error loading PDF'); }
                                            }}
                                                className="p-1 text-red-500/60 hover:text-red-400 transition-colors">
                                                <FileText className="w-3.5 h-3.5" />
                                            </button>
                                        ) : <span className="text-zinc-800">—</span>}
                                    </td>
                                    {/* Quote */}
                                    <td className="border border-zinc-800 text-center">
                                        {c.quotation_file_path ? (
                                            <button onClick={async () => {
                                                try {
                                                    const res = await fetch(`/api/ergopack/quotations?contactId=${c.id}`);
                                                    const data = await res.json();
                                                    if (data.url) window.open(data.url, '_blank');
                                                } catch { toast.error('Error loading Quote'); }
                                            }}
                                                className="p-1 text-blue-500/60 hover:text-blue-400 transition-colors">
                                                <Download className="w-3.5 h-3.5" />
                                            </button>
                                        ) : <span className="text-zinc-800">—</span>}
                                    </td>
                                    {/* Edit / Delete */}
                                    <td className="border border-zinc-800 text-center">
                                        <div className="flex items-center justify-center">
                                            <button onClick={() => setEditContact(c)}
                                                className="p-1 text-zinc-600 hover:text-white hover:bg-zinc-800 rounded transition-all" title="Edit details">
                                                <Pencil className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detail edit panel */}
            {editContact && (
                <DetailPanel contact={editContact} onClose={() => setEditContact(null)}
                    onSave={async (id, patch) => { await updateContact(id, patch); setEditContact(null); }} />
            )}
        </>
    );
}
