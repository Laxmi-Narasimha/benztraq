'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Settings,
    User,
    Bell,
    Shield,
    Building2,
    Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
    const { user, profile, isLoading } = useAuth();
    const [saving, setSaving] = useState(false);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const roleName = profile?.role?.name || 'User';
    const isManager = ['Director', 'VP', 'Head of Sales'].includes(roleName);

    return (
        <div className="space-y-6 max-w-4xl">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">
                    Manage your account and application preferences
                </p>
            </div>

            {/* Profile Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Profile Information
                    </CardTitle>
                    <CardDescription>Your account details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className="text-muted-foreground text-xs">Full Name</Label>
                            <p className="font-medium">{profile?.full_name || 'Not set'}</p>
                        </div>
                        <div>
                            <Label className="text-muted-foreground text-xs">Email</Label>
                            <p className="font-medium">{user?.email || 'Not set'}</p>
                        </div>
                        <div>
                            <Label className="text-muted-foreground text-xs">Role</Label>
                            <Badge variant="secondary" className="mt-1">{roleName}</Badge>
                        </div>
                        <div>
                            <Label className="text-muted-foreground text-xs">Region</Label>
                            <p className="font-medium">{profile?.region?.name || 'All Regions'}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Company Info */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Company Information
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className="text-muted-foreground text-xs">Company</Label>
                            <p className="font-medium">Benz Packaging Solutions</p>
                        </div>
                        <div>
                            <Label className="text-muted-foreground text-xs">Currency</Label>
                            <p className="font-medium">INR (₹)</p>
                        </div>
                        <div>
                            <Label className="text-muted-foreground text-xs">Default GST Rate</Label>
                            <p className="font-medium">18%</p>
                        </div>
                        <div>
                            <Label className="text-muted-foreground text-xs">Timezone</Label>
                            <p className="font-medium">Asia/Kolkata (IST)</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Notifications
                    </CardTitle>
                    <CardDescription>Manage your notification preferences</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Notification settings will be available in a future update.
                    </p>
                </CardContent>
            </Card>

            {/* Admin Section - Only visible to managers */}
            {isManager && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            Admin Settings
                        </CardTitle>
                        <CardDescription>Manage system-wide settings</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button variant="outline" asChild>
                            <a href="/admin/users">Manage Users</a>
                        </Button>
                        <Button variant="outline" asChild className="ml-2">
                            <a href="/admin/roles">Manage Roles</a>
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
