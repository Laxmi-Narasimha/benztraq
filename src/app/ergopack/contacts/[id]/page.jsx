/**
 * Contact Detail Page - Premium Dark Theme
 * 
 * Unified fields matching New Lead form.
 * Prominent "Log Activity" button.
 * "Create Quotation" feature integrated.
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
    Save, ArrowLeft, Loader2, Trash2, FileText,
    Phone, Mail, Calendar, Clock, Building2,
    Plus, MessageSquare, Activity, MapPin, User, Package, Briefcase
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import QuotationGenerator from '@/components/ergopack/quotation-generator';

const STATUS_OPTIONS = [
    { value: 'open', label: 'Open' },
    { value: 'contacted', label: 'Contacted' },
    { value: 'proposal_sent', label: 'Proposal Sent' },
    { value: 'deal_done', label: 'Deal Done' },
    { value: 'lost', label: 'Lost' },
    { value: 'not_serviceable', label: 'Not Serviceable' },
];

const SUGGESTED_MODELS = [
    { value: 'ergopack-726x-li', label: 'Ergopack 726X-Li' },
    { value: 'ergopack-go', label: 'Ergopack Go' },
    { value: 'ergopack-700', label: 'Ergopack 700 Crank' },
    { value: 'other', label: 'Other' },
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
    const { user, isDirector, isDeveloper } = useAuth();

    const [contact, setContact] = useState(null);
    const [activities, setActivities] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showActivityForm, setShowActivityForm] = useState(false);
    const [showQuotationModal, setShowQuotationModal] = useState(false);

    const canDelete = isDirector || isDeveloper;

    const [newActivity, setNewActivity] = useState({
        activityType: 'note',
        title: '',
        description: '',
    });

    // Mark as seen
    useEffect(() => {
        if (!user?.id) return;
        const seenKey = `ergopack_seen_${user.id}`;
        try {
            const seen = JSON.parse(localStorage.getItem(seenKey) || '{}');
            seen[id] = Date.now();
            localStorage.setItem(seenKey, JSON.stringify(seen));
        } catch (e) {
            console.error('Error updating seen status', e);
        }
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
                toast.success('Contact updated');
            } else {
                toast.error('Failed to update contact');
            }
        } catch (err) {
            toast.error('Error saving changes');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm(`Delete ${contact.company_name}? This cannot be undone.`)) return;
        try {
            const res = await fetch(`/api/ergopack/contacts?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('Contact deleted');
                router.push('/ergopack/contacts');
            } else {
                const data = await res.json();
                toast.error(data.error || 'Failed to delete');
            }
        } catch (err) {
            toast.error('Error deleting contact');
        }
    };

    const handleAddActivity = async () => {
        if (!newActivity.title.trim()) return;
        try {
            const response = await fetch('/api/ergopack/activities', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contactId: id, ...newActivity }),
            });
            const data = await response.json();
            if (data.success) {
                setActivities([data.activity, ...activities]);
                setShowActivityForm(false);
                setNewActivity({ activityType: 'note', title: '', description: '' });
                toast.success('Activity logged');
            }
        } catch (err) {
            toast.error('Failed to log activity');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#050505]">
                <Loader2 className="w-6 h-6 animate-spin text-white" />
            </div>
        );
    }

    if (!contact) {
        return (
            <div className="p-8 text-center bg-[#050505] min-h-screen">
                <p className="text-zinc-500">Contact not found</p>
                <Link href="/ergopack/contacts">
                    <Button className="mt-4 bg-white text-black">Back</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505]">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-[#050505]/90 backdrop-blur-xl border-b border-zinc-900">
                <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/ergopack/contacts">
                            <button className="text-zinc-500 hover:text-white transition-colors">
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                        </Link>
                        <div>
                            <h1 className="text-lg font-light text-white">{contact.company_name}</h1>
                            <Badge className="bg-zinc-800 text-zinc-300 text-[10px] capitalize">
                                {contact.status?.replace('_', ' ')}
                            </Badge>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowQuotationModal(true)}
                            className="border-amber-500/50 text-amber-400 hover:bg-amber-500/20 hover:text-amber-300 h-8"
                        >
                            <FileText className="w-3.5 h-3.5 mr-1" />
                            Create Quote
                        </Button>
                        {canDelete && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleDelete}
                                className="text-zinc-500 hover:text-red-400 hover:bg-zinc-900 h-8 w-8"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        )}
                        <Button
                            size="sm"
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-white text-black hover:bg-zinc-200 h-8"
                        >
                            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1" />}
                            Save
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-6xl mx-auto px-4 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left - Fields (matching New Lead form) */}
                    <div className="lg:col-span-2 space-y-5">
                        {/* Row 1: Company + Contact */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className="text-zinc-500 text-[10px] uppercase tracking-widest flex items-center gap-1">
                                    <Building2 className="w-3 h-3" /> Company
                                </Label>
                                <Input
                                    value={contact.company_name || ''}
                                    onChange={(e) => handleChange('company_name', e.target.value)}
                                    className="bg-zinc-900/50 border-zinc-800 text-white h-9 font-light"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-zinc-500 text-[10px] uppercase tracking-widest flex items-center gap-1">
                                    <User className="w-3 h-3" /> Contact Person
                                </Label>
                                <Input
                                    value={contact.contact_person || ''}
                                    onChange={(e) => handleChange('contact_person', e.target.value)}
                                    placeholder="-"
                                    className="bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-700 h-9 font-light"
                                />
                            </div>
                        </div>

                        {/* Row 2: Email + Phone */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className="text-zinc-500 text-[10px] uppercase tracking-widest flex items-center gap-1">
                                    <Mail className="w-3 h-3" /> Email
                                </Label>
                                <Input
                                    value={contact.email || ''}
                                    onChange={(e) => handleChange('email', e.target.value)}
                                    placeholder="-"
                                    className="bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-700 h-9 font-light"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-zinc-500 text-[10px] uppercase tracking-widest flex items-center gap-1">
                                    <Phone className="w-3 h-3" /> Phone
                                </Label>
                                <Input
                                    value={contact.phone || ''}
                                    onChange={(e) => handleChange('phone', e.target.value)}
                                    placeholder="-"
                                    className="bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-700 h-9 font-light"
                                />
                            </div>
                        </div>

                        {/* Row 3: City + State */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className="text-zinc-500 text-[10px] uppercase tracking-widest flex items-center gap-1">
                                    <MapPin className="w-3 h-3" /> City
                                </Label>
                                <Input
                                    value={contact.city || ''}
                                    onChange={(e) => handleChange('city', e.target.value)}
                                    placeholder="-"
                                    className="bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-700 h-9 font-light"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-zinc-500 text-[10px] uppercase tracking-widest">State</Label>
                                <Input
                                    value={contact.state || ''}
                                    onChange={(e) => handleChange('state', e.target.value)}
                                    placeholder="-"
                                    className="bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-700 h-9 font-light"
                                />
                            </div>
                        </div>

                        {/* Row 4: Industry + Status */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className="text-zinc-500 text-[10px] uppercase tracking-widest flex items-center gap-1">
                                    <Briefcase className="w-3 h-3" /> Industry
                                </Label>
                                <Input
                                    value={contact.industry || ''}
                                    onChange={(e) => handleChange('industry', e.target.value)}
                                    placeholder="-"
                                    className="bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-700 h-9 font-light"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-zinc-500 text-[10px] uppercase tracking-widest">Status</Label>
                                <Select value={contact.status || 'open'} onValueChange={(v) => handleChange('status', v)}>
                                    <SelectTrigger className="bg-zinc-900/50 border-zinc-800 text-white h-9">
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

                        {/* Row 5: Suggested Model + Product Interest */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className="text-zinc-500 text-[10px] uppercase tracking-widest flex items-center gap-1">
                                    <Package className="w-3 h-3" /> Suggested Models
                                </Label>
                                <div className="flex flex-wrap gap-2 p-2 bg-zinc-900/50 border border-zinc-800 rounded-md min-h-[36px]">
                                    {SUGGESTED_MODELS.filter(opt => opt.value).map((opt) => {
                                        const models = (contact.suggested_model || '').split(',').filter(Boolean);
                                        const isSelected = models.includes(opt.value);
                                        return (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => {
                                                    const newModels = isSelected
                                                        ? models.filter(m => m !== opt.value)
                                                        : [...models, opt.value];
                                                    handleChange('suggested_model', newModels.join(','));
                                                }}
                                                className={`px-2 py-1 text-xs rounded-md border transition-all ${isSelected
                                                        ? 'bg-emerald-600 border-emerald-500 text-white'
                                                        : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                                                    }`}
                                            >
                                                {opt.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-zinc-500 text-[10px] uppercase tracking-widest">Product Interest</Label>
                                <Input
                                    value={contact.product_interest || ''}
                                    onChange={(e) => handleChange('product_interest', e.target.value)}
                                    placeholder="-"
                                    className="bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-700 h-9 font-light"
                                />
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="space-y-1">
                            <Label className="text-zinc-500 text-[10px] uppercase tracking-widest">Notes</Label>
                            <Textarea
                                value={contact.notes || ''}
                                onChange={(e) => handleChange('notes', e.target.value)}
                                placeholder="Add notes..."
                                rows={3}
                                className="bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-700 font-light resize-none"
                            />
                        </div>

                        {/* Meta Info */}
                        <div className="pt-4 border-t border-zinc-900 flex gap-6 text-[10px] text-zinc-600">
                            <div>
                                <span className="uppercase tracking-wider">Created</span>
                                <span className="ml-2 text-zinc-500">{new Date(contact.created_at).toLocaleDateString()}</span>
                            </div>
                            <div>
                                <span className="uppercase tracking-wider">By</span>
                                <span className="ml-2 text-zinc-500">{contact.created_by_user?.full_name || '-'}</span>
                            </div>
                            <div>
                                <span className="uppercase tracking-wider">Updated</span>
                                <span className="ml-2 text-zinc-500">{contact.updated_by_user?.full_name || '-'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Right - Activity */}
                    <div className="lg:col-span-1 bg-zinc-900/30 rounded-xl border border-zinc-800/60 p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xs uppercase tracking-widest text-zinc-500 font-medium">Activity</h2>
                            <Button
                                size="sm"
                                onClick={() => setShowActivityForm(!showActivityForm)}
                                className={cn(
                                    "h-7 text-xs",
                                    showActivityForm
                                        ? "bg-zinc-800 text-zinc-400"
                                        : "bg-emerald-600 hover:bg-emerald-500 text-white"
                                )}
                            >
                                <Plus className="w-3 h-3 mr-1" />
                                Log Activity
                            </Button>
                        </div>

                        {/* Add Activity Form */}
                        {showActivityForm && (
                            <div className="mb-4 space-y-3 pb-4 border-b border-zinc-800/50">
                                <div className="flex flex-wrap gap-1.5">
                                    {ACTIVITY_TYPES.map((t) => (
                                        <button
                                            key={t.value}
                                            onClick={() => setNewActivity({ ...newActivity, activityType: t.value })}
                                            className={cn(
                                                "px-2.5 py-1 rounded text-[10px] transition-colors",
                                                newActivity.activityType === t.value
                                                    ? 'bg-white text-black'
                                                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                            )}
                                        >
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                                <Input
                                    value={newActivity.title}
                                    onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
                                    placeholder="Title..."
                                    className="bg-zinc-900 border-zinc-800 text-white text-xs h-8"
                                />
                                <Textarea
                                    value={newActivity.description}
                                    onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                                    placeholder="Details (optional)..."
                                    rows={2}
                                    className="bg-zinc-900 border-zinc-800 text-white text-xs resize-none"
                                />
                                <Button onClick={handleAddActivity} className="w-full bg-white text-black hover:bg-zinc-200 text-xs h-8">
                                    Add Activity
                                </Button>
                            </div>
                        )}

                        {/* Timeline */}
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                            {activities.length === 0 ? (
                                <p className="text-zinc-600 text-xs text-center py-4">No activity yet</p>
                            ) : (
                                activities.map((activity, index) => {
                                    const Icon = ACTIVITY_ICONS[activity.activity_type] || MessageSquare;
                                    return (
                                        <div key={activity.id} className="flex gap-2 group">
                                            <div className="relative flex flex-col items-center">
                                                <div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0 group-hover:bg-zinc-700 transition-colors">
                                                    <Icon className="w-2.5 h-2.5 text-zinc-400" />
                                                </div>
                                                {index < activities.length - 1 && (
                                                    <div className="w-px flex-1 bg-zinc-800/50 mt-1" />
                                                )}
                                            </div>
                                            <div className="flex-1 pb-3">
                                                <p className="text-xs text-white font-light">
                                                    {activity.title || activity.activity_type?.replace('_', ' ')}
                                                </p>
                                                {activity.description && (
                                                    <p className="text-[10px] text-zinc-500 mt-0.5 leading-relaxed">{activity.description}</p>
                                                )}
                                                <p className="text-[10px] text-zinc-600 mt-1">
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

            {/* Quotation Generator Modal */}
            <QuotationGenerator
                open={showQuotationModal}
                onOpenChange={setShowQuotationModal}
                contact={contact}
            />
        </div>
    );
}
