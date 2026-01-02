/**
 * Contact Detail Page
 * 
 * View and edit contact details with activity timeline.
 * 
 * @module app/ergopack/contacts/[id]/page
 */

'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
    Building2, Save, ArrowLeft, AlertCircle, Loader2,
    Phone, Mail, Globe, MapPin, Clock, User,
    Plus, MessageSquare, Calendar, Activity, CheckCircle
} from 'lucide-react';

const STATUS_OPTIONS = [
    { value: 'new', label: 'New' },
    { value: 'contacted', label: 'Contacted' },
    { value: 'interested', label: 'Interested' },
    { value: 'negotiating', label: 'Negotiating' },
    { value: 'proposal_sent', label: 'Proposal Sent' },
    { value: 'won', label: 'Won' },
    { value: 'lost', label: 'Lost' },
    { value: 'dormant', label: 'Dormant' },
];

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

const ACTIVITY_TYPES = [
    { value: 'call', label: 'Phone Call', icon: Phone },
    { value: 'email', label: 'Email', icon: Mail },
    { value: 'meeting', label: 'Meeting', icon: Calendar },
    { value: 'note', label: 'Note', icon: MessageSquare },
    { value: 'follow_up', label: 'Follow-up', icon: Clock },
];

const ACTIVITY_ICONS = {
    call: Phone,
    email: Mail,
    meeting: Calendar,
    note: MessageSquare,
    follow_up: Clock,
    status_change: Activity,
};

export default function ContactDetailPage({ params }) {
    const { id } = use(params);
    const router = useRouter();

    const [contact, setContact] = useState(null);
    const [activities, setActivities] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [isActivityDialogOpen, setIsActivityDialogOpen] = useState(false);

    // Activity form
    const [newActivity, setNewActivity] = useState({
        activityType: 'note',
        title: '',
        description: '',
    });

    useEffect(() => {
        fetchContact();
        fetchActivities();
    }, [id]);

    const fetchContact = async () => {
        try {
            const response = await fetch(`/api/ergopack/contacts`);
            const data = await response.json();
            const found = data.contacts?.find(c => c.id === id);
            if (found) {
                setContact(found);
            } else {
                setError('Contact not found');
            }
        } catch (err) {
            setError('Failed to load contact');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchActivities = async () => {
        try {
            const response = await fetch(`/api/ergopack/activities?contactId=${id}`);
            const data = await response.json();
            if (data.activities) setActivities(data.activities);
        } catch (err) {
            console.error('Failed to load activities:', err);
        }
    };

    const handleChange = (field, value) => {
        setContact(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await fetch('/api/ergopack/contacts', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: contact.id,
                    companyName: contact.company_name,
                    contactPerson: contact.contact_person,
                    email: contact.email,
                    phone: contact.phone,
                    website: contact.website,
                    city: contact.city,
                    state: contact.state,
                    industry: contact.industry,
                    source: contact.source,
                    notes: contact.notes,
                    priority: contact.priority,
                    status: contact.status,
                }),
            });

            const data = await response.json();
            if (data.success) {
                setSuccess('Contact updated successfully');
                fetchActivities(); // Refresh activities for status change
            } else {
                setError(data.error || 'Failed to update');
            }
        } catch (err) {
            setError('An error occurred');
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddActivity = async () => {
        try {
            const response = await fetch('/api/ergopack/activities', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contactId: id,
                    ...newActivity,
                }),
            });

            const data = await response.json();
            if (data.success) {
                setActivities([data.activity, ...activities]);
                setIsActivityDialogOpen(false);
                setNewActivity({ activityType: 'note', title: '', description: '' });
            }
        } catch (err) {
            console.error('Failed to add activity:', err);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
        );
    }

    if (!contact) {
        return (
            <div className="p-8 text-center">
                <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">{error || 'Contact not found'}</p>
                <Link href="/ergopack/contacts">
                    <Button className="mt-4">Back to Contacts</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link href="/ergopack/contacts">
                        <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-slate-700">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white">{contact.company_name}</h1>
                        <div className="flex items-center gap-3 mt-1">
                            <Badge className={`${STATUS_COLORS[contact.status]} border capitalize`}>
                                {contact.status?.replace('_', ' ')}
                            </Badge>
                            {contact.city && (
                                <span className="text-sm text-slate-400 flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {contact.city}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-emerald-600 hover:bg-emerald-700"
                >
                    {isSaving ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                        <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Changes
                </Button>
            </div>

            {/* Alerts */}
            {success && (
                <Alert className="mb-6 border-emerald-500 bg-emerald-500/10">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <AlertDescription className="text-emerald-400">{success}</AlertDescription>
                </Alert>
            )}
            {error && (
                <Alert className="mb-6 border-red-500 bg-red-500/10">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <AlertDescription className="text-red-400">{error}</AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Contact Details */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="bg-slate-800 border-slate-700">
                        <CardHeader>
                            <CardTitle className="text-white">Contact Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-slate-300">Company Name</Label>
                                    <Input
                                        value={contact.company_name || ''}
                                        onChange={(e) => handleChange('company_name', e.target.value)}
                                        className="bg-slate-700 border-slate-600 text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-300">Contact Person</Label>
                                    <Input
                                        value={contact.contact_person || ''}
                                        onChange={(e) => handleChange('contact_person', e.target.value)}
                                        className="bg-slate-700 border-slate-600 text-white"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-slate-300">Email</Label>
                                    <Input
                                        value={contact.email || ''}
                                        onChange={(e) => handleChange('email', e.target.value)}
                                        className="bg-slate-700 border-slate-600 text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-300">Phone</Label>
                                    <Input
                                        value={contact.phone || ''}
                                        onChange={(e) => handleChange('phone', e.target.value)}
                                        className="bg-slate-700 border-slate-600 text-white"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-slate-300">City</Label>
                                    <Input
                                        value={contact.city || ''}
                                        onChange={(e) => handleChange('city', e.target.value)}
                                        className="bg-slate-700 border-slate-600 text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-300">State</Label>
                                    <Input
                                        value={contact.state || ''}
                                        onChange={(e) => handleChange('state', e.target.value)}
                                        className="bg-slate-700 border-slate-600 text-white"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-slate-300">Industry</Label>
                                    <Input
                                        value={contact.industry || ''}
                                        onChange={(e) => handleChange('industry', e.target.value)}
                                        className="bg-slate-700 border-slate-600 text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-300">Status</Label>
                                    <Select value={contact.status || 'new'} onValueChange={(v) => handleChange('status', v)}>
                                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-700 border-slate-600">
                                            {STATUS_OPTIONS.map((opt) => (
                                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-slate-300">Notes</Label>
                                <Textarea
                                    value={contact.notes || ''}
                                    onChange={(e) => handleChange('notes', e.target.value)}
                                    rows={4}
                                    className="bg-slate-700 border-slate-600 text-white"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Activity Timeline */}
                <div className="space-y-6">
                    <Card className="bg-slate-800 border-slate-700">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-white">Activity</CardTitle>
                            <Dialog open={isActivityDialogOpen} onOpenChange={setIsActivityDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-slate-800 border-slate-700">
                                    <DialogHeader>
                                        <DialogTitle className="text-white">Add Activity</DialogTitle>
                                        <DialogDescription className="text-slate-400">
                                            Log a call, email, or note for this contact
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 mt-4">
                                        <div className="space-y-2">
                                            <Label className="text-slate-300">Type</Label>
                                            <Select
                                                value={newActivity.activityType}
                                                onValueChange={(v) => setNewActivity({ ...newActivity, activityType: v })}
                                            >
                                                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-slate-700 border-slate-600">
                                                    {ACTIVITY_TYPES.map((t) => (
                                                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-slate-300">Title</Label>
                                            <Input
                                                value={newActivity.title}
                                                onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
                                                placeholder="Brief summary..."
                                                className="bg-slate-700 border-slate-600 text-white"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-slate-300">Details</Label>
                                            <Textarea
                                                value={newActivity.description}
                                                onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                                                rows={3}
                                                className="bg-slate-700 border-slate-600 text-white"
                                            />
                                        </div>
                                        <Button onClick={handleAddActivity} className="w-full bg-emerald-600 hover:bg-emerald-700">
                                            Add Activity
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>
                        <CardContent>
                            {activities.length === 0 ? (
                                <p className="text-center text-slate-500 py-8">No activities yet</p>
                            ) : (
                                <div className="space-y-4">
                                    {activities.map((activity) => {
                                        const Icon = ACTIVITY_ICONS[activity.activity_type] || MessageSquare;
                                        return (
                                            <div key={activity.id} className="flex gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                                                    <Icon className="w-4 h-4 text-slate-400" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm text-white font-medium">
                                                        {activity.title || activity.activity_type}
                                                    </p>
                                                    {activity.description && (
                                                        <p className="text-sm text-slate-400 mt-1">{activity.description}</p>
                                                    )}
                                                    <p className="text-xs text-slate-500 mt-1">
                                                        {activity.created_by_user?.full_name} · {new Date(activity.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Quick Info */}
                    <Card className="bg-slate-800 border-slate-700">
                        <CardContent className="pt-6">
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Created</span>
                                    <span className="text-slate-300">{new Date(contact.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Last Updated</span>
                                    <span className="text-slate-300">{new Date(contact.updated_at).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Updated By</span>
                                    <span className="text-slate-300">{contact.updated_by_user?.full_name || '-'}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
