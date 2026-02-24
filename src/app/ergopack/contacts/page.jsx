/**
 * Contacts List Page - Clean White Theme
 * 
 * Features:
 * - Pagination (Default 10 items)
 * - Distinct Status Colors
 * - No Auto-Refresh
 * - White Background #FFFFFF
 * - Black Text #000000
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
    Ban, CheckCircle, XCircle, AlertCircle, Download, Eye, ArrowUpDown, ArrowDown, ArrowUp, Loader2
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

// Status Configuration - Distinct Colors
const STATUS_CONFIG = {
    open: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', dot: 'bg-yellow-500', label: 'Open' },
    new: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500', label: 'New' },
    contacted: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500', label: 'Contacted' },
    proposal_sent: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500', label: 'Proposal Sent' },
    deal_done: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', dot: 'bg-green-500', label: 'Deal Done' },
    won: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500', label: 'Won' },
    lost: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500', label: 'Lost' },
    not_serviceable: { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', dot: 'bg-gray-400', label: 'Not Serviceable' },
    dormant: { bg: 'bg-gray-100', text: 'text-gray-500', border: 'border-gray-200', dot: 'bg-gray-400', label: 'Dormant' },
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

    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalContacts, setTotalContacts] = useState(0);

    const fetchContacts = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (statusFilter !== 'all') params.set('status', statusFilter);
            if (searchQuery) params.set('search', searchQuery);
            params.set('page', currentPage.toString());
            params.set('limit', itemsPerPage.toString());
            params.set('sort_by', sortBy);

            const response = await fetch(`/api/ergopack/contacts?${params}`);
            const data = await response.json();

            if (data.contacts) setContacts(data.contacts);
            if (data.stats) setStats(data.stats);
            if (data.total) setTotalContacts(data.total); // Set total contacts for pagination
        } catch (error) {
            console.error('Error fetching contacts:', error);
            toast.error('Failed to load contacts.');
        } finally {
            setIsLoading(false);
        }
    }, [statusFilter, searchQuery, currentPage, itemsPerPage, sortBy]);

    // Cleanup: Removed 30s auto-refresh interval
    useEffect(() => {
        fetchContacts();
    }, [fetchContacts]);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter, searchQuery, itemsPerPage, sortBy]);

    // Pagination Logic
    const totalPages = Math.ceil(totalContacts / itemsPerPage) || 1;
    const paginatedContacts = contacts;

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
        <div className="min-h-screen bg-white text-black font-sans">
            <div className="max-w-[1600px] mx-auto p-6 md:p-8 space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                            Contacts
                            <span className="ml-3 text-sm font-medium text-[#AD7D56] bg-[#AD7D56]/10 px-2 py-1 rounded-full align-middle">
                                {totalContacts} Total
                            </span>
                        </h1>
                        <p className="text-gray-500 mt-1 text-sm">Manage your outreach pipeline and relationships.</p>
                    </div>
                    <Link href="/ergopack/contacts/new">
                        <Button className="bg-[#AD7D56] hover:bg-[#8c6546] text-white shadow-md hover:shadow-lg transition-all">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Contact
                        </Button>
                    </Link>
                </div>

                {/* Controls */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white sticky top-0 z-10 py-2">
                    <div className="relative w-full md:w-96 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#AD7D56] transition-colors" />
                        <Input
                            placeholder="Search by company, person..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-10 bg-white border-gray-200 text-black focus:border-[#AD7D56] focus:ring-1 focus:ring-[#AD7D56]/20 rounded-lg shadow-sm"
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <Select value={itemsPerPage.toString()} onValueChange={(v) => setItemsPerPage(Number(v))}>
                            <SelectTrigger className="w-[180px] h-10 bg-white border-gray-200 text-black shadow-sm">
                                <SelectValue placeholder="Items per page" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="10">10 per page</SelectItem>
                                <SelectItem value="25">25 per page</SelectItem>
                                <SelectItem value="50">50 per page</SelectItem>
                                <SelectItem value="100">100 per page</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[180px] h-10 bg-white border-gray-200 text-black shadow-sm">
                                <SelectValue placeholder="All Stages" />
                            </SelectTrigger>
                            <SelectContent>
                                {STATUS_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Data Grid */}
                <div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
                    {/* Header */}
                    <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-gray-100 bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <div className="col-span-3">Company</div>
                        <div className="col-span-2 text-center">Status</div>
                        <div className="col-span-2">Created By</div>
                        <div className="col-span-1 text-center">PDF</div>
                        <div className="col-span-1 text-center">Quote</div>
                        <div className="col-span-2">Latest Activity</div>
                        <div className="col-span-1 text-right">Updated</div>
                    </div>

                    <div className="divide-y divide-gray-100">
                        {isLoading ? (
                            <div className="p-12 text-center text-gray-400">
                                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3 text-[#AD7D56]" />
                                <span className="text-sm">Loading contacts...</span>
                            </div>
                        ) : paginatedContacts.length === 0 ? (
                            <div className="p-12 text-center text-gray-400">
                                <p className="text-sm">No contacts found</p>
                            </div>
                        ) : (
                            paginatedContacts.map((contact) => {
                                const statusConfig = getStatusConfig(contact.status);
                                const ActivityIcon = getActivityIcon(contact.latest_activity?.activity_type);
                                const hasUnseenUpdate = isUnseen(contact);

                                return (
                                    <Link
                                        key={contact.id}
                                        href={`/ergopack/contacts/${contact.id}`}
                                        className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-gray-50 transition-colors group cursor-pointer"
                                    >
                                        {/* Company */}
                                        <div className="col-span-3 overflow-hidden">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 flex-shrink-0 group-hover:border-[#AD7D56]/30 group-hover:text-[#AD7D56] transition-colors">
                                                    <Building2 className="w-5 h-5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="text-sm font-semibold text-gray-900 truncate flex items-center gap-2">
                                                        {contact.company_name}
                                                    </h3>
                                                    {contact.contact_person && (
                                                        <p className="text-xs text-gray-500 truncate mt-0.5">
                                                            {contact.contact_person}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status */}
                                        <div className="col-span-2 flex justify-center">
                                            <Badge className={`${status.bg} ${status.text} border ${status.border} shadow-sm px-2.5 py-0.5 rounded-full flex items-center gap-1.5`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                                                {status.label}
                                            </Badge>
                                        </div>

                                        {/* Created By */}
                                        <div className="col-span-2 flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600">
                                                {contact.created_by_user?.full_name?.charAt(0) || 'U'}
                                            </div>
                                            <span className="text-sm text-gray-500 truncate">
                                                {contact.created_by_user?.full_name?.split(' ')[0] || 'Unknown'}
                                            </span>
                                        </div>

                                        {/* PDF & Quote */}
                                        <div className="col-span-1 flex justify-center">
                                            {contact.presentation_file_path ? (
                                                <FileText className="w-4 h-4 text-gray-400" />
                                            ) : (
                                                <span className="text-gray-300">-</span>
                                            )}
                                        </div>
                                        <div className="col-span-1 flex justify-center">
                                            {contact.quotation_file_path ? (
                                                <Download className="w-4 h-4 text-[#AD7D56]" />
                                            ) : (
                                                <span className="text-gray-300">-</span>
                                            )}
                                        </div>

                                        {/* Latest Activity */}
                                        <div className="col-span-2 text-gray-500 text-sm truncate">
                                            {contact.latest_activity?.title || '-'}
                                        </div>

                                        {/* Updated */}
                                        <div className="col-span-1 text-right text-xs text-gray-400">
                                            {new Date(contact.updated_at).toLocaleDateString()}
                                        </div>
                                    </Link>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center justify-between px-2">
                    <p className="text-sm text-gray-500">
                        Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalContacts)} to {Math.min(currentPage * itemsPerPage, totalContacts)} of {totalContacts} entries
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="bg-white hover:bg-gray-50 text-black border-gray-200"
                        >
                            Previous
                        </Button>
                        <div className="flex items-center gap-1 px-2">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${currentPage === page
                                        ? 'bg-[#AD7D56] text-white shadow-sm'
                                        : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                >
                                    {page}
                                </button>
                            ))}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="bg-white hover:bg-gray-50 text-black border-gray-200"
                        >
                            Next
                        </Button>
                    </div>
                </div>

                {/* Footer Note */}
                <div className="flex justify-between items-center text-xs text-gray-400 px-1 border-t border-gray-100 pt-4">
                    <span>ErgoPack India CRM v2.0</span>
                    <div className="flex gap-4">
                        <span>Secure Connection</span>
                        <span>•</span>
                        <span>{new Date().toLocaleDateString()}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
