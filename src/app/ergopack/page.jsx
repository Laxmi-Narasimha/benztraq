/**
 * Ergopack Dashboard - Premium Dark Theme (Compact)
 * 
 * Compact overview page fitting on single viewport.
 * Conversion Rate: deal_done / (deal_done + lost) * 100
 * 
 * @module app/ergopack/page
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Building2, Clock, Phone, FileText, CheckCircle, XCircle,
    Plus, ArrowRight, RefreshCw, Ban, TrendingUp, Download
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const STATUS_CARDS = [
    { key: 'total', label: 'Total', icon: Building2, color: 'text-white', bg: 'bg-zinc-800/50' },
    { key: 'open', label: 'Open', icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { key: 'contacted', label: 'Contacted', icon: Phone, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { key: 'proposal_sent', label: 'Proposal', icon: FileText, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { key: 'deal_done', label: 'Won', icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { key: 'lost', label: 'Lost', icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
    { key: 'not_serviceable', label: 'N/A', icon: Ban, color: 'text-zinc-500', bg: 'bg-zinc-800/50' },
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
            if (data.contacts) setRecentContacts(data.contacts);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatValue = (key) => {
        if (isLoading) return '-';
        if (key === 'total') return stats?.total || 0;
        return stats?.[key] || 0;
    };

    // Conversion Rate: deal_done / (deal_done + lost) * 100
    const wonCount = stats?.deal_done || 0;
    const lostCount = stats?.lost || 0;
    const closedDeals = wonCount + lostCount;
    const conversionRate = closedDeals > 0 ? Math.round((wonCount / closedDeals) * 100) : 0;

    const getStatusBadge = (status) => {
        const styles = {
            open: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
            contacted: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
            proposal_sent: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
            deal_done: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
            won: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
            lost: 'bg-red-500/20 text-red-400 border-red-500/30',
            not_serviceable: 'bg-zinc-700 text-zinc-400 border-zinc-600',
        };
        return styles[status] || 'bg-zinc-700 text-zinc-400';
    };

    return (
        <div className="min-h-screen bg-[#050505] p-4 md:p-6 font-sans">
            {/* Header - Compact */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-zinc-900">
                <div>
                    <h1 className="text-2xl font-light text-white">Dashboard</h1>
                    <p className="text-xs text-zinc-600">Outreach overview</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={fetchData}
                        disabled={isLoading}
                        className="text-zinc-500 hover:text-white h-8"
                    >
                        <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
                    </Button>
                    <Link href="/ergopack/contacts/new">
                        <Button size="sm" className="bg-white text-black hover:bg-zinc-200 h-8 text-xs">
                            <Plus className="w-3 h-3 mr-1" />
                            Add Lead
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats Row - Compact (7 cards in a row) */}
            <div className="grid grid-cols-7 gap-2 mb-4">
                {STATUS_CARDS.map(({ key, label, icon: Icon, color, bg }) => (
                    <Link
                        key={key}
                        href={key === 'total' ? '/ergopack/contacts' : `/ergopack/contacts?status=${key}`}
                        className="group"
                    >
                        <Card className="bg-zinc-900/30 border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700 transition-all h-full">
                            <CardContent className="p-3 text-center">
                                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2", bg)}>
                                    <Icon className={cn("w-4 h-4", color)} />
                                </div>
                                <div className="text-xl font-light text-white">{getStatValue(key)}</div>
                                <div className="text-[10px] uppercase tracking-widest text-zinc-600">{label}</div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            {/* Main Content - 2 Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Recent Contacts */}
                <Card className="lg:col-span-2 bg-zinc-900/20 border-zinc-800/60">
                    <CardHeader className="py-3 px-4 border-b border-zinc-900 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-light text-white">Recent Leads</CardTitle>
                        <Link href="/ergopack/contacts">
                            <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-white hover:bg-zinc-800 h-6 text-[10px]">
                                View All <ArrowRight className="w-3 h-3 ml-1" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent className="p-0">
                        {/* Header for Grid */}
                        <div className="grid grid-cols-12 gap-2 px-4 py-2 border-b border-zinc-900 bg-zinc-900/40 text-[10px] font-medium text-zinc-500 uppercase tracking-widest text-center items-center">
                            <div className="col-span-4 text-left">Company</div>
                            <div className="col-span-3">Status</div>
                            <div className="col-span-2">PDF</div>
                            <div className="col-span-2">Quote</div>
                            <div className="col-span-1"></div>
                        </div>

                        {isLoading ? (
                            <div className="p-6 text-center text-zinc-600 text-sm">
                                <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2" />
                                Loading...
                            </div>
                        ) : recentContacts.length === 0 ? (
                            <div className="p-6 text-center text-zinc-600 text-sm">No contacts yet</div>
                        ) : (
                            <div className="divide-y divide-zinc-900">
                                {recentContacts.map((contact) => (
                                    <div key={contact.id} className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-zinc-900/40 transition-colors group text-center">
                                        {/* Company */}
                                        <div className="col-span-4 text-left">
                                            <Link href={`/ergopack/contacts/${contact.id}`} className="block">
                                                <p className="text-sm font-medium text-zinc-200 group-hover:text-white truncate">
                                                    {contact.company_name}
                                                </p>
                                                <p className="text-[10px] text-zinc-600 truncate">
                                                    {contact.contact_person || 'No contact'}
                                                </p>
                                            </Link>
                                        </div>

                                        {/* Status */}
                                        <div className="col-span-3 flex justify-center">
                                            <Badge className={cn("border text-[9px] uppercase whitespace-nowrap", getStatusBadge(contact.status))}>
                                                {contact.status?.replace('_', ' ')}
                                            </Badge>
                                        </div>

                                        {/* PDF Download */}
                                        <div className="col-span-2 flex justify-center">
                                            {contact.presentation_file_path ? (
                                                <button
                                                    onClick={async (e) => {
                                                        e.preventDefault();
                                                        try {
                                                            const res = await fetch(`/api/ergopack/presentations?contactId=${contact.id}`);
                                                            const data = await res.json();
                                                            if (data.url) window.open(data.url, '_blank');
                                                            else toast.error('Error getting URL');
                                                        } catch (err) {
                                                            toast.error('Error loading PDF');
                                                        }
                                                    }}
                                                    className="w-7 h-7 rounded bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center text-red-500 hover:text-red-400 transition-all"
                                                >
                                                    <FileText className="w-3.5 h-3.5" />
                                                </button>
                                            ) : (
                                                <span className="text-zinc-700">-</span>
                                            )}
                                        </div>

                                        {/* Quote Download */}
                                        <div className="col-span-2 flex justify-center">
                                            {contact.quotation_file_path ? (
                                                <button
                                                    onClick={async (e) => {
                                                        e.preventDefault();
                                                        try {
                                                            const res = await fetch(`/api/ergopack/quotations?contactId=${contact.id}`);
                                                            const data = await res.json();
                                                            if (data.url) window.open(data.url, '_blank');
                                                            else toast.error('Error getting URL');
                                                        } catch (err) {
                                                            toast.error('Error loading Quote');
                                                        }
                                                    }}
                                                    className="w-7 h-7 rounded bg-blue-500/10 hover:bg-blue-500/20 flex items-center justify-center text-blue-500 hover:text-blue-400 transition-all"
                                                >
                                                    <Download className="w-3.5 h-3.5" />
                                                </button>
                                            ) : (
                                                <span className="text-zinc-700">-</span>
                                            )}
                                        </div>

                                        {/* Arrow */}
                                        <div className="col-span-1 flex justify-end">
                                            <Link href={`/ergopack/contacts/${contact.id}`}>
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-600 hover:text-white">
                                                    <ArrowRight className="w-3 h-3" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Right Sidebar - Quick Actions + Conversion */}
                <div className="space-y-4">
                    {/* Quick Actions */}
                    <Card className="bg-zinc-900/20 border-zinc-800/60">
                        <CardHeader className="py-3 px-4 border-b border-zinc-900">
                            <CardTitle className="text-sm font-light text-white">Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="p-2">
                            {[
                                { label: 'New Lead', icon: Plus, href: '/ergopack/contacts/new' },
                                { label: 'Open Pipeline', icon: Clock, href: '/ergopack/contacts?status=open' },
                                { label: 'Follow Ups', icon: Phone, href: '/ergopack/contacts?status=contacted' },
                                { label: 'Proposals', icon: FileText, href: '/ergopack/contacts?status=proposal_sent' },
                            ].map((item) => (
                                <Link key={item.label} href={item.href}>
                                    <Button variant="ghost" size="sm" className="w-full justify-start text-zinc-400 hover:text-white hover:bg-zinc-800/50 h-8 text-xs">
                                        <item.icon className="w-3.5 h-3.5 mr-2 text-zinc-600" />
                                        {item.label}
                                    </Button>
                                </Link>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Conversion Rate */}
                    <Card className="bg-zinc-900/20 border-zinc-800/60 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl -mr-8 -mt-8" />
                        <CardHeader className="py-3 px-4 border-b border-zinc-900">
                            <CardTitle className="text-sm font-light text-white flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-emerald-500" />
                                Conversion Rate
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="text-3xl font-light text-white">{conversionRate}%</div>
                                <div className="text-[10px] text-zinc-600 text-right">
                                    <div>Won: <span className="text-emerald-400">{wonCount}</span></div>
                                    <div>Lost: <span className="text-red-400">{lostCount}</span></div>
                                </div>
                            </div>
                            <div className="w-full bg-zinc-900 rounded-full h-2">
                                <div
                                    className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-2 rounded-full transition-all"
                                    style={{ width: `${conversionRate}%` }}
                                />
                            </div>
                            <p className="text-[10px] text-zinc-600 mt-2">
                                Based on {closedDeals} closed deals (Won + Lost)
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
