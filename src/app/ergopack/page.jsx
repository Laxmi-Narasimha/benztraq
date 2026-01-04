/**
 * Ergopack Dashboard - Premium Light Theme
 * 
 * Overview page with status cards as clickable filters.
 * Premium light theme with slate grays and clean design.
 * 
 * New Stages: Open, Contacted, Proposal Sent, Deal Done, Lost, Not Serviceable
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
    Building2, Clock, Phone, FileText, CheckCircle, XCircle,
    Plus, ArrowRight, RefreshCw, Users, Ban, TrendingUp
} from 'lucide-react';

// Updated status cards matching new stages
const STATUS_CARDS = [
    { key: 'total', label: 'Total', icon: Building2, color: 'bg-slate-100 text-slate-900' },
    { key: 'open', label: 'Open', icon: Clock, color: 'bg-blue-50 text-blue-700' },
    { key: 'contacted', label: 'Contacted', icon: Phone, color: 'bg-indigo-50 text-indigo-700' },
    { key: 'proposal_sent', label: 'Proposal Sent', icon: FileText, color: 'bg-amber-50 text-amber-700' },
    { key: 'deal_done', label: 'Deal Done', icon: CheckCircle, color: 'bg-emerald-50 text-emerald-700' },
    { key: 'lost', label: 'Lost', icon: XCircle, color: 'bg-red-50 text-red-700' },
    { key: 'not_serviceable', label: 'Not Serviceable', icon: Ban, color: 'bg-slate-100 text-slate-500' },
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
            open: 'bg-blue-100 text-blue-800 border-blue-200',
            contacted: 'bg-indigo-100 text-indigo-800 border-indigo-200',
            proposal_sent: 'bg-amber-100 text-amber-800 border-amber-200',
            deal_done: 'bg-emerald-100 text-emerald-800 border-emerald-200',
            lost: 'bg-red-100 text-red-800 border-red-200',
            not_serviceable: 'bg-slate-100 text-slate-600 border-slate-200',
        };
        return styles[status] || 'bg-slate-100 text-slate-700 border-slate-200';
    };

    // Calculate conversion metrics
    const wonCount = stats?.deal_done || 0;
    const lostCount = stats?.lost || 0;
    const totalClosed = wonCount + lostCount;
    const winRate = totalClosed > 0 ? Math.round((wonCount / totalClosed) * 100) : 0;

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Dashboard</h1>
                    <p className="text-slate-500 mt-1">Track your company outreach</p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={fetchData}
                        disabled={isLoading}
                        className="border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Link href="/ergopack/contacts/new">
                        <Button className="bg-slate-900 text-white hover:bg-slate-800">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Contact
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
                {STATUS_CARDS.map(({ key, label, icon: Icon, color }) => (
                    <Link
                        key={key}
                        href={key === 'total' ? '/ergopack/contacts' : `/ergopack/contacts?status=${key}`}
                    >
                        <Card className="bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer group">
                            <CardContent className="p-4">
                                <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center mb-3`}>
                                    <Icon className="w-4 h-4" />
                                </div>
                                <div className="text-2xl font-bold text-slate-900 mb-1">
                                    {getStatValue(key)}
                                </div>
                                <div className="text-xs text-slate-500 font-medium">
                                    {label}
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Activity */}
                <Card className="lg:col-span-2 bg-white border-slate-200 shadow-sm">
                    <CardHeader className="border-b border-slate-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg font-semibold text-slate-900">Recent Activity</CardTitle>
                                <CardDescription className="text-slate-500">Latest updates to your contacts</CardDescription>
                            </div>
                            <Link href="/ergopack/contacts">
                                <Button variant="ghost" className="text-slate-600 hover:text-slate-900 text-sm">
                                    View All
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="p-8 text-center text-slate-400">Loading...</div>
                        ) : recentContacts.length === 0 ? (
                            <div className="p-8 text-center">
                                <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-500">No contacts yet</p>
                                <Link href="/ergopack/contacts/new">
                                    <Button className="mt-4 bg-slate-900 text-white hover:bg-slate-800">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add First Contact
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {recentContacts.map((contact) => (
                                    <Link
                                        key={contact.id}
                                        href={`/ergopack/contacts/${contact.id}`}
                                        className="block"
                                    >
                                        <div className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                                                    <Building2 className="w-5 h-5 text-slate-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-900">{contact.company_name}</p>
                                                    <p className="text-sm text-slate-500">
                                                        {contact.contact_person || 'No contact person'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Badge className={`${getStatusBadgeStyle(contact.status)} border`}>
                                                    {contact.status?.replace('_', ' ')}
                                                </Badge>
                                                <span className="text-xs text-slate-400">
                                                    {new Date(contact.updated_at).toLocaleDateString('en-IN', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric'
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Quick Actions */}
                    <Card className="bg-white border-slate-200 shadow-sm">
                        <CardHeader className="pb-3 border-b border-slate-100">
                            <CardTitle className="text-base font-semibold text-slate-900">Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-2">
                            <Link href="/ergopack/contacts/new" className="block">
                                <Button variant="ghost" className="w-full justify-start text-slate-600 hover:text-slate-900 hover:bg-slate-50">
                                    <Plus className="w-4 h-4 mr-3" />
                                    Add New Contact
                                </Button>
                            </Link>
                            <Link href="/ergopack/contacts?status=open" className="block">
                                <Button variant="ghost" className="w-full justify-start text-slate-600 hover:text-slate-900 hover:bg-slate-50">
                                    <Clock className="w-4 h-4 mr-3" />
                                    Open Leads
                                </Button>
                            </Link>
                            <Link href="/ergopack/contacts?status=contacted" className="block">
                                <Button variant="ghost" className="w-full justify-start text-slate-600 hover:text-slate-900 hover:bg-slate-50">
                                    <Phone className="w-4 h-4 mr-3" />
                                    Contacted
                                </Button>
                            </Link>
                            <Link href="/ergopack/contacts?status=proposal_sent" className="block">
                                <Button variant="ghost" className="w-full justify-start text-slate-600 hover:text-slate-900 hover:bg-slate-50">
                                    <FileText className="w-4 h-4 mr-3" />
                                    Proposals Sent
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    {/* Conversion Stats */}
                    <Card className="bg-white border-slate-200 shadow-sm">
                        <CardHeader className="pb-3 border-b border-slate-100">
                            <CardTitle className="text-base font-semibold text-slate-900">Conversion</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-slate-600 text-sm">Deal Done</span>
                                <span className="font-semibold text-emerald-600">{wonCount}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-slate-600 text-sm">Lost</span>
                                <span className="font-semibold text-red-600">{lostCount}</span>
                            </div>
                            <div className="border-t border-slate-100 pt-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-900 font-medium">Win Rate</span>
                                    <span className="text-xl font-bold text-slate-900">{winRate}%</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
