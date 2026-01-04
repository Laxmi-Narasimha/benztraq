/**
 * Ergopack Dashboard - Black & White Interactive
 * 
 * Overview page with all status cards as clickable filters.
 * Premium black & white design.
 * 
 * @module app/ergopack/page
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Building2, Clock, Phone, TrendingUp, FileText, MessageSquare,
    CheckCircle, XCircle, Pause, Plus, ArrowRight, RefreshCw, Users
} from 'lucide-react';

// All status options matching the form
const STATUS_CARDS = [
    { key: 'total', label: 'Total', icon: Building2 },
    { key: 'new', label: 'New', icon: Clock },
    { key: 'contacted', label: 'Contacted', icon: Phone },
    { key: 'interested', label: 'Interested', icon: TrendingUp },
    { key: 'negotiating', label: 'Negotiating', icon: MessageSquare },
    { key: 'proposal_sent', label: 'Proposal Sent', icon: FileText },
    { key: 'won', label: 'Won', icon: CheckCircle },
    { key: 'lost', label: 'Lost', icon: XCircle },
    { key: 'dormant', label: 'Dormant', icon: Pause },
];

export default function ErgopackDashboard() {
    const [stats, setStats] = useState(null);
    const [recentContacts, setRecentContacts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/ergopack/contacts');
            const data = await response.json();

            if (data.stats) setStats(data.stats);
            if (data.contacts) setRecentContacts(data.contacts.slice(0, 5));
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatValue = (key) => {
        if (isLoading) return '-';
        if (key === 'total') return stats?.total || 0;
        return stats?.[key] || 0;
    };

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

    return (
        <div className="min-h-screen bg-black p-8 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-light tracking-wide text-white">Dashboard</h1>
                    <p className="text-zinc-500 mt-1">Track your company outreach</p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={fetchData}
                        disabled={isLoading}
                        className="border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Link href="/ergopack/contacts/new">
                        <Button className="bg-white text-black hover:bg-zinc-200">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Contact
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats Grid - All statuses, clickable */}
            <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3">
                {STATUS_CARDS.map((stat) => {
                    const value = getStatValue(stat.key);
                    const isClickable = stat.key !== 'total' && value > 0;

                    const CardWrapper = isClickable ? Link : 'div';
                    const cardProps = isClickable ? { href: `/ergopack/contacts?status=${stat.key}` } : {};

                    return (
                        <CardWrapper key={stat.key} {...cardProps}>
                            <Card className={`bg-zinc-900 border-zinc-800 transition-all ${isClickable ? 'cursor-pointer hover:bg-zinc-800 hover:border-zinc-600' : ''
                                } ${stat.key === 'total' ? 'col-span-1 md:col-span-1' : ''}`}>
                                <CardContent className="pt-4 pb-3 px-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <stat.icon className="w-4 h-4 text-zinc-500" />
                                    </div>
                                    <p className="text-2xl font-light text-white">{value}</p>
                                    <p className="text-xs text-zinc-500 mt-1 truncate">{stat.label}</p>
                                </CardContent>
                            </Card>
                        </CardWrapper>
                    );
                })}
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Contacts - Larger */}
                <Card className="bg-zinc-900 border-zinc-800 lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                        <div>
                            <CardTitle className="text-white font-light text-lg">Recent Activity</CardTitle>
                            <CardDescription className="text-zinc-500">
                                Latest updates to your contacts
                            </CardDescription>
                        </div>
                        <Link href="/ergopack/contacts">
                            <Button variant="ghost" className="text-zinc-400 hover:text-white hover:bg-zinc-800">
                                View All
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="text-center py-8 text-zinc-500">Loading...</div>
                        ) : recentContacts.length === 0 ? (
                            <div className="text-center py-12">
                                <Building2 className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                                <p className="text-zinc-500 mb-4">No contacts yet</p>
                                <Link href="/ergopack/contacts/new">
                                    <Button className="bg-white text-black hover:bg-zinc-200">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add First Contact
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {recentContacts.map((contact) => (
                                    <Link
                                        key={contact.id}
                                        href={`/ergopack/contacts/${contact.id}`}
                                        className="flex items-center justify-between p-4 bg-zinc-800/30 rounded-lg hover:bg-zinc-800/60 transition-colors group"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-white truncate group-hover:text-white">
                                                {contact.company_name}
                                            </p>
                                            <p className="text-sm text-zinc-500 truncate">
                                                {contact.contact_person || 'No contact person'}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                                            <Badge className={getStatusBadgeStyle(contact.status)}>
                                                {contact.status?.replace('_', ' ')}
                                            </Badge>
                                            <span className="text-xs text-zinc-600 hidden sm:block">
                                                {new Date(contact.updated_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Quick Actions & Summary */}
                <div className="space-y-6">
                    {/* Quick Actions */}
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-white font-light">Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Link href="/ergopack/contacts/new" className="block">
                                <Button variant="outline" className="w-full justify-start border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white h-11">
                                    <Plus className="w-4 h-4 mr-3" />
                                    Add New Contact
                                </Button>
                            </Link>
                            <Link href="/ergopack/contacts?status=new" className="block">
                                <Button variant="outline" className="w-full justify-start border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white h-11">
                                    <Clock className="w-4 h-4 mr-3" />
                                    View New Leads ({stats?.new || 0})
                                </Button>
                            </Link>
                            <Link href="/ergopack/contacts?status=interested" className="block">
                                <Button variant="outline" className="w-full justify-start border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white h-11">
                                    <TrendingUp className="w-4 h-4 mr-3" />
                                    View Interested ({stats?.interested || 0})
                                </Button>
                            </Link>
                            <Link href="/ergopack/contacts?status=proposal_sent" className="block">
                                <Button variant="outline" className="w-full justify-start border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white h-11">
                                    <FileText className="w-4 h-4 mr-3" />
                                    Proposals Sent ({stats?.proposal_sent || 0})
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    {/* Conversion Stats */}
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-white font-light">Conversion</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-zinc-400">Won</span>
                                    <span className="text-2xl font-light text-white">{stats?.won || 0}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-zinc-400">Lost</span>
                                    <span className="text-2xl font-light text-zinc-500">{stats?.lost || 0}</span>
                                </div>
                                <div className="h-px bg-zinc-800 my-3" />
                                <div className="flex items-center justify-between">
                                    <span className="text-zinc-400">Win Rate</span>
                                    <span className="text-xl font-light text-white">
                                        {stats?.total && stats.won
                                            ? `${Math.round((stats.won / stats.total) * 100)}%`
                                            : '0%'
                                        }
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
