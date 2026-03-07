'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
    LayoutGrid,
    Table2,
    Search,
    Plus,
    Pencil,
    Phone,
    Mail,
    MapPin,
    Building2,
    Package,
    Globe,
    Clock,
    TrendingUp,
    CheckCircle2,
    Send,
    FlaskConical,
    PauseCircle,
    XCircle,
    MessageSquare,
    ChevronRight,
    X,
    Filter,
    Users,
    Activity,
    BarChart3,
    RefreshCw,
    Save,
    FileText,
    Star,
    ArrowUpRight,
    PhoneCall,
    MailPlus,
    CalendarClock,
    Sparkles,
    Loader2,
} from 'lucide-react';

// ============================================================================
// CONSTANTS
// ============================================================================
const STATUS_CONFIG = {
    'In Discussion': { color: '#22c55e', bg: '#dcfce7', text: '#166534', icon: MessageSquare },
    'Quote Sent': { color: '#3b82f6', bg: '#dbeafe', text: '#1e40af', icon: Send },
    'Sample Sent': { color: '#f97316', bg: '#fed7aa', text: '#9a3412', icon: FlaskConical },
    'VRF': { color: '#8b5cf6', bg: '#ede9fe', text: '#5b21b6', icon: CheckCircle2 },
    'Order Received': { color: '#10b981', bg: '#d1fae5', text: '#065f46', icon: TrendingUp },
    'Hold': { color: '#eab308', bg: '#fef9c3', text: '#854d0e', icon: PauseCircle },
    'Closed': { color: '#ef4444', bg: '#fee2e2', text: '#991b1b', icon: XCircle },
    'Following Up': { color: '#06b6d4', bg: '#cffafe', text: '#155e75', icon: Clock },
};

const EDITABLE_COLUMNS = [
    { key: 'company', label: 'Company', width: '200px' },
    { key: 'contact_name', label: 'Contact', width: '150px' },
    { key: 'product', label: 'Product', width: '200px' },
    { key: 'phone', label: 'Phone', width: '140px' },
    { key: 'email', label: 'Email', width: '200px' },
    { key: 'location', label: 'Location', width: '130px' },
    { key: 'country', label: 'Country', width: '100px' },
    { key: 'status', label: 'Status', width: '130px' },
    { key: 'remarks', label: 'Remarks', width: '300px' },
];

// ============================================================================
// STATUS BADGE
// ============================================================================
function StatusBadge({ status, size = 'sm' }) {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG['In Discussion'];
    const sizeClass = size === 'lg' ? 'px-3 py-1.5 text-sm' : 'px-2 py-0.5 text-xs';
    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full font-semibold ${sizeClass}`}
            style={{ backgroundColor: config.bg, color: config.text }}
        >
            {size === 'lg' && <config.icon className="w-3.5 h-3.5" />}
            {status}
        </span>
    );
}

// ============================================================================
// SHEET VIEW
// ============================================================================
function SheetView({ leads, tabs, activeTab, setActiveTab, onCellEdit, onOpenDetail, onAddLead }) {
    const [editingCell, setEditingCell] = useState(null);
    const [editValue, setEditValue] = useState('');
    const inputRef = useRef(null);

    const filteredLeads = activeTab === 'All'
        ? leads
        : leads.filter(l => l.source_tab === activeTab);

    const startEdit = (leadId, field, currentValue) => {
        setEditingCell({ leadId, field });
        setEditValue(currentValue || '');
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    const saveEdit = () => {
        if (!editingCell) return;
        const lead = leads.find(l => l.id === editingCell.leadId);
        if (lead && lead[editingCell.field] !== editValue) {
            onCellEdit(editingCell.leadId, editingCell.field, editValue, lead[editingCell.field]);
        }
        setEditingCell(null);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') saveEdit();
        if (e.key === 'Escape') setEditingCell(null);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Tab Bar */}
            <div className="flex items-center gap-1 px-4 pt-3 pb-0 overflow-x-auto border-b border-gray-200 bg-white shrink-0">
                <button
                    onClick={() => setActiveTab('All')}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${activeTab === 'All'
                            ? 'bg-gray-900 text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                >
                    All ({leads.length})
                </button>
                {tabs.map(tab => {
                    const tabCount = leads.filter(l => l.source_tab === tab).length;
                    return (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${activeTab === tab
                                    ? 'bg-gray-900 text-white'
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            {tab} ({tabCount})
                        </button>
                    );
                })}
            </div>

            {/* Spreadsheet Grid */}
            <div className="flex-1 overflow-auto bg-white">
                <table className="w-full border-collapse min-w-[1400px]">
                    <thead className="sticky top-0 z-10">
                        <tr className="bg-gray-800 text-white">
                            <th className="px-3 py-2.5 text-xs font-semibold text-left w-[50px] border-r border-gray-700">#</th>
                            {EDITABLE_COLUMNS.map(col => (
                                <th
                                    key={col.key}
                                    className="px-3 py-2.5 text-xs font-semibold text-left border-r border-gray-700"
                                    style={{ minWidth: col.width }}
                                >
                                    {col.label}
                                </th>
                            ))}
                            <th className="px-3 py-2.5 text-xs font-semibold text-center w-[50px]">⋯</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredLeads.map((lead, idx) => {
                            const statusConfig = STATUS_CONFIG[lead.status] || {};
                            return (
                                <tr
                                    key={lead.id}
                                    className="border-b border-gray-100 hover:bg-blue-50/40 transition-colors group"
                                    style={{
                                        borderLeft: `4px solid ${statusConfig.color || '#e5e7eb'}`,
                                    }}
                                >
                                    <td className="px-3 py-2 text-xs text-gray-400 border-r border-gray-100">
                                        {idx + 1}
                                    </td>
                                    {EDITABLE_COLUMNS.map(col => {
                                        const isEditing = editingCell?.leadId === lead.id && editingCell?.field === col.key;
                                        const value = lead[col.key] || '';

                                        if (col.key === 'status') {
                                            return (
                                                <td key={col.key} className="px-2 py-1.5 border-r border-gray-100">
                                                    {isEditing ? (
                                                        <select
                                                            ref={inputRef}
                                                            value={editValue}
                                                            onChange={(e) => setEditValue(e.target.value)}
                                                            onBlur={saveEdit}
                                                            className="w-full px-2 py-1 text-xs border rounded bg-white focus:ring-2 focus:ring-blue-400"
                                                        >
                                                            {Object.keys(STATUS_CONFIG).map(s => (
                                                                <option key={s} value={s}>{s}</option>
                                                            ))}
                                                        </select>
                                                    ) : (
                                                        <div
                                                            className="cursor-pointer"
                                                            onClick={() => startEdit(lead.id, col.key, value)}
                                                        >
                                                            <StatusBadge status={value} />
                                                        </div>
                                                    )}
                                                </td>
                                            );
                                        }

                                        return (
                                            <td key={col.key} className="px-2 py-1.5 border-r border-gray-100">
                                                {isEditing ? (
                                                    col.key === 'remarks' ? (
                                                        <textarea
                                                            ref={inputRef}
                                                            value={editValue}
                                                            onChange={(e) => setEditValue(e.target.value)}
                                                            onBlur={saveEdit}
                                                            onKeyDown={handleKeyDown}
                                                            className="w-full px-2 py-1 text-xs border rounded resize-none focus:ring-2 focus:ring-blue-400"
                                                            rows={2}
                                                        />
                                                    ) : (
                                                        <input
                                                            ref={inputRef}
                                                            type="text"
                                                            value={editValue}
                                                            onChange={(e) => setEditValue(e.target.value)}
                                                            onBlur={saveEdit}
                                                            onKeyDown={handleKeyDown}
                                                            className="w-full px-2 py-1 text-xs border rounded focus:ring-2 focus:ring-blue-400"
                                                        />
                                                    )
                                                ) : (
                                                    <div
                                                        className="text-xs text-gray-700 cursor-text min-h-[24px] flex items-center hover:bg-blue-50 rounded px-1 -mx-1 transition-colors"
                                                        onClick={() => startEdit(lead.id, col.key, value)}
                                                        title={value}
                                                    >
                                                        <span className={`${col.key === 'remarks' ? 'line-clamp-2' : 'truncate'}`}>
                                                            {value || <span className="text-gray-300 italic">—</span>}
                                                        </span>
                                                    </div>
                                                )}
                                            </td>
                                        );
                                    })}
                                    <td className="px-2 py-1.5 text-center">
                                        <button
                                            onClick={() => onOpenDetail(lead)}
                                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all opacity-0 group-hover:opacity-100"
                                            title="View Details"
                                        >
                                            <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}

                        {/* Add Row */}
                        <tr className="border-b border-dashed border-gray-200 hover:bg-green-50/40 transition-colors cursor-pointer"
                            onClick={() => onAddLead(activeTab === 'All' ? tabs[0] : activeTab)}
                        >
                            <td colSpan={EDITABLE_COLUMNS.length + 2} className="px-4 py-3">
                                <div className="flex items-center gap-2 text-gray-400 text-xs">
                                    <Plus className="w-4 h-4" />
                                    <span>Add new lead...</span>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ============================================================================
// WORKSPACE VIEW
// ============================================================================
function WorkspaceView({ leads, statusCounts, onOpenDetail, searchQuery }) {
    const [statusFilter, setStatusFilter] = useState('all');

    const filtered = statusFilter === 'all'
        ? leads
        : leads.filter(l => l.status === statusFilter);

    const totalLeads = leads.length;
    const conversionRate = totalLeads > 0
        ? Math.round((statusCounts['Order Received'] || 0) / totalLeads * 100)
        : 0;

    return (
        <div className="p-6 space-y-6 overflow-auto">
            {/* KPI Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {[
                    { label: 'Total Leads', value: totalLeads, icon: Users, gradient: 'from-slate-700 to-slate-900' },
                    { label: 'In Discussion', value: statusCounts['In Discussion'] || 0, icon: MessageSquare, gradient: 'from-green-500 to-emerald-700' },
                    { label: 'Quote Sent', value: statusCounts['Quote Sent'] || 0, icon: Send, gradient: 'from-blue-500 to-indigo-700' },
                    { label: 'Sample Sent', value: statusCounts['Sample Sent'] || 0, icon: FlaskConical, gradient: 'from-orange-500 to-red-600' },
                    { label: 'Order Won', value: statusCounts['Order Received'] || 0, icon: TrendingUp, gradient: 'from-emerald-500 to-green-700' },
                    { label: 'Conversion', value: `${conversionRate}%`, icon: BarChart3, gradient: 'from-violet-500 to-purple-700' },
                ].map((kpi, i) => (
                    <div
                        key={i}
                        className={`bg-gradient-to-br ${kpi.gradient} rounded-2xl p-4 text-white shadow-lg hover:shadow-xl transition-shadow`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <kpi.icon className="w-5 h-5 opacity-80" />
                            <Sparkles className="w-3 h-3 opacity-40" />
                        </div>
                        <div className="text-2xl font-bold">{kpi.value}</div>
                        <div className="text-xs opacity-80 mt-1">{kpi.label}</div>
                    </div>
                ))}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 flex-wrap">
                <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${statusFilter === 'all'
                            ? 'bg-gray-900 text-white shadow-md'
                            : 'bg-white text-gray-600 border hover:bg-gray-50'
                        }`}
                >
                    All ({leads.length})
                </button>
                {Object.entries(STATUS_CONFIG).map(([status, config]) => {
                    const count = statusCounts[status] || 0;
                    if (count === 0) return null;
                    return (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${statusFilter === status
                                    ? 'shadow-md'
                                    : 'border hover:shadow-sm'
                                }`}
                            style={{
                                backgroundColor: statusFilter === status ? config.color : config.bg,
                                color: statusFilter === status ? 'white' : config.text,
                                borderColor: config.color + '40',
                            }}
                        >
                            <config.icon className="w-3.5 h-3.5" />
                            {status} ({count})
                        </button>
                    );
                })}
            </div>

            {/* Lead Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map(lead => {
                    const config = STATUS_CONFIG[lead.status] || STATUS_CONFIG['In Discussion'];
                    return (
                        <div
                            key={lead.id}
                            onClick={() => onOpenDetail(lead)}
                            className="bg-white rounded-2xl border border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group overflow-hidden"
                            style={{ borderLeft: `4px solid ${config.color}` }}
                        >
                            {/* Card Header */}
                            <div className="p-4 pb-3">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-gray-900 text-sm truncate group-hover:text-blue-600 transition-colors">
                                            {lead.company}
                                        </h3>
                                        {lead.contact_name && (
                                            <p className="text-xs text-gray-500 mt-0.5 truncate">{lead.contact_name}</p>
                                        )}
                                    </div>
                                    <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors shrink-0 ml-2" />
                                </div>

                                {/* Product */}
                                {lead.product && (
                                    <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-2">
                                        <Package className="w-3 h-3 text-gray-400" />
                                        <span className="truncate">{lead.product}</span>
                                    </div>
                                )}

                                {/* Location & Country */}
                                <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                                    {lead.location && (
                                        <div className="flex items-center gap-1">
                                            <MapPin className="w-3 h-3" />
                                            <span className="truncate">{lead.location}</span>
                                        </div>
                                    )}
                                    {lead.country && lead.country !== 'Domestic' && (
                                        <div className="flex items-center gap-1">
                                            <Globe className="w-3 h-3" />
                                            <span>{lead.country}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Status Badge */}
                                <StatusBadge status={lead.status} size="lg" />
                            </div>

                            {/* Card Footer */}
                            <div className="px-4 py-2.5 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-[10px] text-white font-bold">
                                        {(lead.assigned_to_name || 'U')[0]}
                                    </div>
                                    <span className="text-xs text-gray-500 truncate max-w-[80px]">
                                        {lead.assigned_to_name || lead.source_tab}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-gray-400">
                                    <Clock className="w-3 h-3" />
                                    {lead.updated_at
                                        ? new Date(lead.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                                        : '—'}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {filtered.length === 0 && (
                <div className="text-center py-16 text-gray-400">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No leads found for this filter</p>
                </div>
            )}
        </div>
    );
}

// ============================================================================
// DETAIL PANEL (Slide-in)
// ============================================================================
function DetailPanel({ lead, onClose, onSaveActivity, onUpdateLead }) {
    const [activities, setActivities] = useState([]);
    const [loadingActivities, setLoadingActivities] = useState(true);
    const [newNote, setNewNote] = useState('');
    const [noteType, setNoteType] = useState('note');
    const [saving, setSaving] = useState(false);
    const [activeSection, setActiveSection] = useState('timeline');

    useEffect(() => {
        if (lead?.id) {
            fetchActivities();
        }
    }, [lead?.id]);

    const fetchActivities = async () => {
        setLoadingActivities(true);
        try {
            const res = await fetch(`/api/crm-leads/${lead.id}/activities`);
            const data = await res.json();
            if (data.success) setActivities(data.data);
        } catch (err) {
            console.error('Error fetching activities:', err);
        } finally {
            setLoadingActivities(false);
        }
    };

    const handleSaveNote = async () => {
        if (!newNote.trim()) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/crm-leads/${lead.id}/activities`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: newNote,
                    activity_type: noteType,
                }),
            });
            const data = await res.json();
            if (data.success) {
                setNewNote('');
                fetchActivities();
                if (onSaveActivity) onSaveActivity();
            }
        } catch (err) {
            console.error('Error saving note:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleStatusChange = async (newStatus) => {
        try {
            const res = await fetch(`/api/crm-leads/${lead.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            if (res.ok) {
                lead.status = newStatus;
                fetchActivities();
                if (onUpdateLead) onUpdateLead();
            }
        } catch (err) {
            console.error('Error updating status:', err);
        }
    };

    if (!lead) return null;

    const config = STATUS_CONFIG[lead.status] || STATUS_CONFIG['In Discussion'];
    const activityIcons = {
        note: FileText,
        call: PhoneCall,
        email: MailPlus,
        meeting: CalendarClock,
        status_change: RefreshCw,
        edit: Pencil,
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            {/* Panel */}
            <div className="relative w-full max-w-lg bg-white shadow-2xl flex flex-col animate-slide-in-right">
                {/* Header */}
                <div
                    className="p-5 text-white shrink-0"
                    style={{ background: `linear-gradient(135deg, ${config.color}, ${config.color}cc)` }}
                >
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 mr-3">
                            <h2 className="text-lg font-bold">{lead.company}</h2>
                            {lead.contact_name && (
                                <p className="text-sm opacity-90 mt-0.5">{lead.contact_name}</p>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-full hover:bg-white/20 transition"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {lead.product && (
                        <div className="flex items-center gap-1.5 text-sm opacity-90 mb-2">
                            <Package className="w-4 h-4" />
                            {lead.product}
                        </div>
                    )}

                    <div className="flex items-center gap-3 text-sm opacity-80">
                        {lead.location && (
                            <div className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5" />
                                {lead.location}
                            </div>
                        )}
                        {lead.country && (
                            <div className="flex items-center gap-1">
                                <Globe className="w-3.5 h-3.5" />
                                {lead.country}
                            </div>
                        )}
                    </div>
                </div>

                {/* Contact Bar */}
                <div className="flex items-center gap-2 px-5 py-3 border-b bg-gray-50 shrink-0">
                    {lead.phone && (
                        <a
                            href={`tel:${lead.phone}`}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-medium hover:bg-green-100 transition"
                        >
                            <Phone className="w-3.5 h-3.5" />
                            {lead.phone}
                        </a>
                    )}
                    {lead.email && (
                        <a
                            href={`mailto:${lead.email}`}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium hover:bg-blue-100 transition truncate"
                        >
                            <Mail className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{lead.email}</span>
                        </a>
                    )}
                    {!lead.phone && !lead.email && (
                        <span className="text-xs text-gray-400 italic">No contact details</span>
                    )}
                </div>

                {/* Status Change */}
                <div className="px-5 py-3 border-b shrink-0">
                    <label className="text-xs font-medium text-gray-500 mb-1.5 block">Status</label>
                    <div className="flex flex-wrap gap-1.5">
                        {Object.entries(STATUS_CONFIG).map(([status, cfg]) => (
                            <button
                                key={status}
                                onClick={() => handleStatusChange(status)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${lead.status === status
                                        ? 'ring-2 ring-offset-1 shadow-sm'
                                        : 'opacity-60 hover:opacity-100'
                                    }`}
                                style={{
                                    backgroundColor: cfg.bg,
                                    color: cfg.text,
                                    ringColor: cfg.color,
                                }}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Section Tabs */}
                <div className="flex items-center gap-0 px-5 pt-3 border-b shrink-0">
                    {['timeline', 'details'].map(section => (
                        <button
                            key={section}
                            onClick={() => setActiveSection(section)}
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${activeSection === section
                                    ? 'border-gray-900 text-gray-900'
                                    : 'border-transparent text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            {section}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto">
                    {activeSection === 'timeline' && (
                        <div className="p-5 space-y-4">
                            {/* Add Note */}
                            <div className="bg-gray-50 rounded-xl p-4 border">
                                <div className="flex items-center gap-2 mb-2">
                                    {[
                                        { type: 'note', icon: FileText, label: 'Note' },
                                        { type: 'call', icon: PhoneCall, label: 'Call' },
                                        { type: 'email', icon: MailPlus, label: 'Email' },
                                        { type: 'meeting', icon: CalendarClock, label: 'Meeting' },
                                    ].map(t => (
                                        <button
                                            key={t.type}
                                            onClick={() => setNoteType(t.type)}
                                            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition ${noteType === t.type
                                                    ? 'bg-gray-900 text-white'
                                                    : 'text-gray-500 hover:bg-gray-200'
                                                }`}
                                        >
                                            <t.icon className="w-3 h-3" />
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                                <textarea
                                    value={newNote}
                                    onChange={(e) => setNewNote(e.target.value)}
                                    placeholder="Add a note, log a call, or record an activity..."
                                    className="w-full px-3 py-2 text-sm border rounded-lg resize-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-white"
                                    rows={3}
                                />
                                <div className="flex justify-end mt-2">
                                    <button
                                        onClick={handleSaveNote}
                                        disabled={!newNote.trim() || saving}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white rounded-lg text-xs font-medium hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
                                    >
                                        {saving ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                            <Save className="w-3.5 h-3.5" />
                                        )}
                                        Save
                                    </button>
                                </div>
                            </div>

                            {/* Timeline */}
                            {loadingActivities ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                                </div>
                            ) : activities.length === 0 ? (
                                <div className="text-center py-8 text-gray-400 text-sm">
                                    <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                    No activities yet
                                </div>
                            ) : (
                                <div className="space-y-0 relative">
                                    <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200" />
                                    {activities.map((act) => {
                                        const Icon = activityIcons[act.activity_type] || FileText;
                                        const isEdit = act.activity_type === 'edit' || act.activity_type === 'status_change';
                                        return (
                                            <div key={act.id} className="relative pl-10 pb-4">
                                                <div className={`absolute left-2.5 w-3 h-3 rounded-full border-2 border-white ${isEdit ? 'bg-amber-400' : 'bg-blue-500'
                                                    }`} style={{ top: '4px' }} />
                                                <div className={`rounded-lg p-3 text-sm ${isEdit ? 'bg-amber-50 border border-amber-100' : 'bg-white border border-gray-100'}`}>
                                                    <div className="flex items-center gap-1.5 mb-1">
                                                        <Icon className="w-3.5 h-3.5 text-gray-400" />
                                                        <span className="text-xs font-medium text-gray-500 capitalize">{act.activity_type.replace('_', ' ')}</span>
                                                        <span className="text-xs text-gray-300 ml-auto">
                                                            {act.created_by_name && `${act.created_by_name} · `}
                                                            {new Date(act.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    <p className="text-gray-700 text-xs leading-relaxed">{act.content}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Current Remark */}
                            {lead.remarks && (
                                <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3 mt-4">
                                    <div className="text-xs font-medium text-yellow-700 mb-1">Latest Remark</div>
                                    <p className="text-xs text-yellow-800 leading-relaxed">{lead.remarks}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeSection === 'details' && (
                        <div className="p-5 space-y-4">
                            {[
                                { icon: Building2, label: 'Company', value: lead.company },
                                { icon: Users, label: 'Contact', value: lead.contact_name },
                                { icon: Package, label: 'Product', value: lead.product },
                                { icon: Phone, label: 'Phone', value: lead.phone },
                                { icon: Mail, label: 'Email', value: lead.email },
                                { icon: MapPin, label: 'Location', value: lead.location },
                                { icon: Globe, label: 'Country', value: lead.country },
                                { icon: Users, label: 'Assigned To', value: lead.assigned_to_name },
                                { icon: Table2, label: 'Tab', value: lead.source_tab },
                                { icon: Clock, label: 'Created', value: lead.created_at ? new Date(lead.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—' },
                                { icon: Clock, label: 'Updated', value: lead.updated_at ? new Date(lead.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—' },
                            ].map((item, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <item.icon className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs text-gray-400 font-medium">{item.label}</div>
                                        <div className="text-sm text-gray-800 mt-0.5 break-words">
                                            {item.value || <span className="text-gray-300 italic">Not set</span>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// ADD LEAD MODAL
// ============================================================================
function AddLeadModal({ sourceTab, onClose, onSave }) {
    const [form, setForm] = useState({
        company: '',
        contact_name: '',
        product: '',
        phone: '',
        email: '',
        location: '',
        country: 'Domestic',
        status: 'In Discussion',
        remarks: '',
        source_tab: sourceTab || 'General',
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.company.trim()) return;
        setSaving(true);
        await onSave(form);
        setSaving(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
                <div className="px-6 py-4 border-b bg-gradient-to-r from-gray-800 to-gray-900 text-white">
                    <h2 className="text-lg font-bold">Add New Lead</h2>
                    <p className="text-sm opacity-70">Tab: {form.source_tab}</p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[60vh] overflow-auto">
                    {[
                        { key: 'company', label: 'Company *', type: 'text', required: true },
                        { key: 'contact_name', label: 'Contact Name', type: 'text' },
                        { key: 'product', label: 'Product', type: 'text' },
                        { key: 'phone', label: 'Phone', type: 'text' },
                        { key: 'email', label: 'Email', type: 'email' },
                        { key: 'location', label: 'Location', type: 'text' },
                    ].map(field => (
                        <div key={field.key}>
                            <label className="text-xs font-medium text-gray-600 mb-1 block">{field.label}</label>
                            <input
                                type={field.type}
                                required={field.required}
                                value={form[field.key]}
                                onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-400"
                            />
                        </div>
                    ))}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-medium text-gray-600 mb-1 block">Country</label>
                            <select
                                value={form.country}
                                onChange={(e) => setForm({ ...form, country: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg text-sm"
                            >
                                <option value="Domestic">Domestic</option>
                                <option value="Export">Export</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-600 mb-1 block">Status</label>
                            <select
                                value={form.status}
                                onChange={(e) => setForm({ ...form, status: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg text-sm"
                            >
                                {Object.keys(STATUS_CONFIG).map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">Remarks</label>
                        <textarea
                            value={form.remarks}
                            onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg text-sm resize-none"
                            rows={3}
                        />
                    </div>
                </form>

                <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!form.company.trim() || saving}
                        className="px-6 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-40 transition flex items-center gap-2"
                    >
                        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                        Add Lead
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// MAIN PAGE
// ============================================================================
export default function CRMLeadsPage() {
    const [view, setView] = useState('sheet');
    const [leads, setLeads] = useState([]);
    const [tabs, setTabs] = useState([]);
    const [statusCounts, setStatusCounts] = useState({});
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLead, setSelectedLead] = useState(null);
    const [addLeadTab, setAddLeadTab] = useState(null);

    const fetchLeads = useCallback(async () => {
        try {
            setLoading(true);
            let url = '/api/crm-leads?limit=500';
            if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;

            const res = await fetch(url);
            const data = await res.json();
            if (data.success) {
                setLeads(data.data);
                setTabs(data.tabs || []);
                setStatusCounts(data.statusCounts || {});
            }
        } catch (err) {
            console.error('Error fetching leads:', err);
        } finally {
            setLoading(false);
        }
    }, [searchQuery]);

    useEffect(() => {
        fetchLeads();
    }, [fetchLeads]);

    // Inline cell edit (Sheet View)
    const handleCellEdit = async (leadId, field, value, oldValue) => {
        // Optimistic update
        setLeads(prev => prev.map(l =>
            l.id === leadId ? { ...l, [field]: value, updated_at: new Date().toISOString() } : l
        ));

        try {
            await fetch('/api/crm-leads', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    updates: [{ id: leadId, field, value, oldValue }]
                }),
            });
        } catch (err) {
            console.error('Error saving edit:', err);
            // Revert on error
            setLeads(prev => prev.map(l =>
                l.id === leadId ? { ...l, [field]: oldValue } : l
            ));
        }
    };

    // Add new lead
    const handleAddLead = async (form) => {
        try {
            const res = await fetch('/api/crm-leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            if (res.ok) {
                setAddLeadTab(null);
                fetchLeads();
            }
        } catch (err) {
            console.error('Error adding lead:', err);
        }
    };

    return (
        <div className="h-full flex flex-col bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b px-6 py-4 shrink-0">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Sparkles className="w-6 h-6 text-amber-500" />
                            CRM Leads
                        </h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {leads.length} leads • {statusCounts['Order Received'] || 0} won
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* View Toggle */}
                        <div className="flex items-center bg-gray-100 rounded-xl p-1">
                            <button
                                onClick={() => setView('sheet')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${view === 'sheet'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <Table2 className="w-4 h-4" />
                                Sheet
                            </button>
                            <button
                                onClick={() => setView('workspace')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${view === 'workspace'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <LayoutGrid className="w-4 h-4" />
                                Workspace
                            </button>
                        </div>

                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search leads..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-4 py-2 w-64 border rounded-xl text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                            />
                        </div>

                        {/* Add Lead Button */}
                        <button
                            onClick={() => setAddLeadTab('General')}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition shadow-md"
                        >
                            <Plus className="w-4 h-4" />
                            Add Lead
                        </button>

                        {/* Refresh */}
                        <button
                            onClick={fetchLeads}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-3" />
                            <p className="text-sm text-gray-400">Loading leads...</p>
                        </div>
                    </div>
                ) : view === 'sheet' ? (
                    <SheetView
                        leads={leads}
                        tabs={tabs}
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        onCellEdit={handleCellEdit}
                        onOpenDetail={setSelectedLead}
                        onAddLead={(tab) => setAddLeadTab(tab)}
                    />
                ) : (
                    <WorkspaceView
                        leads={leads}
                        statusCounts={statusCounts}
                        onOpenDetail={setSelectedLead}
                        searchQuery={searchQuery}
                    />
                )}
            </div>

            {/* Detail Panel */}
            {selectedLead && (
                <DetailPanel
                    lead={selectedLead}
                    onClose={() => setSelectedLead(null)}
                    onSaveActivity={fetchLeads}
                    onUpdateLead={fetchLeads}
                />
            )}

            {/* Add Lead Modal */}
            {addLeadTab && (
                <AddLeadModal
                    sourceTab={addLeadTab}
                    onClose={() => setAddLeadTab(null)}
                    onSave={handleAddLead}
                />
            )}

            {/* Slide-in animation */}
            <style jsx global>{`
                @keyframes slideInRight {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                .animate-slide-in-right {
                    animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }
            `}</style>
        </div>
    );
}
