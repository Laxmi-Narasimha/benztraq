/**
 * Ergopack Contacts List Page - Premium Earthy Theme
 * 
 * Color Palette:
 * - Charcoal Black: #111111
 * - French Beige: #AD7D56  
 * - Rodeo Dust: #CDB49E
 * - Ivory White: #F5F1EC
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
    open: { bg: 'bg-[#AD7D56]/20', text: 'text-[#AD7D56]', border: 'border-[#AD7D56]/40', label: 'Open' },
    new: { bg: 'bg-[#AD7D56]/20', text: 'text-[#AD7D56]', border: 'border-[#AD7D56]/40', label: 'New' },
    contacted: { bg: 'bg-[#CDB49E]/30', text: 'text-[#F5F1EC]', border: 'border-[#CDB49E]/50', label: 'Contacted' },
    proposal_sent: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/40', label: 'Proposal Sent' },
    deal_done: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/40', label: 'Deal Done' },
    won: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/40', label: 'Won' },
    lost: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/40', label: 'Lost' },
    not_serviceable: { bg: 'bg-[#3a3a3a]', text: 'text-[#888]', border: 'border-[#555]', label: 'Not Serviceable' },
    dormant: { bg: 'bg-[#3a3a3a]', text: 'text-[#888]', border: 'border-[#555]', label: 'Dormant' },
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
        <div className="min-h-screen bg-[#111111] text-[#F5F1EC] font-sans selection:bg-[#AD7D56]/30">
            <div className="max-w-[1600px] mx-auto p-6 md:p-8 space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-[#2a2a2a] pb-6">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight text-[#F5F1EC] flex items-center gap-3">
                            Contacts
                            <span className="text-base font-medium text-[#CDB49E] bg-[#1a1a1a] px-4 py-1.5 rounded-full border border-[#2a2a2a]">
                                {stats?.total || 0}
                            </span>
                        </h1>
                        <p className="text-[#CDB49E] mt-2 text-base">
                            Manage your outreach pipeline and relationships.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={fetchContacts}
                            disabled={isLoading}
                            className="bg-[#1a1a1a] border-[#3a3a3a] text-[#CDB49E] hover:bg-[#2a2a2a] hover:text-[#F5F1EC] hover:border-[#AD7D56] h-11 w-11 p-0 rounded-lg transition-all"
                        >
                            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                        </Button>
                        <Link href="/ergopack/contacts/new">
                            <Button className="bg-[#AD7D56] text-white hover:bg-[#9A6B47] h-11 px-6 rounded-lg font-medium tracking-wide transition-all shadow-sm">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Contact
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#CDB49E] group-focus-within:text-[#AD7D56] transition-colors" />
                        <Input
                            placeholder="Search by company, person..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchContacts()}
                            className="pl-12 h-12 bg-[#1a1a1a] border-[#3a3a3a] text-[#F5F1EC] text-base placeholder:text-[#666] rounded-xl focus:ring-2 focus:ring-[#AD7D56]/30 focus:border-[#AD7D56] transition-all"
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full sm:w-48 h-12 bg-[#1a1a1a] border-[#3a3a3a] text-[#CDB49E] text-base rounded-xl focus:ring-2 focus:ring-[#AD7D56]/30 hover:bg-[#2a2a2a] transition-all">
                            <SelectValue placeholder="Filter by stage" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a1a1a] border-[#3a3a3a] rounded-xl shadow-lg">
                            {STATUS_OPTIONS.map((opt) => (
                                <SelectItem
                                    key={opt.value}
                                    value={opt.value}
                                    className="text-[#CDB49E] text-base focus:bg-[#2a2a2a] focus:text-[#F5F1EC] rounded-lg my-1 cursor-pointer"
                                >
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-full sm:w-48 h-12 bg-[#1a1a1a] border-[#3a3a3a] text-[#CDB49E] text-base rounded-xl focus:ring-2 focus:ring-[#AD7D56]/30 hover:bg-[#2a2a2a] transition-all">
                            <ArrowUpDown className="w-4 h-4 mr-2" />
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a1a1a] border-[#3a3a3a] rounded-xl shadow-lg">
                            {SORT_OPTIONS.map((opt) => (
                                <SelectItem
                                    key={opt.value}
                                    value={opt.value}
                                    className="text-[#CDB49E] text-base focus:bg-[#2a2a2a] focus:text-[#F5F1EC] rounded-lg my-1 cursor-pointer"
                                >
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Data Grid */}
                <div className="rounded-2xl border border-[#2a2a2a] overflow-hidden bg-[#1a1a1a] shadow-lg">
                    {/* Grid Header */}
                    <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-[#2a2a2a] bg-[#151515] text-xs font-semibold text-[#CDB49E] uppercase tracking-wider">
                        <div className="col-span-3">Company</div>
                        <div className="col-span-1 hidden sm:block">Status</div>
                        <div className="col-span-2 hidden md:block">Created By</div>
                        <div className="col-span-1 hidden lg:block text-center">PDF</div>
                        <div className="col-span-1 hidden lg:block text-center">Quote</div>
                        <div className="col-span-3 hidden xl:block">Latest Activity</div>
                        <div className="col-span-1 text-right">Updated</div>
                    </div>

                    {/* Grid Body */}
                    <div className="divide-y divide-[#2a2a2a]">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-24 text-[#CDB49E]">
                                <RefreshCw className="w-6 h-6 animate-spin mb-3 text-[#AD7D56]" />
                                <span className="text-sm font-medium">Loading data...</span>
                            </div>
                        ) : filteredContacts.length === 0 ? (
                            <div className="text-center py-24">
                                <div className="w-16 h-16 rounded-2xl bg-[#2a2a2a] flex items-center justify-center mx-auto mb-4 border border-[#3a3a3a]">
                                    <Building2 className="w-6 h-6 text-[#CDB49E]" />
                                </div>
                                <p className="text-[#CDB49E] mb-6 font-medium text-lg">No contacts found</p>
                                <Link href="/ergopack/contacts/new">
                                    <Button variant="outline" className="border-[#AD7D56] text-[#AD7D56] hover:bg-[#AD7D56]/20 hover:text-[#F5F1EC]">
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
                                        className="grid grid-cols-12 gap-4 px-6 py-5 items-center hover:bg-[#222] transition-all duration-200 group cursor-pointer relative"
                                    >
                                        {/* Hover Highlight Line */}
                                        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#AD7D56] opacity-0 group-hover:opacity-100 transition-opacity" />

                                        {/* Company */}
                                        <div className="col-span-3 overflow-hidden relative">
                                            {/* Unseen Dot - Mobile optimized */}
                                            {hasUnseenUpdate && (
                                                <div className="absolute -left-3 top-2 w-2 h-2 rounded-full bg-[#AD7D56] animate-pulse md:hidden" />
                                            )}

                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-lg bg-[#2a2a2a] flex items-center justify-center border border-[#3a3a3a] text-[#CDB49E] group-hover:text-[#F5F1EC] group-hover:border-[#AD7D56] transition-all flex-shrink-0">
                                                    <Building2 className="w-6 h-6" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="text-base font-semibold text-[#F5F1EC] group-hover:text-white truncate transition-colors flex items-center gap-2">
                                                        {contact.company_name}
                                                    </h3>
                                                    {contact.contact_person && (
                                                        <p className="text-sm text-[#CDB49E] group-hover:text-[#F5F1EC] truncate mt-1">
                                                            {contact.contact_person}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status */}
                                        <div className="col-span-1 hidden sm:flex items-center">
                                            <Badge className={cn(
                                                "px-3 py-1 text-xs font-semibold tracking-wide uppercase rounded-full border",
                                                statusConfig.bg, statusConfig.text, statusConfig.border
                                            )}>
                                                {statusConfig.label}
                                            </Badge>
                                        </div>

                                        {/* Created By */}
                                        <div className="col-span-2 hidden md:flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-[#AD7D56]/30 border border-[#AD7D56]/50 flex items-center justify-center text-sm font-medium text-[#F5F1EC]">
                                                {contact.created_by_user?.full_name?.charAt(0) || 'U'}
                                            </div>
                                            <span className="text-sm text-[#CDB49E] truncate max-w-[120px]">
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
                                                    className="w-8 h-8 rounded-lg bg-red-500/20 hover:bg-red-500/30 flex items-center justify-center text-red-400 hover:text-red-300 transition-all"
                                                    title={`Download: ${contact.presentation_file_name || 'Presentation'}`}
                                                >
                                                    <FileText className="w-4 h-4" />
                                                </button>
                                            ) : (
                                                <span className="text-[#555] text-xs">-</span>
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
                                                    className="w-8 h-8 rounded-lg bg-[#AD7D56]/20 hover:bg-[#AD7D56]/30 flex items-center justify-center text-[#AD7D56] hover:text-[#CDB49E] transition-all"
                                                    title={`Download: ${contact.quotation_file_name || 'Quotation'}`}
                                                >
                                                    <Download className="w-4 h-4" />
                                                </button>
                                            ) : (
                                                <span className="text-[#555] text-xs">-</span>
                                            )}
                                        </div>

                                        {/* Latest Activity + NEW Badge */}
                                        <div className="col-span-3 hidden xl:flex items-center gap-3 text-[#CDB49E] min-w-0">
                                            {hasUnseenUpdate && (
                                                <Badge className="bg-[#AD7D56] hover:bg-[#AD7D56] text-white border-0 text-xs font-semibold px-2.5 py-0.5 h-5 mr-1">
                                                    NEW
                                                </Badge>
                                            )}

                                            {contact.latest_activity ? (
                                                <>
                                                    <ActivityIcon className="w-4 h-4 flex-shrink-0 text-[#CDB49E] group-hover:text-[#F5F1EC] transition-colors" />
                                                    <span className="text-sm truncate group-hover:text-[#F5F1EC] transition-colors">
                                                        {contact.latest_activity.title || 'Activity Logged'}
                                                    </span>
                                                </>
                                            ) : (
                                                <span className="text-sm text-[#555] italic">No activity</span>
                                            )}
                                        </div>

                                        {/* Last Updated + Delete Action */}
                                        <div className="col-span-1 text-right flex items-center justify-end gap-3 group/actions">
                                            <span className="text-sm text-[#CDB49E] font-mono group-hover:text-[#F5F1EC] transition-colors">
                                                {formatDate(contact.updated_at)}
                                            </span>

                                            {/* Delete Button (Visible on hover for authorized users) */}
                                            {canDelete && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-[#555] hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover/actions:opacity-100 transition-all md:opacity-0 sm:opacity-100"
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
                <div className="flex justify-between items-center text-sm text-[#CDB49E] px-2 font-mono">
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
