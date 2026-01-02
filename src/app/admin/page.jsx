/**
 * Admin Dashboard
 * 
 * Overview page for admin panel.
 * Shows user stats and quick actions.
 * 
 * @module app/(admin)/page
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, Shield, Activity, Settings, UserPlus, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function AdminPage() {
    const [stats, setStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [seedStatus, setSeedStatus] = useState(null);
    const [isSeeding, setIsSeeding] = useState(false);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await fetch('/api/admin/users');
            const data = await response.json();
            if (data.stats) {
                setStats(data.stats);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSeedUsers = async () => {
        setIsSeeding(true);
        setSeedStatus(null);

        try {
            const response = await fetch('/api/admin/seed-users?key=benztraq-seed-2024', {
                method: 'POST'
            });
            const data = await response.json();

            if (data.success) {
                setSeedStatus({
                    type: 'success',
                    message: data.message,
                    password: data.defaultPassword
                });
                fetchStats(); // Refresh stats
            } else {
                setSeedStatus({ type: 'error', message: data.error });
            }
        } catch (error) {
            setSeedStatus({ type: 'error', message: 'Failed to seed users' });
        } finally {
            setIsSeeding(false);
        }
    };

    const statCards = [
        {
            title: 'Total Users',
            value: stats?.total || 0,
            icon: Users,
            color: 'text-blue-400',
            bgColor: 'bg-blue-500/10'
        },
        {
            title: 'Active Users',
            value: stats?.active || 0,
            icon: Activity,
            color: 'text-green-400',
            bgColor: 'bg-green-500/10'
        },
        {
            title: 'Developers',
            value: stats?.byRole?.developer || 0,
            icon: Settings,
            color: 'text-purple-400',
            bgColor: 'bg-purple-500/10'
        },
        {
            title: 'Sales Team',
            value: (stats?.byRole?.head_of_sales || 0) + (stats?.byRole?.asm || 0),
            icon: Shield,
            color: 'text-orange-400',
            bgColor: 'bg-orange-500/10'
        }
    ];

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
                <p className="text-slate-400 mt-1">Manage users, roles, and system settings</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat) => (
                    <Card key={stat.title} className="bg-slate-800 border-slate-700">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-400">{stat.title}</p>
                                    <p className="text-3xl font-bold text-white mt-1">
                                        {isLoading ? '-' : stat.value}
                                    </p>
                                </div>
                                <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Seed Users Card */}
                <Card className="bg-slate-800 border-slate-700">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <UserPlus className="w-5 h-5" />
                            Initialize Users
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                            Seed the database with default users for BENZTRAQ
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {seedStatus && (
                            <Alert className={seedStatus.type === 'success' ? 'border-green-500 bg-green-500/10' : 'border-red-500 bg-red-500/10'}>
                                {seedStatus.type === 'success' ? (
                                    <CheckCircle className="w-4 h-4 text-green-400" />
                                ) : (
                                    <AlertCircle className="w-4 h-4 text-red-400" />
                                )}
                                <AlertDescription className={seedStatus.type === 'success' ? 'text-green-400' : 'text-red-400'}>
                                    {seedStatus.message}
                                    {seedStatus.password && (
                                        <span className="block mt-1">
                                            Default password: <code className="bg-slate-700 px-1 rounded">{seedStatus.password}</code>
                                        </span>
                                    )}
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="text-sm text-slate-400 space-y-2">
                            <p><strong>This will create:</strong></p>
                            <ul className="list-disc list-inside space-y-1 ml-2">
                                <li>Developer: laxmi@benz-packaging.com</li>
                                <li>Head of Sales: Pulak Biswas</li>
                                <li>ASMs: Abhishek, Mani Bhushan</li>
                                <li>3 placeholder ASM accounts</li>
                            </ul>
                        </div>

                        <Button
                            onClick={handleSeedUsers}
                            disabled={isSeeding}
                            className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                            {isSeeding ? (
                                <>
                                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                    Seeding Users...
                                </>
                            ) : (
                                <>
                                    <UserPlus className="w-4 h-4 mr-2" />
                                    Seed Default Users
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* Quick Links Card */}
                <Card className="bg-slate-800 border-slate-700">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <Settings className="w-5 h-5" />
                            Quick Actions
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                            Common administrative tasks
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Link href="/admin/users">
                            <Button variant="outline" className="w-full justify-start border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white">
                                <Users className="w-4 h-4 mr-3" />
                                Manage Users
                            </Button>
                        </Link>
                        <Link href="/admin/roles">
                            <Button variant="outline" className="w-full justify-start border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white">
                                <Shield className="w-4 h-4 mr-3" />
                                Manage Roles & Permissions
                            </Button>
                        </Link>
                        <Link href="/dashboard">
                            <Button variant="outline" className="w-full justify-start border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white">
                                <Activity className="w-4 h-4 mr-3" />
                                View Sales Dashboard
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>

            {/* Users by Role */}
            <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                    <CardTitle className="text-white">Users by Role</CardTitle>
                    <CardDescription className="text-slate-400">
                        Distribution of users across different roles
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                            <p className="text-3xl font-bold text-purple-400">{stats?.byRole?.developer || 0}</p>
                            <p className="text-sm text-slate-400 mt-1">Developers</p>
                        </div>
                        <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                            <p className="text-3xl font-bold text-blue-400">{stats?.byRole?.head_of_sales || 0}</p>
                            <p className="text-sm text-slate-400 mt-1">Head of Sales</p>
                        </div>
                        <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                            <p className="text-3xl font-bold text-green-400">{stats?.byRole?.asm || 0}</p>
                            <p className="text-sm text-slate-400 mt-1">Area Sales Managers</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
