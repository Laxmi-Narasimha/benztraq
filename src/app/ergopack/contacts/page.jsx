/**
 * Ergopack Contacts List Page - Clean Light Theme
 * 
 * Professional light theme with sort/filter capabilities.
 * Features a clean data grid layout with columns: 
 * Company, Status, Created By, Updated By, Activity, Last Updated.
 * Includes sort by: Last Updated, Last Added, Status, Activity.
 * 
 * @module app/ergopack/contacts/page
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Building2, Search, Plus, RefreshCw, Trash2,
    User, Clock, Phone, Mail, FileText, MessageSquare, CalendarCheck,
    Ban, CheckCircle, XCircle, AlertCircle, Download, Eye, ArrowUpDown, ArrowDown, ArrowUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const STATUS_OPTIONS = [
    { value: 'all', label: 'All Stages' },
    { value: 'open', label: 'Open' },
    { value: 'contacted', label: 'Contacted' },
    { value: 'proposal_sent', label: 'Proposal Sent' },
    { value: 'deal_done', label: 'Deal Done' },
    { value: 'lost', label: 'Lost' },
    { value: 'not_serviceable', label: 'Not Serviceable' },
];

const STATUS_CONFIG = {
    open: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300', label: 'Open' },
    new: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300', label: 'New' },
    contacted: { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-300', label: 'Contacted' },
    proposal_sent: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300', label: 'Proposal Sent' },
    deal_done: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300', label: 'Deal Done' },
    won: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300', label: 'Won' },
    lost: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300', label: 'Lost' },
    not_serviceable: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-300', label: 'Not Serviceable' },
    dormant: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-300', label: 'Dormant' },
};

const SORT_OPTIONS = [
    { value: 'updated_desc', label: 'Last Updated', icon: ArrowDown },
    { value: 'updated_asc', label: 'Oldest Updated', icon: ArrowUp },
    { value: 'created_desc', label: 'Recently Added', icon: ArrowDown },
    { value: 'created_asc', label: 'First Added', icon: ArrowUp },
    { value: 'activity_desc', label: 'Recent Activity', icon: Clock },
    { value: 'company_asc', label: 'Company A-Z', icon: ArrowUp },
];

const ACTIVITY_ICONS = {
    call: Phone,
    email: Mail,
    meeting: CalendarCheck,
    note: FileText,
    status_change: RefreshCw,
    follow_up: Clock,
};

export default function ContactsListPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const initialStatus = searchParams.get('status') || 'all';
    const { user, isManager, isDirector, isDeveloper } = useAuth();

    const [contacts, setContacts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState(initialStatus);
    const [sortBy, setSortBy] = useState('updated_desc');
    const [stats, setStats] = useState(null);
    const [seenMap, setSeenMap] = useState({});

    // Permission check for delete (Director/Dev)
    const canDelete = isDirector || isDeveloper;

    // Load seen map from localStorage on mount
    useEffect(() => {
        if (user?.id) {
            const key = `ergopack_seen_${user.id}`;
            try {
                const stored = JSON.parse(localStorage.getItem(key) || '{}');
                setSeenMap(stored);
            } catch (e) {
                console.error('Error loading seen map', e);
            }
        }
    }, [user]);

    const fetchContacts = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (statusFilter !== 'all') params.set('status', statusFilter);
            if (searchQuery) params.set('search', searchQuery);

            const response = await fetch(`/api/ergopack/contacts?${params}`);
            const data = await response.json();

            if (data.contacts) setContacts(data.contacts);
            if (data.stats) setStats(data.stats);
        } catch (error) {
            console.error('Error fetching contacts:', error);
        } finally {
            setIsLoading(false);
        }
    }, [statusFilter, searchQuery]);

    useEffect(() => {
        fetchContacts();
        const interval = setInterval(fetchContacts, 30000);
        return () => clearInterval(interval);
    }, [fetchContacts]);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchContacts();
    };

    const handleDelete = async (e, id, name) => {
        e.preventDefault(); // Prevent navigation
        e.stopPropagation();

        if (!canDelete) return;

        if (!confirm(`Are you sure you want to delete ${name}? This cannot be undone.`)) return;

        try {
            const res = await fetch(`/api/ergopack/contacts?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('Contact deleted');
                fetchContacts();
            } else {
                const data = await res.json();
                toast.error(data.error || 'Failed to delete');
            }
        } catch (err) {
            toast.error('Error deleting contact');
        }
    };

    const handleContactClick = (id) => {
        // Update seen map
        if (!user?.id) return;

        const key = `ergopack_seen_${user.id}`;
        const newSeen = { ...seenMap, [id]: Date.now() };
        setSeenMap(newSeen);
        localStorage.setItem(key, JSON.stringify(newSeen));
    };

    const isUnseen = (contact) => {
        if (!contact.updated_at) return false;
        const lastSeen = seenMap[contact.id] || 0;
        const lastUpdated = new Date(contact.updated_at).getTime();
        // Give a 2 second buffer to avoid immediate flicker if just updated
        return lastUpdated > (lastSeen + 2000);
    };

    const filteredContacts = contacts
        .filter(contact => {
            if (!searchQuery) return true;
            const query = searchQuery.toLowerCase();
            return (
                contact.company_name?.toLowerCase().includes(query) ||
                contact.contact_person?.toLowerCase().includes(query) ||
                contact.email?.toLowerCase().includes(query) ||
                contact.city?.toLowerCase().includes(query)
            );
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'updated_desc':
                    return new Date(b.updated_at || 0) - new Date(a.updated_at || 0);
                case 'updated_asc':
                    return new Date(a.updated_at || 0) - new Date(b.updated_at || 0);
                case 'created_desc':
                    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
                case 'created_asc':
                    return new Date(a.created_at || 0) - new Date(b.created_at || 0);
                case 'activity_desc':
                    const aActivity = a.latest_activity?.created_at || a.updated_at || 0;
                    const bActivity = b.latest_activity?.created_at || b.updated_at || 0;
                    return new Date(bActivity) - new Date(aActivity);
                case 'company_asc':
                    return (a.company_name || '').localeCompare(b.company_name || '');
                default:
                    return 0;
            }
        });

    const getStatusConfig = (status) => {
        return STATUS_CONFIG[status] || STATUS_CONFIG.open;
    };

    const getActivityIcon = (type) => {
        return ACTIVITY_ICONS[type] || MessageSquare;
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-blue-100">
            <div className="max-w-[1600px] mx-auto p-6 md:p-8 space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-gray-200 pb-6">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight text-gray-900 flex items-center gap-3">
                            Contacts
                            <span className="text-base font-medium text-gray-600 bg-gray-100 px-4 py-1.5 rounded-full border border-gray-200">
                                {stats?.total || 0}
                            </span>
                        </h1>
                        <p className="text-gray-500 mt-2 text-base">
                            Manage your outreach pipeline and relationships.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={fetchContacts}
                            disabled={isLoading}
                            className="bg-white border-gray-300 text-gray-600 hover:bg-gray-50 hover:text-gray-900 h-11 w-11 p-0 rounded-lg transition-all"
                        >
                            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                        </Button>
                        <Link href="/ergopack/contacts/new">
                            <Button className="bg-gray-900 text-white hover:bg-gray-800 h-11 px-6 rounded-lg font-medium tracking-wide transition-all shadow-sm">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Contact
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-gray-600 transition-colors" />
                        <Input
                            placeholder="Search by company, person..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchContacts()}
                            className="pl-12 h-12 bg-white border-gray-300 text-gray-900 text-base placeholder:text-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full sm:w-48 h-12 bg-white border-gray-300 text-gray-700 text-base rounded-xl focus:ring-2 focus:ring-blue-500/30 hover:bg-gray-50 transition-all">
                            <SelectValue placeholder="Filter by stage" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-gray-200 rounded-xl shadow-lg">
                            {STATUS_OPTIONS.map((opt) => (
                                <SelectItem
                                    key={opt.value}
                                    value={opt.value}
                                    className="text-gray-700 text-base focus:bg-gray-100 focus:text-gray-900 rounded-lg my-1 cursor-pointer"
                                >
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-full sm:w-48 h-12 bg-white border-gray-300 text-gray-700 text-base rounded-xl focus:ring-2 focus:ring-blue-500/30 hover:bg-gray-50 transition-all">
                            <ArrowUpDown className="w-4 h-4 mr-2" />
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-gray-200 rounded-xl shadow-lg">
                            {SORT_OPTIONS.map((opt) => (
                                <SelectItem
                                    key={opt.value}
                                    value={opt.value}
                                    className="text-gray-700 text-base focus:bg-gray-100 focus:text-gray-900 rounded-lg my-1 cursor-pointer"
                                >
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Data Grid */}
                <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white shadow-sm">
                    {/* Grid Header */}
                    <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-gray-200 bg-gray-50 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        <div className="col-span-3">Company</div>
                        <div className="col-span-1 hidden sm:block">Status</div>
                        <div className="col-span-2 hidden md:block">Created By</div>
                        <div className="col-span-1 hidden lg:block text-center">PDF</div>
                        <div className="col-span-1 hidden lg:block text-center">Quote</div>
                        <div className="col-span-3 hidden xl:block">Latest Activity</div>
                        <div className="col-span-1 text-right">Updated</div>
                    </div>

                    {/* Grid Body */}
                    <div className="divide-y divide-gray-100">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                                <RefreshCw className="w-6 h-6 animate-spin mb-3 text-gray-500" />
                                <span className="text-sm font-medium">Loading data...</span>
                            </div>
                        ) : filteredContacts.length === 0 ? (
                            <div className="text-center py-24">
                                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4 border border-gray-200">
                                    <Building2 className="w-6 h-6 text-gray-400" />
                                </div>
                                <p className="text-gray-500 mb-6 font-medium text-lg">No contacts found</p>
                                <Link href="/ergopack/contacts/new">
                                    <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add First Contact
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            filteredContacts.map((contact) => {
                                const statusConfig = getStatusConfig(contact.status);
                                const ActivityIcon = getActivityIcon(contact.latest_activity?.activity_type);
                                const hasUnseenUpdate = isUnseen(contact);

                                return (
                                    <Link
                                        key={contact.id}
                                        href={`/ergopack/contacts/${contact.id}`}
                                        onClick={() => handleContactClick(contact.id)}
                                        className="grid grid-cols-12 gap-4 px-6 py-5 items-center hover:bg-gray-50 transition-all duration-200 group cursor-pointer relative"
                                    >
                                        {/* Hover Highlight Line */}
                                        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />

                                        {/* Company */}
                                        <div className="col-span-3 overflow-hidden relative">
                                            {/* Unseen Dot - Mobile optimized */}
                                            {hasUnseenUpdate && (
                                                <div className="absolute -left-3 top-2 w-2 h-2 rounded-full bg-blue-500 animate-pulse md:hidden" />
                                            )}

                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200 text-gray-500 group-hover:text-gray-900 group-hover:border-gray-300 transition-all flex-shrink-0">
                                                    <Building2 className="w-6 h-6" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="text-base font-semibold text-gray-900 group-hover:text-gray-900 truncate transition-colors flex items-center gap-2">
                                                        {contact.company_name}
                                                    </h3>
                                                    {contact.contact_person && (
                                                        <p className="text-sm text-gray-500 group-hover:text-gray-600 truncate mt-1">
                                                            {contact.contact_person}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status */}
                                        <div className="col-span-1 hidden sm:flex items-center">
                                            <Badge className={cn(
                                                "px-3 py-1 text-xs font-semibold tracking-wide uppercase rounded-full border bg-transparent",
                                                statusConfig.text, statusConfig.border
                                            )}>
                                                {statusConfig.label}
                                            </Badge>
                                        </div>

                                        {/* Created By */}
                                        <div className="col-span-2 hidden md:flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center text-sm font-medium text-gray-600">
                                                {contact.created_by_user?.full_name?.charAt(0) || 'U'}
                                            </div>
                                            <span className="text-sm text-gray-600 truncate max-w-[120px]">
                                                {contact.created_by_user?.full_name?.split(' ')[0] || 'Unknown'}
                                            </span>
                                        </div>

                                        {/* Presentation Download */}
                                        <div className="col-span-1 hidden lg:flex items-center justify-center">
                                            {contact.presentation_file_path ? (
                                                <button
                                                    onClick={async (e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        try {
                                                            const res = await fetch(`/api/ergopack/presentations?contactId=${contact.id}`);
                                                            const data = await res.json();
                                                            if (data.url) {
                                                                window.open(data.url, '_blank');
                                                            } else {
                                                                toast.error('Could not get presentation URL');
                                                            }
                                                        } catch (err) {
                                                            toast.error('Error loading presentation');
                                                        }
                                                    }}
                                                    className="w-8 h-8 rounded-lg bg-red-100 hover:bg-red-200 flex items-center justify-center text-red-600 hover:text-red-700 transition-all"
                                                    title={`Download: ${contact.presentation_file_name || 'Presentation'}`}
                                                >
                                                    <FileText className="w-4 h-4" />
                                                </button>
                                            ) : (
                                                <span className="text-gray-400 text-xs">-</span>
                                            )}
                                        </div>

                                        {/* Quotation Download */}
                                        <div className="col-span-1 hidden lg:flex items-center justify-center">
                                            {contact.quotation_file_path ? (
                                                <button
                                                    onClick={async (e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        try {
                                                            const res = await fetch(`/api/ergopack/quotations?contactId=${contact.id}`);
                                                            const data = await res.json();
                                                            if (data.url) {
                                                                window.open(data.url, '_blank');
                                                            } else {
                                                                toast.error('Could not get quotation URL');
                                                            }
                                                        } catch (err) {
                                                            toast.error('Error loading quotation');
                                                        }
                                                    }}
                                                    className="w-8 h-8 rounded-lg bg-blue-100 hover:bg-blue-200 flex items-center justify-center text-blue-600 hover:text-blue-700 transition-all"
                                                    title={`Download: ${contact.quotation_file_name || 'Quotation'}`}
                                                >
                                                    <Download className="w-4 h-4" />
                                                </button>
                                            ) : (
                                                <span className="text-gray-400 text-xs">-</span>
                                            )}
                                        </div>

                                        {/* Latest Activity + NEW Badge */}
                                        <div className="col-span-3 hidden xl:flex items-center gap-3 text-gray-500 min-w-0">
                                            {hasUnseenUpdate && (
                                                <Badge className="bg-blue-600 hover:bg-blue-600 text-white border-0 text-xs font-semibold px-2.5 py-0.5 h-5 mr-1">
                                                    NEW
                                                </Badge>
                                            )}

                                            {contact.latest_activity ? (
                                                <>
                                                    <ActivityIcon className="w-4 h-4 flex-shrink-0 text-gray-400 group-hover:text-gray-600 transition-colors" />
                                                    <span className="text-sm truncate group-hover:text-gray-700 transition-colors">
                                                        {contact.latest_activity.title || 'Activity Logged'}
                                                    </span>
                                                </>
                                            ) : (
                                                <span className="text-sm text-gray-400 italic">No activity</span>
                                            )}
                                        </div>

                                        {/* Last Updated + Delete Action */}
                                        <div className="col-span-1 text-right flex items-center justify-end gap-3 group/actions">
                                            <span className="text-sm text-gray-500 font-mono group-hover:text-gray-700 transition-colors">
                                                {formatDate(contact.updated_at)}
                                            </span>

                                            {/* Delete Button (Visible on hover for authorized users) */}
                                            {canDelete && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover/actions:opacity-100 transition-all md:opacity-0 sm:opacity-100"
                                                    onClick={(e) => handleDelete(e, contact.id, contact.company_name)}
                                                    title="Delete Contact"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </Link>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Footer Note */}
                <div className="flex justify-between items-center text-sm text-gray-500 px-2 font-mono">
                    <span>
                        Showing {filteredContacts.length} contacts
                    </span>
                    <span>
                        Live Sync Active
                    </span>
                </div>
            </div>
        </div>
    );
}
