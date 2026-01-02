/**
 * Ergopack Contacts List Page
 * 
 * Displays all contacts with filters and search.
 * 
 * @module app/ergopack/contacts/page
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Building2, Search, Plus, RefreshCw, Filter,
    Phone, Mail, MapPin, User, Clock, ArrowUpDown
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

const STATUS_COLORS = {
    new: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    contacted: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    interested: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    negotiating: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    proposal_sent: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    won: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    lost: 'bg-red-500/20 text-red-400 border-red-500/30',
    dormant: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

export default function ContactsListPage() {
    const searchParams = useSearchParams();
    const initialStatus = searchParams.get('status') || 'all';

    const [contacts, setContacts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState(initialStatus);
    const [stats, setStats] = useState(null);

    useEffect(() => {
        fetchContacts();
    }, [statusFilter]);

    const fetchContacts = async () => {
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
    };

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

    return (
        <div className="p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Building2 className="w-7 h-7 text-emerald-400" />
                        All Contacts
                    </h1>
                    <p className="text-slate-400 mt-1">
                        {stats?.total || 0} total contacts
                    </p>
                </div>
                <Link href="/ergopack/contacts/new">
                    <Button className="bg-emerald-600 hover:bg-emerald-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Contact
                    </Button>
                </Link>
            </div>

            {/* Filters */}
            <Card className="bg-slate-800 border-slate-700">
                <CardContent className="pt-6">
                    <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Search company, person, or city..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full md:w-48 bg-slate-700 border-slate-600 text-white">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-700 border-slate-600">
                                {STATUS_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button type="submit" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                            <RefreshCw className="w-4 h-4" />
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Contacts Table */}
            <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12 text-slate-400">
                            Loading contacts...
                        </div>
                    ) : filteredContacts.length === 0 ? (
                        <div className="text-center py-12">
                            <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                            <p className="text-slate-400 mb-4">
                                {searchQuery || statusFilter !== 'all'
                                    ? 'No contacts match your filters'
                                    : 'No contacts yet'}
                            </p>
                            <Link href="/ergopack/contacts/new">
                                <Button className="bg-emerald-600 hover:bg-emerald-700">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add First Contact
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-700/50">
                                    <tr>
                                        <th className="text-left p-4 text-sm font-medium text-slate-300">Company</th>
                                        <th className="text-left p-4 text-sm font-medium text-slate-300">Contact</th>
                                        <th className="text-left p-4 text-sm font-medium text-slate-300">Location</th>
                                        <th className="text-left p-4 text-sm font-medium text-slate-300">Status</th>
                                        <th className="text-left p-4 text-sm font-medium text-slate-300">Last Updated</th>
                                        <th className="text-left p-4 text-sm font-medium text-slate-300">Updated By</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                    {filteredContacts.map((contact) => (
                                        <tr
                                            key={contact.id}
                                            className="hover:bg-slate-700/30 transition-colors cursor-pointer"
                                            onClick={() => window.location.href = `/ergopack/contacts/${contact.id}`}
                                        >
                                            <td className="p-4">
                                                <div>
                                                    <p className="font-medium text-white">{contact.company_name}</p>
                                                    {contact.industry && (
                                                        <p className="text-xs text-slate-500">{contact.industry}</p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-sm">
                                                    {contact.contact_person ? (
                                                        <>
                                                            <p className="text-slate-300 flex items-center gap-1">
                                                                <User className="w-3 h-3 text-slate-500" />
                                                                {contact.contact_person}
                                                            </p>
                                                            {contact.email && (
                                                                <p className="text-slate-500 flex items-center gap-1">
                                                                    <Mail className="w-3 h-3" />
                                                                    {contact.email}
                                                                </p>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <span className="text-slate-500">-</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                {contact.city ? (
                                                    <span className="text-slate-300 flex items-center gap-1 text-sm">
                                                        <MapPin className="w-3 h-3 text-slate-500" />
                                                        {contact.city}{contact.state && `, ${contact.state}`}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-500">-</span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <Badge className={`${STATUS_COLORS[contact.status]} border capitalize`}>
                                                    {contact.status?.replace('_', ' ')}
                                                </Badge>
                                            </td>
                                            <td className="p-4 text-sm text-slate-400">
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(contact.updated_at).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm text-slate-400">
                                                {contact.updated_by_user?.full_name || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
