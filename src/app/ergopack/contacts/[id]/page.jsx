/**
 * Contact Detail Page - Black & White Immersive Design
 * 
 * View and edit contact details with activity timeline.
 * Clean, minimal interface with no boxy elements.
 * 
 * @module app/ergopack/contacts/[id]/page
 */

'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
    Save, ArrowLeft, Loader2,
    Phone, Mail, Calendar, Clock,
    Plus, MessageSquare, Activity
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

const ACTIVITY_TYPES = [
    { value: 'call', label: 'Call', icon: Phone },
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
    const { user } = useAuth();

    const [contact, setContact] = useState(null);
    const [activities, setActivities] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showActivityForm, setShowActivityForm] = useState(false);

    const [newActivity, setNewActivity] = useState({
        activityType: 'note',
        title: '',
        description: '',
    });

    // Mark contact as seen when opened (for NEW badge tracking - per user)
    useEffect(() => {
        if (!user?.id) return; // Wait for user to load
        const seenKey = `ergopack_seen_${user.id}`;
        const seen = JSON.parse(localStorage.getItem(seenKey) || '{}');
        seen[id] = Date.now();
        localStorage.setItem(seenKey, JSON.stringify(seen));
    }, [id, user?.id]);

    useEffect(() => {
        fetchContact();
        fetchActivities();
    }, [id]);

    const fetchContact = async () => {
        try {
            const response = await fetch(`/api/ergopack/contacts`);
            const data = await response.json();
            const found = data.contacts?.find(c => c.id === id);
            if (found) setContact(found);
        } catch (err) {
            console.error('Failed to load contact');
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
                    city: contact.city,
                    state: contact.state,
                    industry: contact.industry,
                    notes: contact.notes,
                    status: contact.status,
                }),
            });
            const data = await response.json();
            if (data.success) {
                fetchActivities();
            }
        } catch (err) {
            console.error('Failed to save');
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddActivity = async () => {
        if (!newActivity.title.trim()) return;
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
                setShowActivityForm(false);
                setNewActivity({ activityType: 'note', title: '', description: '' });
            }
        } catch (err) {
            console.error('Failed to add activity:', err);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-black">
                <Loader2 className="w-6 h-6 animate-spin text-white" />
            </div>
        );
    }

    if (!contact) {
        return (
            <div className="p-8 text-center bg-black min-h-screen">
                <p className="text-zinc-500">Contact not found</p>
                <Link href="/ergopack/contacts">
                    <Button className="mt-4 bg-white text-black">Back</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black">
            {/* Header - Seamless */}
            <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-xl border-b border-zinc-800/50">
                <div className="max-w-5xl mx-auto px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/ergopack/contacts">
                            <button className="text-zinc-500 hover:text-white transition-colors">
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                        </Link>
                        <div>
                            <h1 className="text-xl font-light text-white">{contact.company_name}</h1>
                            <Badge className="bg-zinc-800 text-zinc-300 text-xs mt-1 capitalize font-light">
                                {contact.status?.replace('_', ' ')}
                            </Badge>
                        </div>
                    </div>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-white text-black hover:bg-zinc-200 font-light"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Save
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-5xl mx-auto px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    {/* Left - Contact Fields */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* Basic Info */}
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-zinc-500 text-xs uppercase tracking-wider">Company</Label>
                                    <Input
                                        value={contact.company_name || ''}
                                        onChange={(e) => handleChange('company_name', e.target.value)}
                                        className="bg-transparent border-0 border-b border-zinc-800 rounded-none px-0 text-white focus:border-white focus:ring-0 font-light"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-zinc-500 text-xs uppercase tracking-wider">Contact</Label>
                                    <Input
                                        value={contact.contact_person || ''}
                                        onChange={(e) => handleChange('contact_person', e.target.value)}
                                        placeholder="-"
                                        className="bg-transparent border-0 border-b border-zinc-800 rounded-none px-0 text-white focus:border-white focus:ring-0 font-light placeholder:text-zinc-700"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-zinc-500 text-xs uppercase tracking-wider">Email</Label>
                                    <Input
                                        value={contact.email || ''}
                                        onChange={(e) => handleChange('email', e.target.value)}
                                        placeholder="-"
                                        className="bg-transparent border-0 border-b border-zinc-800 rounded-none px-0 text-white focus:border-white focus:ring-0 font-light placeholder:text-zinc-700"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-zinc-500 text-xs uppercase tracking-wider">Phone</Label>
                                    <Input
                                        value={contact.phone || ''}
                                        onChange={(e) => handleChange('phone', e.target.value)}
                                        placeholder="-"
                                        className="bg-transparent border-0 border-b border-zinc-800 rounded-none px-0 text-white focus:border-white focus:ring-0 font-light placeholder:text-zinc-700"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-zinc-500 text-xs uppercase tracking-wider">City</Label>
                                    <Input
                                        value={contact.city || ''}
                                        onChange={(e) => handleChange('city', e.target.value)}
                                        placeholder="-"
                                        className="bg-transparent border-0 border-b border-zinc-800 rounded-none px-0 text-white focus:border-white focus:ring-0 font-light placeholder:text-zinc-700"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-zinc-500 text-xs uppercase tracking-wider">State</Label>
                                    <Input
                                        value={contact.state || ''}
                                        onChange={(e) => handleChange('state', e.target.value)}
                                        placeholder="-"
                                        className="bg-transparent border-0 border-b border-zinc-800 rounded-none px-0 text-white focus:border-white focus:ring-0 font-light placeholder:text-zinc-700"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-zinc-500 text-xs uppercase tracking-wider">Industry</Label>
                                    <Input
                                        value={contact.industry || ''}
                                        onChange={(e) => handleChange('industry', e.target.value)}
                                        placeholder="-"
                                        className="bg-transparent border-0 border-b border-zinc-800 rounded-none px-0 text-white focus:border-white focus:ring-0 font-light placeholder:text-zinc-700"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-zinc-500 text-xs uppercase tracking-wider">Status</Label>
                                    <Select value={contact.status || 'new'} onValueChange={(v) => handleChange('status', v)}>
                                        <SelectTrigger className="bg-transparent border-0 border-b border-zinc-800 rounded-none px-0 text-white focus:ring-0">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-900 border-zinc-800">
                                            {STATUS_OPTIONS.map((opt) => (
                                                <SelectItem key={opt.value} value={opt.value} className="text-white focus:bg-zinc-800">
                                                    {opt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2 pt-4">
                                <Label className="text-zinc-500 text-xs uppercase tracking-wider">Notes</Label>
                                <Textarea
                                    value={contact.notes || ''}
                                    onChange={(e) => handleChange('notes', e.target.value)}
                                    placeholder="Add notes..."
                                    rows={4}
                                    className="bg-transparent border border-zinc-800 rounded-lg text-white focus:border-zinc-600 focus:ring-0 font-light placeholder:text-zinc-700 resize-none"
                                />
                            </div>
                        </div>

                        {/* Meta Info */}
                        <div className="pt-6 border-t border-zinc-800/50 flex gap-8 text-xs text-zinc-500">
                            <div>
                                <span className="uppercase tracking-wider">Created</span>
                                <span className="ml-2 text-zinc-400">{new Date(contact.created_at).toLocaleDateString()}</span>
                            </div>
                            <div>
                                <span className="uppercase tracking-wider">By</span>
                                <span className="ml-2 text-zinc-400">{contact.created_by_user?.full_name || '-'}</span>
                            </div>
                            <div>
                                <span className="uppercase tracking-wider">Updated</span>
                                <span className="ml-2 text-zinc-400">{contact.updated_by_user?.full_name || '-'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Right - Activity Timeline */}
                    <div className="lg:col-span-2">
                        <div className="sticky top-24">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xs uppercase tracking-wider text-zinc-500">Activity</h2>
                                <button
                                    onClick={() => setShowActivityForm(!showActivityForm)}
                                    className="text-zinc-500 hover:text-white transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Add Activity Form */}
                            {showActivityForm && (
                                <div className="mb-6 space-y-3 pb-6 border-b border-zinc-800/50">
                                    <div className="flex gap-2">
                                        {ACTIVITY_TYPES.map((t) => (
                                            <button
                                                key={t.value}
                                                onClick={() => setNewActivity({ ...newActivity, activityType: t.value })}
                                                className={`px-3 py-1.5 rounded text-xs transition-colors ${newActivity.activityType === t.value
                                                    ? 'bg-white text-black'
                                                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                                    }`}
                                            >
                                                {t.label}
                                            </button>
                                        ))}
                                    </div>
                                    <Input
                                        value={newActivity.title}
                                        onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
                                        placeholder="Title..."
                                        className="bg-zinc-900 border-zinc-800 text-white text-sm"
                                    />
                                    <Textarea
                                        value={newActivity.description}
                                        onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                                        placeholder="Details (optional)..."
                                        rows={2}
                                        className="bg-zinc-900 border-zinc-800 text-white text-sm resize-none"
                                    />
                                    <Button onClick={handleAddActivity} className="w-full bg-white text-black hover:bg-zinc-200 text-sm">
                                        Add
                                    </Button>
                                </div>
                            )}

                            {/* Timeline */}
                            <div className="space-y-4">
                                {activities.length === 0 ? (
                                    <p className="text-zinc-600 text-sm">No activity yet</p>
                                ) : (
                                    activities.map((activity, index) => {
                                        const Icon = ACTIVITY_ICONS[activity.activity_type] || MessageSquare;
                                        return (
                                            <div key={activity.id} className="flex gap-3 group">
                                                <div className="relative flex flex-col items-center">
                                                    <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0 group-hover:bg-zinc-700 transition-colors">
                                                        <Icon className="w-3 h-3 text-zinc-400" />
                                                    </div>
                                                    {index < activities.length - 1 && (
                                                        <div className="w-px flex-1 bg-zinc-800/50 mt-2" />
                                                    )}
                                                </div>
                                                <div className="flex-1 pb-4">
                                                    <p className="text-sm text-white font-light">
                                                        {activity.title || activity.activity_type?.replace('_', ' ')}
                                                    </p>
                                                    {activity.description && (
                                                        <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{activity.description}</p>
                                                    )}
                                                    <p className="text-xs text-zinc-600 mt-2">
                                                        {activity.created_by_user?.full_name} · {new Date(activity.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
