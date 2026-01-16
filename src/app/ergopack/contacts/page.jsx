/**
 * Ergopack Contacts List Page - Premium Dark Data Grid
 * 
 * High-end immersive dark theme design.
 * Features a sleek data grid layout with columns: 
 * Company, Status, Created By, Updated By, Activity, Last Updated.
 * Includes "New" badge logic and Delete functionality.
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
    Ban, CheckCircle, XCircle, AlertCircle, Download, Eye
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
    open: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', label: 'Open' },
    new: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', label: 'New' },
    contacted: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20', label: 'Contacted' },
    proposal_sent: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', label: 'Proposal Sent' },
    deal_done: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', label: 'Deal Done' },
    won: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', label: 'Won' },
    lost: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', label: 'Lost' },
    not_serviceable: { bg: 'bg-zinc-800', text: 'text-zinc-500', border: 'border-zinc-700', label: 'Not Serviceable' },
    dormant: { bg: 'bg-zinc-800', text: 'text-zinc-500', border: 'border-zinc-700', label: 'Dormant' },
};

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

    const filteredContacts = contacts.filter(contact => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            contact.company_name?.toLowerCase().includes(query) ||
            contact.contact_person?.toLowerCase().includes(query) ||
            contact.email?.toLowerCase().includes(query) ||
            contact.city?.toLowerCase().includes(query)
        );
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
        <div className="min-h-screen bg-[#050505] text-zinc-300 font-sans selection:bg-white/20">
            <div className="max-w-[1600px] mx-auto p-6 md:p-8 space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-zinc-900 pb-8">
                    <div>
                        <h1 className="text-3xl font-light tracking-wide text-white flex items-center gap-3">
                            Contacts
                            <span className="text-sm font-normal text-zinc-600 bg-zinc-900/50 px-3 py-1 rounded-full border border-zinc-800">
                                {stats?.total || 0}
                            </span>
                        </h1>
                        <p className="text-zinc-500 mt-2 font-light">
                            Manage your outreach pipeline and relationships.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={fetchContacts}
                            disabled={isLoading}
                            className="bg-black border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-white hover:border-zinc-700 h-11 w-11 p-0 rounded-lg transition-all"
                        >
                            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                        </Button>
                        <Link href="/ergopack/contacts/new">
                            <Button className="bg-white text-black hover:bg-zinc-200 h-11 px-6 rounded-lg font-medium tracking-wide transition-all shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)]">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Contact
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-zinc-400 transition-colors" />
                        <Input
                            placeholder="Search by company, person..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchContacts()}
                            className="pl-11 h-12 bg-zinc-900/30 border-zinc-800 text-zinc-200 placeholder:text-zinc-700 rounded-xl focus:ring-1 focus:ring-white/20 focus:border-white/20 transition-all font-light"
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full sm:w-56 h-12 bg-zinc-900/30 border-zinc-800 text-zinc-300 rounded-xl focus:ring-1 focus:ring-white/20 font-light hover:bg-zinc-900/50 transition-all">
                            <SelectValue placeholder="Filter by stage" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800 rounded-xl shadow-2xl">
                            {STATUS_OPTIONS.map((opt) => (
                                <SelectItem
                                    key={opt.value}
                                    value={opt.value}
                                    className="text-zinc-300 focus:bg-zinc-800 focus:text-white rounded-lg my-1 cursor-pointer"
                                >
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Premium Data Grid */}
                <div className="rounded-2xl border border-zinc-800/60 overflow-hidden bg-zinc-900/20 backdrop-blur-sm">
                    {/* Grid Header */}
                    <div className="grid grid-cols-14 gap-4 px-6 py-4 border-b border-zinc-800/60 bg-zinc-900/40 text-xs font-medium text-zinc-500 uppercase tracking-widest">
                        <div className="col-span-3">Company</div>
                        <div className="col-span-2 hidden sm:block">Status</div>
                        <div className="col-span-2 hidden md:block">Created By</div>
                        <div className="col-span-1 hidden lg:block text-center">Presentation</div>
                        <div className="col-span-1 hidden lg:block text-center">Quotation</div>
                        <div className="col-span-3 hidden xl:block">Latest Activity</div>
                        <div className="col-span-2 text-right">Last Updated</div>
                    </div>

                    {/* Grid Body */}
                    <div className="divide-y divide-zinc-800/40">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-24 text-zinc-600">
                                <RefreshCw className="w-6 h-6 animate-spin mb-3 text-zinc-700" />
                                <span className="text-sm font-light">Loading data...</span>
                            </div>
                        ) : filteredContacts.length === 0 ? (
                            <div className="text-center py-24">
                                <div className="w-16 h-16 rounded-2xl bg-zinc-900/50 flex items-center justify-center mx-auto mb-4 border border-zinc-800">
                                    <Building2 className="w-6 h-6 text-zinc-700" />
                                </div>
                                <p className="text-zinc-400 mb-6 font-light text-lg">No contacts found</p>
                                <Link href="/ergopack/contacts/new">
                                    <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white">
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
                                        className="grid grid-cols-14 gap-4 px-6 py-5 items-center hover:bg-zinc-800/30 transition-all duration-200 group cursor-pointer relative"
                                    >
                                        {/* Hover Highlight Line */}
                                        <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-white opacity-0 group-hover:opacity-100 transition-opacity" />

                                        {/* Company */}
                                        <div className="col-span-3 overflow-hidden relative">
                                            {/* Unseen Dot - Mobile optimized */}
                                            {hasUnseenUpdate && (
                                                <div className="absolute -left-3 top-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse md:hidden" />
                                            )}

                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-zinc-900 flex items-center justify-center border border-zinc-800 text-zinc-500 group-hover:text-white group-hover:border-zinc-600 transition-all flex-shrink-0">
                                                    <Building2 className="w-5 h-5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="text-sm font-medium text-zinc-200 group-hover:text-white truncate transition-colors flex items-center gap-2">
                                                        {contact.company_name}
                                                    </h3>
                                                    {contact.contact_person && (
                                                        <p className="text-xs text-zinc-600 group-hover:text-zinc-500 truncate mt-0.5">
                                                            {contact.contact_person}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status */}
                                        <div className="col-span-2 hidden sm:flex items-center">
                                            <Badge className={cn(
                                                "px-2.5 py-0.5 text-[10px] font-medium tracking-wide uppercase rounded-full border bg-transparent",
                                                statusConfig.text, statusConfig.border
                                            )}>
                                                {statusConfig.label}
                                            </Badge>
                                        </div>

                                        {/* Created By */}
                                        <div className="col-span-2 hidden md:flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] text-zinc-400">
                                                {contact.created_by_user?.full_name?.charAt(0) || 'U'}
                                            </div>
                                            <span className="text-xs text-zinc-400 truncate max-w-[100px]">
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
                                                <span className="text-zinc-700 text-xs">-</span>
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
                                                    className="w-8 h-8 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 flex items-center justify-center text-blue-400 hover:text-blue-300 transition-all"
                                                    title={`Download: ${contact.quotation_file_name || 'Quotation'}`}
                                                >
                                                    <Download className="w-4 h-4" />
                                                </button>
                                            ) : (
                                                <span className="text-zinc-700 text-xs">-</span>
                                            )}
                                        </div>

                                        {/* Latest Activity + NEW Badge */}
                                        <div className="col-span-3 hidden xl:flex items-center gap-2 text-zinc-500 min-w-0">
                                            {hasUnseenUpdate && (
                                                <Badge className="bg-blue-600 hover:bg-blue-600 text-white border-0 text-[9px] px-1.5 py-0 h-4 mr-1">
                                                    NEW
                                                </Badge>
                                            )}

                                            {contact.latest_activity ? (
                                                <>
                                                    <ActivityIcon className="w-3.5 h-3.5 flex-shrink-0 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                                                    <span className="text-xs truncate group-hover:text-zinc-400 transition-colors">
                                                        {contact.latest_activity.title || 'Activity Logged'}
                                                    </span>
                                                </>
                                            ) : (
                                                <span className="text-xs text-zinc-700 italic">No activity</span>
                                            )}
                                        </div>

                                        {/* Last Updated + Delete Action */}
                                        <div className="col-span-2 text-right flex items-center justify-end gap-3 group/actions">
                                            <span className="text-xs text-zinc-500 font-mono group-hover:text-zinc-400 transition-colors">
                                                {formatDate(contact.updated_at)}
                                            </span>

                                            {/* Delete Button (Visible on hover for authorized users) */}
                                            {canDelete && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-zinc-600 hover:text-red-400 hover:bg-zinc-800 opacity-0 group-hover/actions:opacity-100 transition-all md:opacity-0 sm:opacity-100" // Always show on mobile? Hover logic tricky on touch.
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
                <div className="flex justify-between items-center text-xs text-zinc-700 px-2 font-mono">
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
