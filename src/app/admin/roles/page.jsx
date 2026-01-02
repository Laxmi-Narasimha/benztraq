/**
 * Admin Roles Page
 * 
 * Role and permission management interface.
 * Shows permission matrix similar to Odoo's access rights.
 * 
 * @module app/admin/roles/page
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Shield, RefreshCw, CheckCircle, AlertCircle, Lock, Eye,
    Edit2, Plus, Trash2, Loader2, Save
} from 'lucide-react';

export default function AdminRolesPage() {
    const [roles, setRoles] = useState([]);
    const [resources, setResources] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedRole, setSelectedRole] = useState(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/admin/roles');
            const data = await res.json();
            if (data.roles) {
                setRoles(data.roles);
                setResources(data.resources || []);
                if (data.roles.length > 0 && !selectedRole) {
                    setSelectedRole(data.roles[0]);
                }
            }
        } catch (err) {
            setError('Failed to load roles');
        } finally {
            setIsLoading(false);
        }
    };

    const getPermissionForResource = (role, resource) => {
        const perm = role.permissions?.find(p => p.resource === resource);
        return perm || { can_read: false, can_write: false, can_create: false, can_delete: false, scope: 'own' };
    };

    const handlePermissionChange = (resource, action, value) => {
        if (!selectedRole || selectedRole.name === 'developer') return;

        setSelectedRole(prev => {
            const existingPerm = prev.permissions?.find(p => p.resource === resource);
            const updatedPerms = prev.permissions?.filter(p => p.resource !== resource) || [];

            if (existingPerm) {
                updatedPerms.push({ ...existingPerm, [action]: value });
            } else {
                updatedPerms.push({
                    resource,
                    can_read: action === 'can_read' ? value : false,
                    can_write: action === 'can_write' ? value : false,
                    can_create: action === 'can_create' ? value : false,
                    can_delete: action === 'can_delete' ? value : false,
                    scope: 'own'
                });
            }

            return { ...prev, permissions: updatedPerms };
        });
    };

    const handleSavePermissions = async () => {
        if (!selectedRole) return;

        setIsSaving(true);
        setError(null);
        setSuccess(null);

        try {
            const res = await fetch('/api/admin/roles', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roleId: selectedRole.id,
                    permissions: selectedRole.permissions
                })
            });

            const data = await res.json();
            if (data.success) {
                setSuccess('Permissions saved successfully');
                fetchRoles();
            } else {
                setError(data.error || 'Failed to save permissions');
            }
        } catch (err) {
            setError('Failed to save permissions');
        } finally {
            setIsSaving(false);
        }
    };

    const getRoleBadgeColor = (roleName) => {
        switch (roleName) {
            case 'developer': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
            case 'head_of_sales': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'asm': return 'bg-green-500/20 text-green-400 border-green-500/30';
            default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
        }
    };

    const resourceLabels = {
        users: 'Users',
        roles: 'Roles',
        permissions: 'Permissions',
        documents: 'Documents',
        leads: 'Leads',
        quotations: 'Quotations',
        sales_orders: 'Sales Orders',
        customers: 'Customers',
        teams: 'Teams',
        targets: 'Targets',
        reports: 'Reports',
        settings: 'Settings',
        activity_log: 'Activity Log'
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Shield className="w-7 h-7 text-blue-400" />
                        Roles & Permissions
                    </h1>
                    <p className="text-slate-400 mt-1">Configure access control for each role</p>
                </div>
                <Button variant="outline" onClick={fetchRoles} className="border-slate-600 text-slate-300 hover:bg-slate-700">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {/* Alerts */}
            {success && (
                <Alert className="border-green-500 bg-green-500/10">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <AlertDescription className="text-green-400">{success}</AlertDescription>
                </Alert>
            )}
            {error && (
                <Alert className="border-red-500 bg-red-500/10">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <AlertDescription className="text-red-400">{error}</AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Role Selector */}
                <Card className="bg-slate-800 border-slate-700 lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-white text-lg">Roles</CardTitle>
                        <CardDescription className="text-slate-400">
                            Select a role to view/edit permissions
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-4">
                                <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                            </div>
                        ) : (
                            roles.map((role) => (
                                <button
                                    key={role.id}
                                    onClick={() => setSelectedRole(role)}
                                    className={`w-full p-3 rounded-lg text-left transition-colors ${selectedRole?.id === role.id
                                            ? 'bg-blue-600/20 border border-blue-500/30'
                                            : 'bg-slate-700/50 hover:bg-slate-700 border border-transparent'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-white">{role.display_name}</p>
                                            <p className="text-xs text-slate-400 mt-1">Level: {role.level}</p>
                                        </div>
                                        {role.is_system && (
                                            <Lock className="w-4 h-4 text-slate-500" />
                                        )}
                                    </div>
                                </button>
                            ))
                        )}
                    </CardContent>
                </Card>

                {/* Permission Matrix */}
                <Card className="bg-slate-800 border-slate-700 lg:col-span-3">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-white flex items-center gap-2">
                                Permission Matrix
                                {selectedRole && (
                                    <Badge className={`${getRoleBadgeColor(selectedRole.name)} border ml-2`}>
                                        {selectedRole.display_name}
                                    </Badge>
                                )}
                            </CardTitle>
                            <CardDescription className="text-slate-400">
                                {selectedRole?.name === 'developer'
                                    ? 'Developer permissions cannot be modified'
                                    : 'Configure what this role can read, write, create, and delete'}
                            </CardDescription>
                        </div>
                        {selectedRole && selectedRole.name !== 'developer' && (
                            <Button
                                onClick={handleSavePermissions}
                                disabled={isSaving}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Save Changes
                                    </>
                                )}
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent>
                        {!selectedRole ? (
                            <p className="text-center text-slate-400 py-8">Select a role to view permissions</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-slate-700">
                                            <th className="text-left p-3 text-sm font-medium text-slate-300">Resource</th>
                                            <th className="text-center p-3 text-sm font-medium text-slate-300">
                                                <div className="flex items-center justify-center gap-1">
                                                    <Eye className="w-4 h-4" />
                                                    Read
                                                </div>
                                            </th>
                                            <th className="text-center p-3 text-sm font-medium text-slate-300">
                                                <div className="flex items-center justify-center gap-1">
                                                    <Edit2 className="w-4 h-4" />
                                                    Write
                                                </div>
                                            </th>
                                            <th className="text-center p-3 text-sm font-medium text-slate-300">
                                                <div className="flex items-center justify-center gap-1">
                                                    <Plus className="w-4 h-4" />
                                                    Create
                                                </div>
                                            </th>
                                            <th className="text-center p-3 text-sm font-medium text-slate-300">
                                                <div className="flex items-center justify-center gap-1">
                                                    <Trash2 className="w-4 h-4" />
                                                    Delete
                                                </div>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-700">
                                        {resources.map((resource) => {
                                            const perm = getPermissionForResource(selectedRole, resource);
                                            const isDev = selectedRole.name === 'developer';

                                            return (
                                                <tr key={resource} className="hover:bg-slate-700/30">
                                                    <td className="p-3 text-white font-medium">
                                                        {resourceLabels[resource] || resource}
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <Checkbox
                                                            checked={perm.can_read}
                                                            disabled={isDev}
                                                            onCheckedChange={(v) => handlePermissionChange(resource, 'can_read', v)}
                                                            className="border-slate-500 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                                                        />
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <Checkbox
                                                            checked={perm.can_write}
                                                            disabled={isDev}
                                                            onCheckedChange={(v) => handlePermissionChange(resource, 'can_write', v)}
                                                            className="border-slate-500 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                                                        />
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <Checkbox
                                                            checked={perm.can_create}
                                                            disabled={isDev}
                                                            onCheckedChange={(v) => handlePermissionChange(resource, 'can_create', v)}
                                                            className="border-slate-500 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
                                                        />
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <Checkbox
                                                            checked={perm.can_delete}
                                                            disabled={isDev}
                                                            onCheckedChange={(v) => handlePermissionChange(resource, 'can_delete', v)}
                                                            className="border-slate-500 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
                                                        />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Legend */}
            <Card className="bg-slate-800 border-slate-700">
                <CardContent className="pt-6">
                    <div className="flex flex-wrap gap-6 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-green-500/20 border border-green-500/30" />
                            <span className="text-slate-400">Read - View records</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-blue-500/20 border border-blue-500/30" />
                            <span className="text-slate-400">Write - Edit records</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-purple-500/20 border border-purple-500/30" />
                            <span className="text-slate-400">Create - Add new records</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-red-500/20 border border-red-500/30" />
                            <span className="text-slate-400">Delete - Remove records</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
