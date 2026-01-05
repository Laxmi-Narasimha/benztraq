/**
 * Ergopack Contacts List Page - Premium Design
 * 
 * Elegant card-based contact list with excellent readability.
 * Premium light theme with proper spacing and visual hierarchy.
 * 
 * @module app/ergopack/contacts/page
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Building2, Search, Plus, RefreshCw, ChevronRight,
    User, Clock, Phone, Mail, FileText, MessageSquare, CalendarCheck, MapPin
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
    open: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'Open' },
    new: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'New' },
    contacted: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', label: 'Contacted' },
    proposal_sent: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Proposal Sent' },
    deal_done: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Deal Done' },
    won: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Won' },
    lost: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', label: 'Lost' },
    not_serviceable: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', label: 'Not Serviceable' },
    dormant: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', label: 'Dormant' },
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
    const initialStatus = searchParams.get('status') || 'all';
    const { user } = useAuth();

    const [contacts, setContacts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState(initialStatus);
    const [stats, setStats] = useState(null);

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
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/50">
            <div className="max-w-6xl mx-auto p-6 md:p-8 space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-white" />
                            </div>
                            All Contacts
                        </h1>
                        <p className="text-slate-500 mt-1 ml-[52px]">
                            {stats?.total || 0} total contacts
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={fetchContacts}
                            disabled={isLoading}
                            className="border-slate-200 text-slate-500 hover:bg-white hover:text-slate-900 rounded-xl h-10 w-10"
                        >
                            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                        </Button>
                        <Link href="/ergopack/contacts/new">
                            <Button className="bg-slate-900 text-white hover:bg-slate-800 rounded-xl h-10 px-4">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Contact
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Search & Filter Bar */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Search company, person, city..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchContacts()}
                            className="pl-11 h-11 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl focus:ring-2 focus:ring-slate-200 focus:border-slate-300"
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full sm:w-44 h-11 bg-white border-slate-200 text-slate-700 rounded-xl focus:ring-2 focus:ring-slate-200">
                            <SelectValue placeholder="Filter by stage" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-slate-200 rounded-xl">
                            {STATUS_OPTIONS.map((opt) => (
                                <SelectItem
                                    key={opt.value}
                                    value={opt.value}
                                    className="text-slate-700 focus:bg-slate-50 rounded-lg"
                                >
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Contacts List */}
                <div className="space-y-3">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-16">
                            <RefreshCw className="w-6 h-6 animate-spin text-slate-400 mr-3" />
                            <span className="text-slate-500">Loading contacts...</span>
                        </div>
                    ) : filteredContacts.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
                            <Building2 className="w-14 h-14 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-500 mb-4 text-lg">
                                {searchQuery || statusFilter !== 'all'
                                    ? 'No contacts match your filters'
                                    : 'No contacts yet'}
                            </p>
                            <Link href="/ergopack/contacts/new">
                                <Button className="bg-slate-900 text-white hover:bg-slate-800 rounded-xl">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add First Contact
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        filteredContacts.map((contact) => {
                            const statusConfig = getStatusConfig(contact.status);
                            const ActivityIcon = getActivityIcon(contact.latest_activity?.activity_type);

                            return (
                                <Link
                                    key={contact.id}
                                    href={`/ergopack/contacts/${contact.id}`}
                                    className="block group"
                                >
                                    <div className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-lg hover:border-slate-300 transition-all duration-200">
                                        <div className="flex items-start gap-4">
                                            {/* Company Icon */}
                                            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 group-hover:bg-slate-900 transition-colors">
                                                <Building2 className="w-6 h-6 text-slate-600 group-hover:text-white transition-colors" />
                                            </div>

                                            {/* Main Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="min-w-0">
                                                        <h3 className="font-semibold text-slate-900 text-lg truncate group-hover:text-slate-700">
                                                            {contact.company_name}
                                                        </h3>
                                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-slate-500">
                                                            {contact.contact_person && (
                                                                <span className="flex items-center gap-1.5">
                                                                    <User className="w-3.5 h-3.5" />
                                                                    {contact.contact_person}
                                                                </span>
                                                            )}
                                                            {contact.city && (
                                                                <span className="flex items-center gap-1.5">
                                                                    <MapPin className="w-3.5 h-3.5" />
                                                                    {contact.city}
                                                                </span>
                                                            )}
                                                            {contact.email && (
                                                                <span className="flex items-center gap-1.5">
                                                                    <Mail className="w-3.5 h-3.5" />
                                                                    {contact.email}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Status Badge */}
                                                    <Badge className={cn(
                                                        "px-3 py-1 text-xs font-medium rounded-full border flex-shrink-0",
                                                        statusConfig.bg, statusConfig.text, statusConfig.border
                                                    )}>
                                                        {statusConfig.label}
                                                    </Badge>
                                                </div>

                                                {/* Activity & Date Row */}
                                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                                        {contact.latest_activity ? (
                                                            <>
                                                                <ActivityIcon className="w-3.5 h-3.5" />
                                                                <span className="capitalize">{contact.latest_activity.activity_type?.replace('_', ' ')}</span>
                                                                {contact.latest_activity.title && (
                                                                    <span className="text-slate-500">• {contact.latest_activity.title}</span>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <span className="text-slate-400">No recent activity</span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-xs text-slate-400">
                                                            {formatDate(contact.updated_at)}
                                                        </span>
                                                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })
                    )}
                </div>

                {/* Footer Note */}
                {!isLoading && filteredContacts.length > 0 && (
                    <p className="text-center text-xs text-slate-400 py-4">
                        Auto-refreshes every 30 seconds
                    </p>
                )}
            </div>
        </div>
    );
}
