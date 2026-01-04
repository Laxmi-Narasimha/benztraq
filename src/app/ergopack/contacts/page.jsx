/**
 * Ergopack Contacts List Page - With Activity Tracking
 * 
 * Displays all contacts with Created By, Updated By, and Activity columns.
 * 
 * @module app/ergopack/contacts/page
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Building2, Search, Plus, RefreshCw,
    User, Clock, Phone, Mail, FileText, MessageSquare, CalendarCheck, BellDot
} from 'lucide-react';

const STATUS_OPTIONS = [
    { value: 'all', label: 'All Status' },
    { value: 'new', label: 'New' },
    { value: 'contacted', label: 'Contacted' },
    { value: 'interested', label: 'Interested' },
    { value: 'negotiating', label: 'Negotiating' },
    { value: 'proposal_sent', label: 'Proposal Sent' },
    { value: 'won', label: 'Won' },
    { value: 'lost', label: 'Lost' },
    { value: 'dormant', label: 'Dormant' },
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
    const initialStatus = searchParams.get('status') || 'all';

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

        // Auto-refresh every 30 seconds for real-time updates
        const interval = setInterval(fetchContacts, 30000);
        return () => clearInterval(interval);
    }, [fetchContacts]);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchContacts();
    };

    // Filter contacts by search query locally for instant feedback
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

    const getStatusBadgeStyle = (status) => {
        const styles = {
            new: 'bg-zinc-700 text-white',
            contacted: 'bg-zinc-600 text-white',
            interested: 'bg-zinc-500 text-white',
            negotiating: 'bg-zinc-400 text-black',
            proposal_sent: 'bg-zinc-300 text-black',
            won: 'bg-white text-black',
            lost: 'bg-zinc-800 text-zinc-400',
            dormant: 'bg-zinc-900 text-zinc-500 border border-zinc-700',
        };
        return styles[status] || 'bg-zinc-700 text-white';
    };

    const getActivityIcon = (type) => {
        return ACTIVITY_ICONS[type] || MessageSquare;
    };

    return (
        <div className="min-h-screen bg-black p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-light tracking-wide text-white flex items-center gap-3">
                        <Building2 className="w-7 h-7 text-white" />
                        All Contacts
                    </h1>
                    <p className="text-zinc-500 mt-1">
                        {stats?.total || 0} total contacts
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={fetchContacts}
                        disabled={isLoading}
                        className="border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Link href="/ergopack/contacts/new">
                        <Button className="bg-white text-black hover:bg-zinc-200">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Contact
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="pt-6">
                    <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                            <Input
                                placeholder="Search company, person..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 bg-black border-zinc-700 text-white placeholder:text-zinc-600"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full md:w-48 bg-black border-zinc-700 text-white">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-zinc-700">
                                {STATUS_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value} className="text-white focus:bg-zinc-800">
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </form>
                </CardContent>
            </Card>

            {/* Contacts Table */}
            <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12 text-zinc-500">
                            <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                            Loading contacts...
                        </div>
                    ) : filteredContacts.length === 0 ? (
                        <div className="text-center py-12">
                            <Building2 className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                            <p className="text-zinc-500 mb-4">
                                {searchQuery || statusFilter !== 'all'
                                    ? 'No contacts match your filters'
                                    : 'No contacts yet'}
                            </p>
                            <Link href="/ergopack/contacts/new">
                                <Button className="bg-white text-black hover:bg-zinc-200">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add First Contact
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[900px]">
                                <thead className="bg-zinc-800/50">
                                    <tr>
                                        <th className="text-left p-4 text-xs font-medium text-zinc-400 uppercase tracking-wider">Company</th>
                                        <th className="text-left p-4 text-xs font-medium text-zinc-400 uppercase tracking-wider">Status</th>
                                        <th className="text-left p-4 text-xs font-medium text-zinc-400 uppercase tracking-wider">Created By</th>
                                        <th className="text-left p-4 text-xs font-medium text-zinc-400 uppercase tracking-wider">Updated By</th>
                                        <th className="text-left p-4 text-xs font-medium text-zinc-400 uppercase tracking-wider">Activity</th>
                                        <th className="text-left p-4 text-xs font-medium text-zinc-400 uppercase tracking-wider">Last Updated</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800">
                                    {filteredContacts.map((contact) => {
                                        const ActivityIcon = contact.latest_activity
                                            ? getActivityIcon(contact.latest_activity.activity_type)
                                            : null;

                                        return (
                                            <tr
                                                key={contact.id}
                                                className="hover:bg-zinc-800/30 transition-colors cursor-pointer"
                                                onClick={() => window.location.href = `/ergopack/contacts/${contact.id}`}
                                            >
                                                {/* Company */}
                                                <td className="p-4">
                                                    <div>
                                                        <p className="font-medium text-white">{contact.company_name}</p>
                                                        {contact.contact_person && (
                                                            <p className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                                                                <User className="w-3 h-3" />
                                                                {contact.contact_person}
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Status */}
                                                <td className="p-4">
                                                    <Badge className={getStatusBadgeStyle(contact.status)}>
                                                        {contact.status?.replace('_', ' ')}
                                                    </Badge>
                                                </td>

                                                {/* Created By - Never changes */}
                                                <td className="p-4">
                                                    <span className="text-sm text-zinc-400">
                                                        {contact.created_by_user?.full_name || '-'}
                                                    </span>
                                                </td>

                                                {/* Updated By - Changes with each update */}
                                                <td className="p-4">
                                                    <span className="text-sm text-zinc-300">
                                                        {contact.updated_by_user?.full_name || '-'}
                                                    </span>
                                                </td>

                                                {/* Activity - Latest activity with icon */}
                                                <td className="p-4">
                                                    {contact.latest_activity ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex items-center gap-1.5 bg-zinc-800 px-2 py-1 rounded text-xs">
                                                                <ActivityIcon className="w-3 h-3 text-zinc-400" />
                                                                <span className="text-zinc-300 capitalize">
                                                                    {contact.latest_activity.activity_type?.replace('_', ' ')}
                                                                </span>
                                                            </div>
                                                            {/* New activity indicator - show if activity is from today */}
                                                            {new Date(contact.latest_activity.created_at).toDateString() === new Date().toDateString() && (
                                                                <Badge className="bg-white text-black text-[10px] px-1.5 py-0">
                                                                    NEW
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-zinc-600 text-sm">-</span>
                                                    )}
                                                </td>

                                                {/* Last Updated */}
                                                <td className="p-4 text-sm text-zinc-500">
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {new Date(contact.updated_at).toLocaleDateString()}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Auto-refresh indicator */}
            <p className="text-xs text-zinc-600 text-center">
                Auto-refreshes every 30 seconds
            </p>
        </div>
    );
}
