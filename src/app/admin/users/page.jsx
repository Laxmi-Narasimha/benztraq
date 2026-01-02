/**
 * Admin Users Page
 * 
 * User management interface inspired by Odoo.
 * Allows viewing, creating, editing, and managing users.
 * 
 * @module app/admin/users/page
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
    Users, UserPlus, Edit, Trash2, Search, RefreshCw,
    CheckCircle, XCircle, Mail, Phone, Shield, MapPin,
    AlertCircle, Loader2
} from 'lucide-react';

export default function AdminUsersPage() {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [regions, setRegions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRole, setSelectedRole] = useState('all');
    const [editingUser, setEditingUser] = useState(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Form state for new/edit user
    const [formData, setFormData] = useState({
        email: '',
        fullName: '',
        roleId: '',
        regionId: '',
        designation: '',
        phone: '',
        password: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Fetch users
            const usersRes = await fetch('/api/admin/users');
            const usersData = await usersRes.json();
            if (usersData.users) setUsers(usersData.users);

            // Fetch roles
            const rolesRes = await fetch('/api/admin/roles');
            const rolesData = await rolesRes.json();
            if (rolesData.roles) setRoles(rolesData.roles);

        } catch (error) {
            console.error('Error fetching data:', error);
            setError('Failed to load data');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateUser = () => {
        setEditingUser(null);
        setFormData({
            email: '',
            fullName: '',
            roleId: roles[2]?.id || '', // Default to ASM
            regionId: '',
            designation: '',
            phone: '',
            password: 'Benz@2024'
        });
        setIsDialogOpen(true);
    };

    const handleEditUser = (user) => {
        setEditingUser(user);
        setFormData({
            email: user.email || '',
            fullName: user.full_name || '',
            roleId: user.roles?.id || '',
            regionId: user.regions?.id || '',
            designation: user.designation || '',
            phone: user.phone || '',
            password: ''
        });
        setIsDialogOpen(true);
    };

    const handleSaveUser = async () => {
        setError(null);
        setSuccess(null);

        try {
            if (editingUser) {
                // Update existing user
                const res = await fetch('/api/admin/users', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: editingUser.user_id,
                        fullName: formData.fullName,
                        roleId: formData.roleId,
                        regionId: formData.regionId || null,
                        designation: formData.designation,
                        phone: formData.phone,
                        password: formData.password || undefined
                    })
                });

                const data = await res.json();
                if (data.success) {
                    setSuccess('User updated successfully');
                    fetchData();
                    setIsDialogOpen(false);
                } else {
                    setError(data.error || 'Failed to update user');
                }
            } else {
                // Create new user
                const res = await fetch('/api/admin/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: formData.email,
                        fullName: formData.fullName,
                        roleId: formData.roleId,
                        regionId: formData.regionId || null,
                        designation: formData.designation,
                        phone: formData.phone,
                        password: formData.password || 'Benz@2024'
                    })
                });

                const data = await res.json();
                if (data.success) {
                    setSuccess('User created successfully');
                    fetchData();
                    setIsDialogOpen(false);
                } else {
                    setError(data.error || 'Failed to create user');
                }
            }
        } catch (err) {
            setError('An error occurred');
        }
    };

    const handleToggleActive = async (user) => {
        try {
            const res = await fetch('/api/admin/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.user_id,
                    isActive: !user.is_active
                })
            });

            if (res.ok) {
                fetchData();
                setSuccess(`User ${user.is_active ? 'deactivated' : 'activated'} successfully`);
            }
        } catch (err) {
            setError('Failed to update user status');
        }
    };

    // Filter users based on search and role
    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = selectedRole === 'all' || user.roles?.name === selectedRole;
        return matchesSearch && matchesRole;
    });

    const getRoleBadgeColor = (roleName) => {
        switch (roleName) {
            case 'developer': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
            case 'head_of_sales': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'asm': return 'bg-green-500/20 text-green-400 border-green-500/30';
            default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
        }
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Users className="w-7 h-7 text-blue-400" />
                        User Management
                    </h1>
                    <p className="text-slate-400 mt-1">Manage system users and their access</p>
                </div>
                <Button onClick={handleCreateUser} className="bg-blue-600 hover:bg-blue-700">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add User
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

            {/* Filters */}
            <Card className="bg-slate-800 border-slate-700">
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Search by name or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                            />
                        </div>
                        <Select value={selectedRole} onValueChange={setSelectedRole}>
                            <SelectTrigger className="w-full md:w-48 bg-slate-700 border-slate-600 text-white">
                                <SelectValue placeholder="Filter by role" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-700 border-slate-600">
                                <SelectItem value="all">All Roles</SelectItem>
                                <SelectItem value="developer">Developers</SelectItem>
                                <SelectItem value="head_of_sales">Head of Sales</SelectItem>
                                <SelectItem value="asm">ASM</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="outline" onClick={fetchData} className="border-slate-600 text-slate-300 hover:bg-slate-700">
                            <RefreshCw className="w-4 h-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Users Table */}
            <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-700/50">
                                    <tr>
                                        <th className="text-left p-4 text-sm font-medium text-slate-300">User</th>
                                        <th className="text-left p-4 text-sm font-medium text-slate-300">Role</th>
                                        <th className="text-left p-4 text-sm font-medium text-slate-300">Region</th>
                                        <th className="text-left p-4 text-sm font-medium text-slate-300">Status</th>
                                        <th className="text-left p-4 text-sm font-medium text-slate-300">Last Login</th>
                                        <th className="text-right p-4 text-sm font-medium text-slate-300">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                    {filteredUsers.map((user) => (
                                        <tr key={user.user_id} className="hover:bg-slate-700/30 transition-colors">
                                            <td className="p-4">
                                                <div>
                                                    <p className="font-medium text-white">{user.full_name}</p>
                                                    <p className="text-sm text-slate-400 flex items-center gap-1">
                                                        <Mail className="w-3 h-3" />
                                                        {user.email}
                                                    </p>
                                                    {user.designation && (
                                                        <p className="text-xs text-slate-500">{user.designation}</p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <Badge className={`${getRoleBadgeColor(user.roles?.name)} border`}>
                                                    <Shield className="w-3 h-3 mr-1" />
                                                    {user.roles?.display_name || 'No Role'}
                                                </Badge>
                                            </td>
                                            <td className="p-4">
                                                {user.regions?.name ? (
                                                    <span className="text-slate-300 flex items-center gap-1">
                                                        <MapPin className="w-3 h-3 text-slate-500" />
                                                        {user.regions.name}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-500">-</span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <button
                                                    onClick={() => handleToggleActive(user)}
                                                    className="flex items-center gap-2"
                                                >
                                                    {user.is_active ? (
                                                        <span className="flex items-center gap-1 text-green-400">
                                                            <CheckCircle className="w-4 h-4" />
                                                            Active
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1 text-red-400">
                                                            <XCircle className="w-4 h-4" />
                                                            Inactive
                                                        </span>
                                                    )}
                                                </button>
                                            </td>
                                            <td className="p-4 text-slate-400 text-sm">
                                                {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                                            </td>
                                            <td className="p-4 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEditUser(user)}
                                                    className="text-slate-400 hover:text-white hover:bg-slate-700"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredUsers.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="p-8 text-center text-slate-400">
                                                No users found. Click "Add User" to create one.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create/Edit User Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingUser ? 'Edit User' : 'Create User'}</DialogTitle>
                        <DialogDescription className="text-slate-400">
                            {editingUser ? 'Update user information' : 'Add a new user to the system'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 mt-4">
                        {!editingUser && (
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="user@benz-packaging.com"
                                    className="bg-slate-700 border-slate-600"
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Full Name</Label>
                            <Input
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                placeholder="John Doe"
                                className="bg-slate-700 border-slate-600"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Role</Label>
                            <Select value={formData.roleId} onValueChange={(v) => setFormData({ ...formData, roleId: v })}>
                                <SelectTrigger className="bg-slate-700 border-slate-600">
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-700 border-slate-600">
                                    {roles.map((role) => (
                                        <SelectItem key={role.id} value={role.id}>
                                            {role.display_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Designation</Label>
                            <Input
                                value={formData.designation}
                                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                                placeholder="Area Sales Manager"
                                className="bg-slate-700 border-slate-600"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Phone (Optional)</Label>
                            <Input
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="+91 9876543210"
                                className="bg-slate-700 border-slate-600"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>{editingUser ? 'New Password (leave blank to keep current)' : 'Password'}</Label>
                            <Input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                placeholder={editingUser ? '••••••••' : 'Benz@2024'}
                                className="bg-slate-700 border-slate-600"
                            />
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-slate-600">
                                Cancel
                            </Button>
                            <Button onClick={handleSaveUser} className="bg-blue-600 hover:bg-blue-700">
                                {editingUser ? 'Update User' : 'Create User'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
