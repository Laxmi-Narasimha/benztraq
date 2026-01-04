/**
 * Ergopack Contacts List Page - Black & White Theme
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
    Building2, Search, Plus, RefreshCw,
    Phone, Mail, MapPin, User, Clock
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
                <Link href="/ergopack/contacts/new">
                    <Button className="bg-white text-black hover:bg-zinc-200">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Contact
                    </Button>
                </Link>
            </div>

            {/* Filters */}
            <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="pt-6">
                    <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                            <Input
                                placeholder="Search company, person, or city..."
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
                        <Button type="submit" variant="outline" className="border-zinc-700 text-zinc-400 hover:bg-zinc-800">
                            <RefreshCw className="w-4 h-4" />
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Contacts Table */}
            <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12 text-zinc-500">
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
                            <table className="w-full">
                                <thead className="bg-zinc-800/50">
                                    <tr>
                                        <th className="text-left p-4 text-sm font-medium text-zinc-400">Company</th>
                                        <th className="text-left p-4 text-sm font-medium text-zinc-400">Contact</th>
                                        <th className="text-left p-4 text-sm font-medium text-zinc-400">Location</th>
                                        <th className="text-left p-4 text-sm font-medium text-zinc-400">Status</th>
                                        <th className="text-left p-4 text-sm font-medium text-zinc-400">Last Updated</th>
                                        <th className="text-left p-4 text-sm font-medium text-zinc-400">Updated By</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800">
                                    {filteredContacts.map((contact) => (
                                        <tr
                                            key={contact.id}
                                            className="hover:bg-zinc-800/30 transition-colors cursor-pointer"
                                            onClick={() => window.location.href = `/ergopack/contacts/${contact.id}`}
                                        >
                                            <td className="p-4">
                                                <div>
                                                    <p className="font-medium text-white">{contact.company_name}</p>
                                                    {contact.industry && (
                                                        <p className="text-xs text-zinc-600">{contact.industry}</p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-sm">
                                                    {contact.contact_person ? (
                                                        <>
                                                            <p className="text-zinc-300 flex items-center gap-1">
                                                                <User className="w-3 h-3 text-zinc-600" />
                                                                {contact.contact_person}
                                                            </p>
                                                            {contact.email && (
                                                                <p className="text-zinc-600 flex items-center gap-1">
                                                                    <Mail className="w-3 h-3" />
                                                                    {contact.email}
                                                                </p>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <span className="text-zinc-600">-</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                {contact.city ? (
                                                    <span className="text-zinc-400 flex items-center gap-1 text-sm">
                                                        <MapPin className="w-3 h-3 text-zinc-600" />
                                                        {contact.city}{contact.state && `, ${contact.state}`}
                                                    </span>
                                                ) : (
                                                    <span className="text-zinc-600">-</span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <Badge className="bg-zinc-800 text-zinc-300 border border-zinc-700 capitalize">
                                                    {contact.status?.replace('_', ' ')}
                                                </Badge>
                                            </td>
                                            <td className="p-4 text-sm text-zinc-500">
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(contact.updated_at).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm text-zinc-500">
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
