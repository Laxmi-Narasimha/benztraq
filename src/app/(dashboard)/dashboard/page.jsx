/**
 * Role-Based Dashboard Page
 * 
 * ASM: Simplified view with own stats and create buttons only
 * Head of Sales: Team breakdown with contribution charts
 * Directors/Developers: Full analytics with both companies
 * 
 * @module app/(dashboard)/dashboard/page
 */

'use client';

export const dynamic = 'force-dynamic';

import { useAuth } from '@/providers/auth-provider';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    IndianRupee,
    FileText,
    ShoppingCart,
    Plus,
    ArrowRight,
    TrendingUp,
    Users,
    Target,
    Percent,
    BarChart3,
} from 'lucide-react';
import Link from 'next/link';

// Format currency in Indian style
function formatCurrency(value) {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(1)} K`;
    return `₹${value}`;
}

// Stat Card Component
function StatCard({ title, value, subtitle, icon: Icon, trend }) {
    return (
        <Card>
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <p className="text-2xl font-bold mt-1">{value}</p>
                        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
                        {trend && (
                            <p className={`text-xs mt-1 ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last month
                            </p>
                        )}
                    </div>
                    {Icon && (
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Icon className="h-6 w-6 text-primary" />
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

// Action Card for ASM
function ActionCard({ title, description, icon: Icon, href, color = 'bg-primary' }) {
    return (
        <Link href={href}>
            <Card className="hover:shadow-lg transition-all cursor-pointer group">
                <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                        <div className={`h-14 w-14 rounded-xl ${color} flex items-center justify-center`}>
                            <Icon className="h-7 w-7 text-white" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-lg">{title}</h3>
                            <p className="text-sm text-muted-foreground">{description}</p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}

// Team Member Contribution Row
function TeamMemberRow({ name, quotations, salesOrders, totalValue, conversionRate, rank }) {
    const maxValue = 500000; // Normalize bar width
    const barWidth = Math.min((totalValue / maxValue) * 100, 100);

    return (
        <div className="flex items-center gap-4 py-3 border-b last:border-0">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                {rank}
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{name}</p>
                <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                    <span>{quotations} quotes</span>
                    <span>{salesOrders} orders</span>
                    <span>{conversionRate}% conv.</span>
                </div>
            </div>
            <div className="w-32">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${barWidth}%` }}
                    />
                </div>
                <p className="text-sm font-semibold mt-1 text-right">{formatCurrency(totalValue)}</p>
            </div>
        </div>
    );
}

// ASM Dashboard - Simplified
function ASMDashboard({ userName, stats }) {
    return (
        <div className="space-y-6">
            {/* Welcome Header */}
            <div>
                <h1 className="text-2xl font-bold">Welcome, {userName}</h1>
                <p className="text-muted-foreground">Your sales performance overview</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                    title="My Quotations"
                    value={stats.quotations}
                    subtitle="This month"
                    icon={FileText}
                />
                <StatCard
                    title="My Sales Orders"
                    value={stats.salesOrders}
                    subtitle="This month"
                    icon={ShoppingCart}
                />
                <StatCard
                    title="My Total Value"
                    value={formatCurrency(stats.totalValue)}
                    subtitle="This month"
                    icon={IndianRupee}
                    trend={stats.trend}
                />
            </div>

            {/* Primary Actions */}
            <div>
                <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ActionCard
                        title="Create Quotation"
                        description="Create a new quotation for a customer"
                        icon={FileText}
                        href="/documents/new?type=quotation"
                        color="bg-blue-500"
                    />
                    <ActionCard
                        title="Create Sales Order"
                        description="Create a new sales order or convert from quotation"
                        icon={ShoppingCart}
                        href="/documents/new?type=sales_order"
                        color="bg-green-500"
                    />
                </div>
            </div>

            {/* Recent Activity */}
            <Card>
                <CardHeader>
                    <CardTitle>My Recent Documents</CardTitle>
                    <CardDescription>Your latest quotations and sales orders</CardDescription>
                </CardHeader>
                <CardContent>
                    {stats.recentDocs?.length > 0 ? (
                        <div className="space-y-3">
                            {stats.recentDocs.map((doc, i) => (
                                <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                                    <div className="flex items-center gap-3">
                                        {doc.type === 'quotation' ? (
                                            <FileText className="h-4 w-4 text-blue-500" />
                                        ) : (
                                            <ShoppingCart className="h-4 w-4 text-green-500" />
                                        )}
                                        <div>
                                            <p className="font-medium">{doc.customer}</p>
                                            <p className="text-xs text-muted-foreground">{doc.date}</p>
                                        </div>
                                    </div>
                                    <p className="font-semibold">{formatCurrency(doc.value)}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>No documents yet</p>
                            <p className="text-sm">Create your first quotation or sales order</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

// Head of Sales / Director Dashboard - Full Team View
function ManagerDashboard({ userName, teamStats, teamMembers }) {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Team Dashboard</h1>
                    <p className="text-muted-foreground">Monitor your team's performance</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" asChild>
                        <Link href="/comparison">
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Compare Team
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Team KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                    title="Team Quotations"
                    value={teamStats.totalQuotations}
                    subtitle="This month"
                    icon={FileText}
                    trend={teamStats.quotationTrend}
                />
                <StatCard
                    title="Team Sales Orders"
                    value={teamStats.totalSalesOrders}
                    subtitle="This month"
                    icon={ShoppingCart}
                    trend={teamStats.orderTrend}
                />
                <StatCard
                    title="Total Sales Value"
                    value={formatCurrency(teamStats.totalValue)}
                    subtitle="This month"
                    icon={IndianRupee}
                    trend={teamStats.valueTrend}
                />
                <StatCard
                    title="Conversion Rate"
                    value={`${teamStats.conversionRate}%`}
                    subtitle="Quote to Order"
                    icon={Percent}
                />
            </div>

            {/* Team Contribution Breakdown */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Team Contribution
                    </CardTitle>
                    <CardDescription>Individual performance breakdown for this month</CardDescription>
                </CardHeader>
                <CardContent>
                    {teamMembers.length > 0 ? (
                        <div>
                            {teamMembers.map((member, index) => (
                                <TeamMemberRow
                                    key={member.id}
                                    rank={index + 1}
                                    name={member.name}
                                    quotations={member.quotations}
                                    salesOrders={member.salesOrders}
                                    totalValue={member.totalValue}
                                    conversionRate={member.conversionRate}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>No team data available</p>
                            <p className="text-sm">Data will appear once team members create documents</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Quick Stats by Category */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Performers */}
                <Card>
                    <CardHeader>
                        <CardTitle>🏆 Top Performers</CardTitle>
                        <CardDescription>Highest sales value this month</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {teamMembers.length > 0 ? (
                            <div className="space-y-3">
                                {teamMembers.slice(0, 3).map((member, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
                                            <span className="font-medium">{member.name}</span>
                                        </div>
                                        <span className="font-bold">{formatCurrency(member.totalValue)}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-center py-4">No data yet</p>
                        )}
                    </CardContent>
                </Card>

                {/* Conversion Leaders */}
                <Card>
                    <CardHeader>
                        <CardTitle>📈 Best Conversion Rate</CardTitle>
                        <CardDescription>Highest quote-to-order conversion</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {teamMembers.length > 0 ? (
                            <div className="space-y-3">
                                {[...teamMembers]
                                    .sort((a, b) => b.conversionRate - a.conversionRate)
                                    .slice(0, 3)
                                    .map((member, i) => (
                                        <div key={i} className="flex items-center justify-between">
                                            <span className="font-medium">{member.name}</span>
                                            <span className="font-bold text-green-600">{member.conversionRate}%</span>
                                        </div>
                                    ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-center py-4">No data yet</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// Main Dashboard Component
export default function DashboardPage() {
    const { profile } = useAuth();
    const [stats, setStats] = useState(null);
    const [teamStats, setTeamStats] = useState(null);
    const [teamMembers, setTeamMembers] = useState([]);
    const [loading, setLoading] = useState(true);

    const userRole = profile?.role || 'asm';
    const isASM = userRole === 'asm';
    const userName = profile?.fullName || profile?.full_name || 'User';

    useEffect(() => {
        async function fetchData() {
            try {
                // Fetch documents for current user
                const docsRes = await fetch('/api/documents');
                const docsData = await docsRes.json();

                if (isASM) {
                    // ASM: Calculate own stats
                    const docs = docsData.documents || [];
                    const quotations = docs.filter(d => d.doc_type === 'quotation').length;
                    const salesOrders = docs.filter(d => d.doc_type === 'sales_order').length;
                    const totalValue = docs
                        .filter(d => d.doc_type === 'sales_order')
                        .reduce((sum, d) => sum + (d.total_value || 0), 0);

                    setStats({
                        quotations,
                        salesOrders,
                        totalValue,
                        trend: 0,
                        recentDocs: docs.slice(0, 5).map(d => ({
                            type: d.doc_type,
                            customer: d.customer?.name || 'Unknown',
                            date: new Date(d.doc_date).toLocaleDateString(),
                            value: d.total_value || 0,
                        })),
                    });
                } else {
                    // Manager: Calculate team stats
                    const docs = docsData.documents || [];

                    // Group by salesperson
                    const byPerson = {};
                    docs.forEach(doc => {
                        const personId = doc.salesperson_user_id || 'unknown';
                        const personName = doc.salesperson?.full_name || 'Unknown';
                        if (!byPerson[personId]) {
                            byPerson[personId] = {
                                id: personId,
                                name: personName,
                                quotations: 0,
                                salesOrders: 0,
                                totalValue: 0,
                            };
                        }
                        if (doc.doc_type === 'quotation') {
                            byPerson[personId].quotations++;
                        } else if (doc.doc_type === 'sales_order') {
                            byPerson[personId].salesOrders++;
                            byPerson[personId].totalValue += doc.total_value || 0;
                        }
                    });

                    // Calculate conversion rates
                    const members = Object.values(byPerson).map(p => ({
                        ...p,
                        conversionRate: p.quotations > 0
                            ? Math.round((p.salesOrders / p.quotations) * 100)
                            : 0,
                    })).sort((a, b) => b.totalValue - a.totalValue);

                    const totalQuotations = docs.filter(d => d.doc_type === 'quotation').length;
                    const totalSalesOrders = docs.filter(d => d.doc_type === 'sales_order').length;
                    const totalValue = docs
                        .filter(d => d.doc_type === 'sales_order')
                        .reduce((sum, d) => sum + (d.total_value || 0), 0);

                    setTeamStats({
                        totalQuotations,
                        totalSalesOrders,
                        totalValue,
                        conversionRate: totalQuotations > 0
                            ? Math.round((totalSalesOrders / totalQuotations) * 100)
                            : 0,
                        quotationTrend: 0,
                        orderTrend: 0,
                        valueTrend: 0,
                    });
                    setTeamMembers(members);
                }
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [isASM]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    // Render appropriate dashboard based on role
    if (isASM) {
        return (
            <ASMDashboard
                userName={userName}
                stats={stats || { quotations: 0, salesOrders: 0, totalValue: 0, recentDocs: [] }}
            />
        );
    }

    return (
        <ManagerDashboard
            userName={userName}
            teamStats={teamStats || { totalQuotations: 0, totalSalesOrders: 0, totalValue: 0, conversionRate: 0 }}
            teamMembers={teamMembers}
        />
    );
}
