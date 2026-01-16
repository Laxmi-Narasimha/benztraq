'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Plus,
    Search,
    Filter,
    MoreVertical,
    Phone,
    Mail,
    Calendar,
    DollarSign,
    User,
    Building2,
    Star,
    StarOff,
    ChevronRight,
    Clock,
    TrendingUp,
    Trophy,
    XCircle
} from 'lucide-react';

// Priority colors (Odoo style)
const PRIORITY_COLORS = {
    '0': 'bg-gray-200 text-gray-700',
    '1': 'bg-blue-100 text-blue-700',
    '2': 'bg-yellow-100 text-yellow-700',
    '3': 'bg-red-100 text-red-700'
};

const PRIORITY_LABELS = {
    '0': 'Low',
    '1': 'Medium',
    '2': 'High',
    '3': 'Very High'
};

// Format currency
const formatCurrency = (amount) => {
    if (!amount) return '₹0';
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount);
};

// Lead Card Component
function LeadCard({ lead, onDragStart, onDragEnd, onClick }) {
    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, lead)}
            onDragEnd={onDragEnd}
            onClick={() => onClick(lead)}
            className="bg-white rounded-lg border border-gray-200 p-4 mb-3 cursor-pointer 
                 hover:shadow-md hover:border-indigo-200 transition-all duration-200
                 active:shadow-lg active:scale-[0.98]"
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-gray-900 text-sm leading-tight flex-1 pr-2">
                    {lead.name}
                </h4>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[lead.priority || '0']}`}>
                    {PRIORITY_LABELS[lead.priority || '0']}
                </span>
            </div>

            {/* Partner/Company */}
            {(lead.partner?.name || lead.partner_name) && (
                <div className="flex items-center gap-1.5 text-gray-600 text-xs mb-2">
                    <Building2 className="w-3.5 h-3.5" />
                    <span className="truncate">{lead.partner?.name || lead.partner_name}</span>
                </div>
            )}

            {/* Contact Info */}
            <div className="flex items-center gap-3 text-gray-500 text-xs mb-3">
                {lead.email_from && (
                    <div className="flex items-center gap-1" title={lead.email_from}>
                        <Mail className="w-3 h-3" />
                        <span className="truncate max-w-[100px]">{lead.email_from}</span>
                    </div>
                )}
                {lead.phone && (
                    <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                    </div>
                )}
            </div>

            {/* Expected Revenue */}
            {lead.expected_revenue > 0 && (
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1 text-green-600 font-medium text-sm">
                        <DollarSign className="w-4 h-4" />
                        {formatCurrency(lead.expected_revenue)}
                    </div>
                    <div className="text-xs text-gray-500">
                        {lead.probability}% probability
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                {/* Salesperson */}
                <div className="flex items-center gap-1.5">
                    {lead.salesperson?.profile_image_url ? (
                        <img
                            src={lead.salesperson.profile_image_url}
                            alt={lead.salesperson.full_name}
                            className="w-5 h-5 rounded-full"
                        />
                    ) : (
                        <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center">
                            <User className="w-3 h-3 text-indigo-600" />
                        </div>
                    )}
                    <span className="text-xs text-gray-600 truncate max-w-[80px]">
                        {lead.salesperson?.full_name || 'Unassigned'}
                    </span>
                </div>

                {/* Deadline */}
                {lead.date_deadline && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(lead.date_deadline).toLocaleDateString()}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

// Stage Column Component
function StageColumn({ stage, leads, onDragOver, onDrop, onDragStart, onDragEnd, onLeadClick, onCreateLead }) {
    const isWon = stage.is_won;
    const isFolded = stage.fold;

    return (
        <div
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, stage.id)}
            className={`flex-shrink-0 w-72 bg-gray-50 rounded-lg ${isFolded ? 'opacity-75' : ''}`}
        >
            {/* Stage Header */}
            <div className={`px-4 py-3 rounded-t-lg ${isWon ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-800'
                }`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {isWon && <Trophy className="w-4 h-4" />}
                        <h3 className="font-semibold text-sm">{stage.name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${isWon ? 'bg-green-600' : 'bg-gray-300 text-gray-700'
                            }`}>
                            {stage.leads_count || leads.length}
                        </span>
                    </div>
                    <button
                        onClick={() => onCreateLead(stage.id)}
                        className={`p-1 rounded hover:bg-opacity-20 hover:bg-black ${isWon ? 'text-white' : 'text-gray-600'
                            }`}
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>

                {/* Stage Stats */}
                <div className="flex items-center gap-2 mt-2 text-xs opacity-90">
                    <div className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        <span>{formatCurrency(stage.total_revenue || 0)}</span>
                    </div>
                </div>
            </div>

            {/* Cards Container */}
            <div className="p-3 max-h-[calc(100vh-250px)] overflow-y-auto">
                {leads.map(lead => (
                    <LeadCard
                        key={lead.id}
                        lead={lead}
                        onDragStart={onDragStart}
                        onDragEnd={onDragEnd}
                        onClick={onLeadClick}
                    />
                ))}

                {leads.length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-sm">
                        No opportunities
                    </div>
                )}
            </div>
        </div>
    );
}

// Lead Detail Modal
function LeadDetailModal({ lead, stages, onClose, onUpdate, onAction }) {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({ ...lead });

    const handleSubmit = async (e) => {
        e.preventDefault();
        await onUpdate(formData);
        setIsEditing(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b flex items-center justify-between bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                    <div>
                        <h2 className="text-xl font-semibold">{lead.name}</h2>
                        <p className="text-sm opacity-90">{lead.partner?.name || lead.partner_name}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-full transition"
                    >
                        <XCircle className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                    <div className="grid grid-cols-2 gap-6">
                        {/* Left Column */}
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-500">Expected Revenue</label>
                                <div className="text-2xl font-bold text-green-600">
                                    {formatCurrency(lead.expected_revenue)}
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-500">Probability</label>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-indigo-500 transition-all"
                                            style={{ width: `${lead.probability || 0}%` }}
                                        />
                                    </div>
                                    <span className="text-sm font-medium">{lead.probability}%</span>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-500">Stage</label>
                                <select
                                    value={lead.stage_id || ''}
                                    onChange={(e) => onUpdate({ ...lead, stage_id: e.target.value })}
                                    className="mt-1 w-full border rounded-lg px-3 py-2"
                                >
                                    {stages.map(stage => (
                                        <option key={stage.id} value={stage.id}>{stage.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-500">Priority</label>
                                <select
                                    value={lead.priority || '0'}
                                    onChange={(e) => onUpdate({ ...lead, priority: e.target.value })}
                                    className="mt-1 w-full border rounded-lg px-3 py-2"
                                >
                                    <option value="0">Low</option>
                                    <option value="1">Medium</option>
                                    <option value="2">High</option>
                                    <option value="3">Very High</option>
                                </select>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-500">Contact</label>
                                <div className="mt-1 space-y-2">
                                    {lead.email_from && (
                                        <a href={`mailto:${lead.email_from}`} className="flex items-center gap-2 text-indigo-600 hover:underline">
                                            <Mail className="w-4 h-4" />
                                            {lead.email_from}
                                        </a>
                                    )}
                                    {lead.phone && (
                                        <a href={`tel:${lead.phone}`} className="flex items-center gap-2 text-indigo-600 hover:underline">
                                            <Phone className="w-4 h-4" />
                                            {lead.phone}
                                        </a>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-500">Salesperson</label>
                                <div className="mt-1 flex items-center gap-2">
                                    <User className="w-4 h-4 text-gray-400" />
                                    <span>{lead.salesperson?.full_name || 'Unassigned'}</span>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-500">Expected Closing</label>
                                <div className="mt-1 flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    <span>{lead.date_deadline ? new Date(lead.date_deadline).toLocaleDateString() : 'Not set'}</span>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-500">Source</label>
                                <div className="mt-1">
                                    {lead.source?.name || lead.campaign?.name || 'Direct'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    {lead.description && (
                        <div className="mt-6">
                            <label className="text-sm font-medium text-gray-500">Notes</label>
                            <div className="mt-1 p-3 bg-gray-50 rounded-lg text-sm">
                                {lead.description}
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onAction('mark_won')}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2"
                        >
                            <Trophy className="w-4 h-4" />
                            Won
                        </button>
                        <button
                            onClick={() => onAction('mark_lost')}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-2"
                        >
                            <XCircle className="w-4 h-4" />
                            Lost
                        </button>
                    </div>
                    <button
                        onClick={() => window.location.href = `/documents/new?opportunity_id=${lead.id}`}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
                    >
                        Create Quotation
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

// Main Pipeline Component
export default function CRMPipelinePage() {
    const [stages, setStages] = useState([]);
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedLead, setSelectedLead] = useState(null);
    const [draggedLead, setDraggedLead] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        team_id: null,
        user_id: null
    });

    // Fetch data
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);

            // Fetch stages with stats
            const stagesRes = await fetch('/api/crm/stages?include_stats=true');
            const stagesData = await stagesRes.json();
            if (stagesData.success) {
                setStages(stagesData.data);
            }

            // Fetch opportunities
            let leadsUrl = '/api/crm/leads?type=opportunity&active=true';
            if (filters.team_id) leadsUrl += `&team_id=${filters.team_id}`;
            if (filters.user_id) leadsUrl += `&user_id=${filters.user_id}`;
            if (searchQuery) leadsUrl += `&search=${encodeURIComponent(searchQuery)}`;

            const leadsRes = await fetch(leadsUrl);
            const leadsData = await leadsRes.json();
            if (leadsData.success) {
                setLeads(leadsData.data);
            }

        } catch (error) {
            console.error('Error fetching pipeline data:', error);
        } finally {
            setLoading(false);
        }
    }, [filters, searchQuery]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Group leads by stage
    const leadsByStage = stages.reduce((acc, stage) => {
        acc[stage.id] = leads.filter(l => l.stage_id === stage.id);
        return acc;
    }, {});

    // Drag and Drop handlers
    const handleDragStart = (e, lead) => {
        setDraggedLead(lead);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragEnd = () => {
        setDraggedLead(null);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e, stageId) => {
        e.preventDefault();
        if (!draggedLead || draggedLead.stage_id === stageId) return;

        // Optimistic update
        setLeads(prev => prev.map(l =>
            l.id === draggedLead.id ? { ...l, stage_id: stageId } : l
        ));

        try {
            const res = await fetch('/api/crm/leads', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    updates: [{ id: draggedLead.id, stage_id: stageId }]
                })
            });

            if (!res.ok) {
                throw new Error('Failed to update lead');
            }

            // Refresh data
            fetchData();

        } catch (error) {
            console.error('Error moving lead:', error);
            // Revert on error
            setLeads(prev => prev.map(l =>
                l.id === draggedLead.id ? { ...l, stage_id: draggedLead.stage_id } : l
            ));
        }

        setDraggedLead(null);
    };

    // Lead actions
    const handleLeadUpdate = async (updatedLead) => {
        try {
            const res = await fetch(`/api/crm/leads/${updatedLead.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedLead)
            });

            if (res.ok) {
                fetchData();
                setSelectedLead(null);
            }
        } catch (error) {
            console.error('Error updating lead:', error);
        }
    };

    const handleLeadAction = async (action) => {
        if (!selectedLead) return;

        try {
            const body = { action };

            if (action === 'mark_won') {
                const wonStage = stages.find(s => s.is_won);
                if (wonStage) body.stage_id = wonStage.id;
            }

            const res = await fetch(`/api/crm/leads/${selectedLead.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                fetchData();
                setSelectedLead(null);
            }
        } catch (error) {
            console.error('Error performing action:', error);
        }
    };

    const handleCreateLead = (stageId) => {
        window.location.href = `/crm/leads/new?stage_id=${stageId}`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b bg-white">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">CRM Pipeline</h1>
                        <p className="text-sm text-gray-500">
                            {leads.length} opportunities • {formatCurrency(leads.reduce((s, l) => s + (l.expected_revenue || 0), 0))} total
                        </p>
                    </div>
                    <button
                        onClick={() => window.location.href = '/crm/leads/new'}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        New Opportunity
                    </button>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search opportunities..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <button className="flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-gray-50">
                        <Filter className="w-4 h-4" />
                        Filters
                    </button>
                </div>
            </div>

            {/* Kanban Board */}
            <div className="flex-1 overflow-x-auto p-6 bg-gray-100">
                <div className="flex gap-4 h-full">
                    {stages.map(stage => (
                        <StageColumn
                            key={stage.id}
                            stage={stage}
                            leads={leadsByStage[stage.id] || []}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                            onLeadClick={setSelectedLead}
                            onCreateLead={handleCreateLead}
                        />
                    ))}
                </div>
            </div>

            {/* Lead Detail Modal */}
            {selectedLead && (
                <LeadDetailModal
                    lead={selectedLead}
                    stages={stages}
                    onClose={() => setSelectedLead(null)}
                    onUpdate={handleLeadUpdate}
                    onAction={handleLeadAction}
                />
            )}
        </div>
    );
}
