/**
 * Ergopack Contacts List Page - Premium Clean Theme
 * 
 * Color Palette (Light & Readable):
 * - Background: Ivory #F5F1EC
 * - Text: Charcoal #111111 
 * - Accent: French Beige #AD7D56
 * - Secondary: Rodeo Dust #CDB49E
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

// Light theme - readable status badges
const STATUS_CONFIG = {
    open: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Open' },
    new: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'New' },
    contacted: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'Contacted' },
    proposal_sent: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', label: 'Proposal Sent' },
    deal_done: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Deal Done' },
    won: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Won' },
    lost: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', label: 'Lost' },
    not_serviceable: { bg: 'bg-gray-100', text: 'text-gray-500', border: 'border-gray-200', label: 'Not Serviceable' },
    dormant: { bg: 'bg-gray-100', text: 'text-gray-500', border: 'border-gray-200', label: 'Dormant' },
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
        <div className="min-h-screen bg-[#F5F1EC] text-[#111111] font-sans">
            <div className="max-w-[1400px] mx-auto p-6 md:p-8 space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-[#111111] flex items-center gap-3">
                            Contacts
                            <span className="text-sm font-medium text-[#AD7D56] bg-[#AD7D56]/10 px-3 py-1 rounded-full">
                                {stats?.total || 0}
                            </span>
                        </h1>
                        <p className="text-[#666] mt-1">
                            Manage your outreach pipeline and relationships.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={fetchContacts}
                            disabled={isLoading}
                            className="bg-white border-[#ddd] text-[#666] hover:bg-gray-50 hover:border-[#AD7D56] hover:text-[#AD7D56] h-10 w-10 p-0 rounded-lg"
                        >
                            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                        </Button>
                        <Link href="/ergopack/contacts/new">
                            <Button className="bg-[#AD7D56] text-white hover:bg-[#96704d] h-10 px-5 rounded-lg font-medium">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Contact
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex flex-col sm:flex-row gap-3 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999]" />
                        <Input
                            placeholder="Search by company, person..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchContacts()}
                            className="pl-10 h-10 bg-white border-[#ddd] text-[#111] placeholder:text-[#999] rounded-lg focus:border-[#AD7D56] focus:ring-1 focus:ring-[#AD7D56]/20"
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full sm:w-44 h-10 bg-white border-[#ddd] text-[#333] rounded-lg">
                            <SelectValue placeholder="All Stages" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-[#ddd] rounded-lg shadow-lg">
                            {STATUS_OPTIONS.map((opt) => (
                                <SelectItem
                                    key={opt.value}
                                    value={opt.value}
                                    className="text-[#333] focus:bg-[#F5F1EC] cursor-pointer"
                                >
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-full sm:w-44 h-10 bg-white border-[#ddd] text-[#333] rounded-lg">
                            <ArrowUpDown className="w-4 h-4 mr-2" />
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-[#ddd] rounded-lg shadow-lg">
                            {SORT_OPTIONS.map((opt) => (
                                <SelectItem
                                    key={opt.value}
                                    value={opt.value}
                                    className="text-[#333] focus:bg-[#F5F1EC] cursor-pointer"
                                >
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Data Grid */}
                <div className="rounded-lg border border-[#ddd] overflow-hidden bg-white shadow-sm">
                    {/* Grid Header */}
                    <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-[#eee] bg-[#f9f7f4] text-xs font-semibold text-[#666] uppercase tracking-wide">
                        <div className="col-span-3">Company</div>
                        <div className="col-span-1 hidden sm:block">Status</div>
                        <div className="col-span-2 hidden md:block">Created By</div>
                        <div className="col-span-1 hidden lg:block text-center">PDF</div>
                        <div className="col-span-1 hidden lg:block text-center">Quote</div>
                        <div className="col-span-3 hidden xl:block">Latest Activity</div>
                        <div className="col-span-1 text-right">Updated</div>
                    </div>

                    {/* Grid Body */}
                    <div className="divide-y divide-[#eee]">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 text-[#666]">
                                <RefreshCw className="w-5 h-5 animate-spin mb-3 text-[#AD7D56]" />
                                <span className="text-sm">Loading...</span>
                            </div>
                        ) : filteredContacts.length === 0 ? (
                            <div className="text-center py-20">
                                <div className="w-14 h-14 rounded-lg bg-[#F5F1EC] flex items-center justify-center mx-auto mb-4">
                                    <Building2 className="w-6 h-6 text-[#AD7D56]" />
                                </div>
                                <p className="text-[#666] mb-4 font-medium">No contacts found</p>
                                <Link href="/ergopack/contacts/new">
                                    <Button className="bg-[#AD7D56] text-white hover:bg-[#96704d]">
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
                                        className="grid grid-cols-12 gap-4 px-5 py-4 items-center hover:bg-[#f9f7f4] transition-colors group cursor-pointer"
                                    >
                                        {/* Company */}
                                        <div className="col-span-3 overflow-hidden">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-[#F5F1EC] flex items-center justify-center text-[#AD7D56] flex-shrink-0">
                                                    <Building2 className="w-5 h-5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="text-sm font-semibold text-[#111] truncate flex items-center gap-2">
                                                        {contact.company_name}
                                                        {hasUnseenUpdate && (
                                                            <span className="w-2 h-2 rounded-full bg-[#AD7D56]" />
                                                        )}
                                                    </h3>
                                                    {contact.contact_person && (
                                                        <p className="text-xs text-[#666] truncate mt-0.5">
                                                            {contact.contact_person}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status */}
                                        <div className="col-span-1 hidden sm:flex items-center">
                                            <Badge className={cn(
                                                "px-2 py-0.5 text-xs font-medium rounded-full border",
                                                statusConfig.bg, statusConfig.text, statusConfig.border
                                            )}>
                                                {statusConfig.label}
                                            </Badge>
                                        </div>

                                        {/* Created By */}
                                        <div className="col-span-2 hidden md:flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-full bg-[#AD7D56]/20 flex items-center justify-center text-xs font-medium text-[#AD7D56]">
                                                {contact.created_by_user?.full_name?.charAt(0) || 'U'}
                                            </div>
                                            <span className="text-sm text-[#666] truncate">
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
                                                    className="w-7 h-7 rounded bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-600 transition-colors"
                                                    title={`Download: ${contact.presentation_file_name || 'Presentation'}`}
                                                >
                                                    <FileText className="w-4 h-4" />
                                                </button>
                                            ) : (
                                                <span className="text-[#ccc] text-xs">-</span>
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
                                                    className="w-7 h-7 rounded bg-[#F5F1EC] hover:bg-[#AD7D56]/20 flex items-center justify-center text-[#AD7D56] transition-colors"
                                                    title={`Download: ${contact.quotation_file_name || 'Quotation'}`}
                                                >
                                                    <Download className="w-4 h-4" />
                                                </button>
                                            ) : (
                                                <span className="text-[#ccc] text-xs">-</span>
                                            )}
                                        </div>

                                        {/* Latest Activity */}
                                        <div className="col-span-3 hidden xl:flex items-center gap-2 text-[#666] min-w-0">
                                            {hasUnseenUpdate && (
                                                <Badge className="bg-[#AD7D56] text-white border-0 text-[10px] font-semibold px-2 py-0 h-5">
                                                    NEW
                                                </Badge>
                                            )}

                                            {contact.latest_activity ? (
                                                <>
                                                    <ActivityIcon className="w-4 h-4 flex-shrink-0" />
                                                    <span className="text-sm truncate">
                                                        {contact.latest_activity.title || 'Activity Logged'}
                                                    </span>
                                                </>
                                            ) : (
                                                <span className="text-sm text-[#bbb] italic">No activity</span>
                                            )}
                                        </div>

                                        {/* Last Updated + Delete Action */}
                                        <div className="col-span-1 text-right flex items-center justify-end gap-2 group/actions">
                                            <span className="text-xs text-[#666]">
                                                {formatDate(contact.updated_at)}
                                            </span>

                                            {canDelete && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-[#ccc] hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
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
                <div className="flex justify-between items-center text-xs text-[#999] px-1">
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
