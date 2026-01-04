/**
 * Ergopack Dashboard - Black & White Theme
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
        { title: 'Total Contacts', value: stats?.total || 0, icon: Building2 },
        { title: 'New', value: stats?.new || 0, icon: Clock },
        { title: 'Contacted', value: stats?.contacted || 0, icon: Phone },
        { title: 'Interested', value: stats?.interested || 0, icon: TrendingUp },
        { title: 'Won', value: stats?.won || 0, icon: CheckCircle },
        { title: 'Lost', value: stats?.lost || 0, icon: XCircle },
    ];

    return (
        <div className="min-h-screen bg-black p-8 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-light tracking-wide text-white">Ergopack Dashboard</h1>
                    <p className="text-zinc-500 mt-1">Track your company outreach</p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={fetchData}
                        className="border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
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

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {statCards.map((stat) => (
                    <Card key={stat.title} className="bg-zinc-900 border-zinc-800">
                        <CardContent className="pt-5 pb-4">
                            <div className="flex items-center justify-between mb-2">
                                <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                                    <stat.icon className="w-5 h-5 text-white" />
                                </div>
                            </div>
                            <p className="text-2xl font-light text-white">
                                {isLoading ? '-' : stat.value}
                            </p>
                            <p className="text-xs text-zinc-500 mt-1">{stat.title}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Recent Contacts */}
            <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-white font-light">Recent Contacts</CardTitle>
                        <CardDescription className="text-zinc-500">
                            Latest companies added or updated
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
                        <div className="text-center py-8">
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
                        <div className="space-y-3">
                            {recentContacts.map((contact) => (
                                <Link
                                    key={contact.id}
                                    href={`/ergopack/contacts/${contact.id}`}
                                    className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-white truncate">
                                            {contact.company_name}
                                        </p>
                                        <p className="text-sm text-zinc-500 truncate">
                                            {contact.contact_person || 'No contact person'}
                                            {contact.city && ` · ${contact.city}`}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3 ml-4">
                                        <Badge className="bg-zinc-800 text-zinc-300 border border-zinc-700">
                                            {contact.status}
                                        </Badge>
                                        <span className="text-xs text-zinc-600">
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
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-white font-light">Pipeline Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {['new', 'contacted', 'interested', 'negotiating', 'proposal_sent'].map((status) => {
                                const count = stats?.[status] || 0;
                                const percentage = stats?.total ? Math.round((count / stats.total) * 100) : 0;

                                return (
                                    <div key={status} className="flex items-center gap-3">
                                        <span className="w-24 text-sm text-zinc-500 capitalize">{status.replace('_', ' ')}</span>
                                        <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-white rounded-full transition-all"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                        <span className="w-12 text-right text-sm text-zinc-500">{count}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-white font-light">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Link href="/ergopack/contacts/new">
                            <Button variant="outline" className="w-full justify-start border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white">
                                <Plus className="w-4 h-4 mr-3" />
                                Add New Contact
                            </Button>
                        </Link>
                        <Link href="/ergopack/contacts?status=new">
                            <Button variant="outline" className="w-full justify-start border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white">
                                <Clock className="w-4 h-4 mr-3" />
                                View New Leads
                            </Button>
                        </Link>
                        <Link href="/ergopack/contacts?status=interested">
                            <Button variant="outline" className="w-full justify-start border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white">
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
