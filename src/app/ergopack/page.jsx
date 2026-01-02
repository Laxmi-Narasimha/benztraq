/**
 * Ergopack Dashboard
 * 
 * Overview page for Ergopack India CRM.
 * Shows contact stats, recent activity, and quick actions.
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
    Building2, Users, Phone, CheckCircle, XCircle,
    Clock, TrendingUp, Plus, ArrowRight, RefreshCw
} from 'lucide-react';

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

    const statCards = [
        { title: 'Total Contacts', value: stats?.total || 0, icon: Building2, color: 'text-blue-400', bg: 'bg-blue-500/10' },
        { title: 'New', value: stats?.new || 0, icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/10' },
        { title: 'Contacted', value: stats?.contacted || 0, icon: Phone, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
        { title: 'Interested', value: stats?.interested || 0, icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-500/10' },
        { title: 'Won', value: stats?.won || 0, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        { title: 'Lost', value: stats?.lost || 0, icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
    ];

    return (
        <div className="p-8 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Ergopack Dashboard</h1>
                    <p className="text-slate-400 mt-1">Track your company outreach and follow-ups</p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={fetchData}
                        className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                    <Link href="/ergopack/contacts/new">
                        <Button className="bg-emerald-600 hover:bg-emerald-700">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Contact
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {statCards.map((stat) => (
                    <Card key={stat.title} className="bg-slate-800 border-slate-700">
                        <CardContent className="pt-5 pb-4">
                            <div className="flex items-center justify-between mb-2">
                                <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-white">
                                {isLoading ? '-' : stat.value}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">{stat.title}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Recent Contacts */}
            <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-white">Recent Contacts</CardTitle>
                        <CardDescription className="text-slate-400">
                            Latest companies added or updated
                        </CardDescription>
                    </div>
                    <Link href="/ergopack/contacts">
                        <Button variant="ghost" className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10">
                            View All
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </Link>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-8 text-slate-400">Loading...</div>
                    ) : recentContacts.length === 0 ? (
                        <div className="text-center py-8">
                            <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                            <p className="text-slate-400 mb-4">No contacts yet</p>
                            <Link href="/ergopack/contacts/new">
                                <Button className="bg-emerald-600 hover:bg-emerald-700">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add First Contact
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {recentContacts.map((contact) => (
                                <Link
                                    key={contact.id}
                                    href={`/ergopack/contacts/${contact.id}`}
                                    className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-white truncate">
                                            {contact.company_name}
                                        </p>
                                        <p className="text-sm text-slate-400 truncate">
                                            {contact.contact_person || 'No contact person'}
                                            {contact.city && ` · ${contact.city}`}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3 ml-4">
                                        <Badge className={`${STATUS_COLORS[contact.status]} border`}>
                                            {contact.status}
                                        </Badge>
                                        <span className="text-xs text-slate-500">
                                            {new Date(contact.updated_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pipeline Summary */}
                <Card className="bg-slate-800 border-slate-700">
                    <CardHeader>
                        <CardTitle className="text-white">Pipeline Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {['new', 'contacted', 'interested', 'negotiating', 'proposal_sent'].map((status) => {
                                const count = stats?.[status] || 0;
                                const percentage = stats?.total ? Math.round((count / stats.total) * 100) : 0;

                                return (
                                    <div key={status} className="flex items-center gap-3">
                                        <span className="w-24 text-sm text-slate-400 capitalize">{status.replace('_', ' ')}</span>
                                        <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-emerald-500 rounded-full transition-all"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                        <span className="w-12 text-right text-sm text-slate-400">{count}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="bg-slate-800 border-slate-700">
                    <CardHeader>
                        <CardTitle className="text-white">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Link href="/ergopack/contacts/new">
                            <Button variant="outline" className="w-full justify-start border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white">
                                <Plus className="w-4 h-4 mr-3" />
                                Add New Contact
                            </Button>
                        </Link>
                        <Link href="/ergopack/contacts?status=new">
                            <Button variant="outline" className="w-full justify-start border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white">
                                <Clock className="w-4 h-4 mr-3" />
                                View New Leads
                            </Button>
                        </Link>
                        <Link href="/ergopack/contacts?status=interested">
                            <Button variant="outline" className="w-full justify-start border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white">
                                <TrendingUp className="w-4 h-4 mr-3" />
                                View Interested
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
