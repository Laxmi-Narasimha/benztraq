/**
 * Ergopack Dashboard - Premium Dark Theme
 * 
 * Overview page with status cards as clickable filters.
 * Premium dark theme with minimal cards and vibrant accents.
 * 
 * New Stages: Open, Contacted, Proposal Sent, Deal Done, Lost, Not Serviceable
 * 
 * @module app/ergopack/page
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Building2, Clock, Phone, FileText, CheckCircle, XCircle,
    Plus, ArrowRight, RefreshCw, Users, Ban
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Updated status cards matching new stages with dark theme styling
const STATUS_CARDS = [
    { key: 'total', label: 'Total', icon: Building2, color: 'text-white', bg: 'bg-zinc-800/50', border: 'border-zinc-700' },
    { key: 'open', label: 'Open', icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    { key: 'contacted', label: 'Contacted', icon: Phone, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
    { key: 'proposal_sent', label: 'Proposal Sent', icon: FileText, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    { key: 'deal_done', label: 'Deal Done', icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    { key: 'lost', label: 'Lost', icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
    { key: 'not_serviceable', label: 'Not Serviceable', icon: Ban, color: 'text-zinc-500', bg: 'bg-zinc-800/50', border: 'border-zinc-800' },
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
            open: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
            contacted: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
            proposal_sent: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
            deal_done: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
            lost: 'bg-red-500/10 text-red-400 border-red-500/20',
            not_serviceable: 'bg-zinc-800 text-zinc-500 border-zinc-700',
        };
        return styles[status] || 'bg-zinc-800 text-zinc-500 border-zinc-700';
    };

    // Calculate conversion metrics
    const wonCount = stats?.deal_done || 0;
    const lostCount = stats?.lost || 0;
    const totalClosed = wonCount + lostCount;
    const winRate = totalClosed > 0 ? Math.round((wonCount / totalClosed) * 100) : 0;

    return (
        <div className="min-h-screen bg-[#050505] p-6 md:p-8 space-y-8 font-sans">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-zinc-900 pb-8">
                <div>
                    <h1 className="text-3xl font-light tracking-wide text-white">Dashboard</h1>
                    <p className="text-zinc-500 mt-2 font-light">Overview of your outreach performance</p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={fetchData}
                        disabled={isLoading}
                        className="bg-black border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-white hover:border-zinc-700 h-11 transition-all"
                    >
                        <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
                        Refresh
                    </Button>
                    <Link href="/ergopack/contacts/new">
                        <Button className="bg-white text-black hover:bg-zinc-200 h-11 px-6 font-medium tracking-wide transition-all shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)]">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Contact
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
                {STATUS_CARDS.map(({ key, label, icon: Icon, color, bg, border }) => (
                    <Link
                        key={key}
                        href={key === 'total' ? '/ergopack/contacts' : `/ergopack/contacts?status=${key}`}
                        className="group"
                    >
                        <Card className="bg-zinc-900/30 border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700 transition-all duration-300 h-full">
                            <CardContent className="p-5 flex flex-col items-center text-center justify-center h-full">
                                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110", bg)}>
                                    <Icon className={cn("w-5 h-5", color)} />
                                </div>
                                <div className="text-3xl font-light text-white mb-2 tracking-tight">
                                    {getStatValue(key)}
                                </div>
                                <div className="text-xs font-medium uppercase tracking-widest text-zinc-500 group-hover:text-zinc-400 transition-colors">
                                    {label}
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Activity */}
                <Card className="lg:col-span-2 bg-zinc-900/20 border-zinc-800/60 backdrop-blur-sm">
                    <CardHeader className="border-b border-zinc-900 px-6 py-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg font-light tracking-wide text-white">Recent Contacts</CardTitle>
                                <CardDescription className="text-zinc-600 mt-1">Latest added leads</CardDescription>
                            </div>
                            <Link href="/ergopack/contacts">
                                <Button variant="ghost" className="text-zinc-500 hover:text-white hover:bg-zinc-800/50 text-xs uppercase tracking-widest">
                                    View All
                                    <ArrowRight className="w-3 h-3 ml-2" />
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="p-12 text-center text-zinc-600 font-light flex flex-col items-center">
                                <RefreshCw className="w-6 h-6 animate-spin mb-3 text-zinc-700" />
                                Loading activity...
                            </div>
                        ) : recentContacts.length === 0 ? (
                            <div className="p-12 text-center">
                                <Users className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
                                <p className="text-zinc-500 font-light">No contacts found</p>
                                <Link href="/ergopack/contacts/new">
                                    <Button className="mt-6 bg-white text-black hover:bg-zinc-200">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add First Contact
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="divide-y divide-zinc-900">
                                {recentContacts.map((contact) => (
                                    <Link
                                        key={contact.id}
                                        href={`/ergopack/contacts/${contact.id}`}
                                        className="block group"
                                    >
                                        <div className="flex items-center justify-between p-5 hover:bg-zinc-900/40 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:border-zinc-700 transition-colors">
                                                    <Building2 className="w-5 h-5 text-zinc-600 group-hover:text-zinc-400" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-zinc-200 group-hover:text-white transition-colors">
                                                        {contact.company_name}
                                                    </p>
                                                    <p className="text-xs text-zinc-600 group-hover:text-zinc-500 mt-0.5">
                                                        {contact.contact_person || 'No contact person'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <Badge className={cn("border bg-transparent text-[10px] tracking-wider uppercase px-2 py-1", getStatusBadgeStyle(contact.status))}>
                                                    {contact.status?.replace('_', ' ')}
                                                </Badge>
                                                <span className="text-xs text-zinc-600 font-mono hidden sm:block">
                                                    {new Date(contact.updated_at).toLocaleDateString('en-IN', {
                                                        day: '2-digit', month: '2-digit'
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

                {/* Sidebar Stats */}
                <div className="space-y-6">
                    {/* Quick Filter Links */}
                    <Card className="bg-zinc-900/20 border-zinc-800/60 backdrop-blur-sm">
                        <CardHeader className="pb-3 border-b border-zinc-900">
                            <CardTitle className="text-base font-light tracking-wide text-white">Quick Access</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-1">
                            {[
                                { label: 'New Lead', icon: Plus, href: '/ergopack/contacts/new' },
                                { label: 'Open Pipeline', icon: Clock, href: '/ergopack/contacts?status=open' },
                                { label: 'Follow Ups', icon: Phone, href: '/ergopack/contacts?status=contacted' },
                                { label: 'Proposals', icon: FileText, href: '/ergopack/contacts?status=proposal_sent' },
                            ].map((item) => (
                                <Link key={item.label} href={item.href} className="block">
                                    <Button variant="ghost" className="w-full justify-start text-zinc-400 hover:text-white hover:bg-zinc-800/50">
                                        <item.icon className="w-4 h-4 mr-3 text-zinc-600" />
                                        {item.label}
                                    </Button>
                                </Link>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Conversion Circle */}
                    <Card className="bg-zinc-900/20 border-zinc-800/60 backdrop-blur-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-10 -mt-10" />

                        <CardHeader className="pb-3 border-b border-zinc-900">
                            <CardTitle className="text-base font-light tracking-wide text-white">Conversion Rate</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 pb-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <div className="text-4xl font-light text-white">{winRate}%</div>
                                    <div className="text-xs text-zinc-500 uppercase tracking-widest mt-1">Win Rate</div>
                                </div>
                                <div className="h-16 w-16 rounded-full border-4 border-zinc-800 flex items-center justify-center">
                                    <CheckCircle className="w-6 h-6 text-emerald-500" />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-zinc-500">Deals Closed</span>
                                    <span className="text-emerald-400 font-mono">{wonCount}</span>
                                </div>
                                <div className="w-full bg-zinc-900 rounded-full h-1.5">
                                    <div className="bg-emerald-500/50 h-1.5 rounded-full" style={{ width: `${winRate}%` }} />
                                </div>
                                <div className="flex items-center justify-between text-sm pt-1">
                                    <span className="text-zinc-500">Lost</span>
                                    <span className="text-red-400 font-mono">{lostCount}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
