/**
 * Contact Detail Page - Premium Earthy Theme
 * 
 * Color Palette: Charcoal #111111, Beige #AD7D56, Rodeo #CDB49E, Ivory #F5F1EC
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
    Plus, MessageSquare, Activity, MapPin, User, Package, Briefcase,
    Upload, Download, Eye, X, FilePlus
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

    // Presentation upload state
    const [presentationInfo, setPresentationInfo] = useState(null);
    const [isUploadingPresentation, setIsUploadingPresentation] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    // Quotation state
    const [quotationInfo, setQuotationInfo] = useState(null);

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
        fetchPresentationInfo();
        fetchQuotationInfo();
    }, [id]);

    const fetchPresentationInfo = async () => {
        try {
            const response = await fetch(`/api/ergopack/presentations?contactId=${id}`);
            const data = await response.json();
            if (data.success) {
                setPresentationInfo(data);
            }
        } catch (err) {
            console.error('Failed to load presentation info:', err);
        }
    };

    const fetchQuotationInfo = async () => {
        try {
            const response = await fetch(`/api/ergopack/quotations?contactId=${id}`);
            const data = await response.json();
            if (data.success) {
                setQuotationInfo(data);
            }
        } catch (err) {
            console.error('Failed to load quotation info:', err);
        }
    };

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

    // Presentation handlers
    const handlePresentationUpload = async (file) => {
        if (!file) return;

        if (file.type !== 'application/pdf') {
            toast.error('Only PDF files are allowed');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            toast.error('File size must be less than 10MB');
            return;
        }

        setIsUploadingPresentation(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('contactId', id);

            const response = await fetch('/api/ergopack/presentations', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();
            if (data.success) {
                toast.success('Presentation uploaded successfully');
                fetchPresentationInfo();
                fetchActivities();
            } else {
                toast.error(data.error || 'Failed to upload presentation');
            }
        } catch (err) {
            console.error('Upload error:', err);
            toast.error('Error uploading presentation');
        } finally {
            setIsUploadingPresentation(false);
        }
    };

    const handlePresentationDelete = async () => {
        if (!confirm('Delete this presentation? This cannot be undone.')) return;

        try {
            const response = await fetch(`/api/ergopack/presentations?contactId=${id}`, {
                method: 'DELETE',
            });

            const data = await response.json();
            if (data.success) {
                toast.success('Presentation deleted');
                setPresentationInfo({ success: true, hasPresentation: false });
                fetchActivities();
            } else {
                toast.error(data.error || 'Failed to delete presentation');
            }
        } catch (err) {
            toast.error('Error deleting presentation');
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) {
            handlePresentationUpload(file);
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            handlePresentationUpload(file);
        }
    };

    const handleQuotationDelete = async () => {
        if (!confirm('Delete this quotation? This cannot be undone.')) return;

        try {
            const response = await fetch(`/api/ergopack/quotations?contactId=${id}`, {
                method: 'DELETE',
            });

            const data = await response.json();
            if (data.success) {
                toast.success('Quotation deleted');
                setQuotationInfo({ success: true, hasQuotation: false });
                fetchActivities();
            } else {
                toast.error(data.error || 'Failed to delete quotation');
            }
        } catch (err) {
            toast.error('Error deleting quotation');
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
        <div className="min-h-screen bg-[#111111]">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-[#111111]/90 backdrop-blur-xl border-b border-[#2a2a2a]">
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/ergopack/contacts">
                            <button className="text-[#CDB49E] hover:text-[#F5F1EC] transition-colors">
                                <ArrowLeft className="w-6 h-6" />
                            </button>
                        </Link>
                        <div>
                            <h1 className="text-xl font-semibold text-[#F5F1EC]">{contact.company_name}</h1>
                            <Badge className="bg-[#AD7D56]/20 text-[#AD7D56] border border-[#AD7D56]/40 text-xs capitalize mt-1">
                                {contact.status?.replace('_', ' ')}
                            </Badge>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowQuotationModal(true)}
                            className="border-[#AD7D56] text-[#AD7D56] hover:bg-[#AD7D56]/20 h-8"
                        >
                            <FileText className="w-3.5 h-3.5 mr-1" />
                            Create Quote
                        </Button>
                        {canDelete && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleDelete}
                                className="text-[#555] hover:text-red-400 hover:bg-red-500/10 h-8 w-8"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        )}
                        <Button
                            size="sm"
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-[#AD7D56] text-white hover:bg-[#9A6B47] h-8"
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
                    <div className="lg:col-span-2 space-y-6">
                        {/* Row 1: Company + Contact */}
                        <div className="grid grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <Label className="text-[#CDB49E] text-sm font-medium uppercase tracking-wide flex items-center gap-2">
                                    <Building2 className="w-4 h-4" /> Company
                                </Label>
                                <Input
                                    value={contact.company_name || ''}
                                    onChange={(e) => handleChange('company_name', e.target.value)}
                                    className="bg-[#1a1a1a] border-[#3a3a3a] text-[#F5F1EC] text-base h-12 focus:border-[#AD7D56] focus:ring-[#AD7D56]/20"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[#CDB49E] text-sm font-medium uppercase tracking-wide flex items-center gap-2">
                                    <User className="w-4 h-4" /> Contact Person
                                </Label>
                                <Input
                                    value={contact.contact_person || ''}
                                    onChange={(e) => handleChange('contact_person', e.target.value)}
                                    placeholder="-"
                                    className="bg-[#1a1a1a] border-[#3a3a3a] text-[#F5F1EC] placeholder:text-[#555] text-base h-12 focus:border-[#AD7D56] focus:ring-[#AD7D56]/20"
                                />
                            </div>
                        </div>

                        {/* Row 2: Email + Phone */}
                        <div className="grid grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <Label className="text-[#CDB49E] text-sm font-medium uppercase tracking-wide flex items-center gap-2">
                                    <Mail className="w-4 h-4" /> Email
                                </Label>
                                <Input
                                    value={contact.email || ''}
                                    onChange={(e) => handleChange('email', e.target.value)}
                                    placeholder="-"
                                    className="bg-[#1a1a1a] border-[#3a3a3a] text-[#F5F1EC] placeholder:text-[#555] text-base h-12 focus:border-[#AD7D56] focus:ring-[#AD7D56]/20"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[#CDB49E] text-sm font-medium uppercase tracking-wide flex items-center gap-2">
                                    <Phone className="w-4 h-4" /> Phone
                                </Label>
                                <Input
                                    value={contact.phone || ''}
                                    onChange={(e) => handleChange('phone', e.target.value)}
                                    placeholder="-"
                                    className="bg-[#1a1a1a] border-[#3a3a3a] text-[#F5F1EC] placeholder:text-[#555] text-base h-12 focus:border-[#AD7D56] focus:ring-[#AD7D56]/20"
                                />
                            </div>
                        </div>

                        {/* Row 3: City + State */}
                        <div className="grid grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <Label className="text-[#CDB49E] text-sm font-medium uppercase tracking-wide flex items-center gap-2">
                                    <MapPin className="w-4 h-4" /> City
                                </Label>
                                <Input
                                    value={contact.city || ''}
                                    onChange={(e) => handleChange('city', e.target.value)}
                                    placeholder="-"
                                    className="bg-[#1a1a1a] border-[#3a3a3a] text-[#F5F1EC] placeholder:text-[#555] text-base h-12 focus:border-[#AD7D56] focus:ring-[#AD7D56]/20"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[#CDB49E] text-sm font-medium uppercase tracking-wide">State</Label>
                                <Input
                                    value={contact.state || ''}
                                    onChange={(e) => handleChange('state', e.target.value)}
                                    placeholder="-"
                                    className="bg-[#1a1a1a] border-[#3a3a3a] text-[#F5F1EC] placeholder:text-[#555] text-base h-12 focus:border-[#AD7D56] focus:ring-[#AD7D56]/20"
                                />
                            </div>
                        </div>

                        {/* Row 4: Industry + Status */}
                        <div className="grid grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <Label className="text-[#CDB49E] text-sm font-medium uppercase tracking-wide flex items-center gap-2">
                                    <Briefcase className="w-4 h-4" /> Industry
                                </Label>
                                <Input
                                    value={contact.industry || ''}
                                    onChange={(e) => handleChange('industry', e.target.value)}
                                    placeholder="-"
                                    className="bg-[#1a1a1a] border-[#3a3a3a] text-[#F5F1EC] placeholder:text-[#555] text-base h-12 focus:border-[#AD7D56] focus:ring-[#AD7D56]/20"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[#CDB49E] text-sm font-medium uppercase tracking-wide">Status</Label>
                                <Select value={contact.status || 'open'} onValueChange={(v) => handleChange('status', v)}>
                                    <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-[#F5F1EC] text-base h-12">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#1a1a1a] border-[#3a3a3a]">
                                        {STATUS_OPTIONS.map((opt) => (
                                            <SelectItem key={opt.value} value={opt.value} className="text-[#F5F1EC] text-base focus:bg-[#2a2a2a]">
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Row 5: Suggested Model + Product Interest */}
                        <div className="grid grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <Label className="text-[#CDB49E] text-sm font-medium uppercase tracking-wide flex items-center gap-2">
                                    <Package className="w-4 h-4" /> Suggested Models
                                </Label>
                                <div className="flex flex-wrap gap-2 p-3 bg-[#1a1a1a] border border-[#3a3a3a] rounded-md min-h-[48px]">
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
                                                className={`px-3 py-1.5 text-sm font-medium rounded-md border transition-all ${isSelected
                                                    ? 'bg-[#AD7D56] border-[#AD7D56] text-white'
                                                    : 'bg-[#2a2a2a] border-[#3a3a3a] text-[#CDB49E] hover:border-[#AD7D56]'
                                                    }`}
                                            >
                                                {opt.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[#CDB49E] text-sm font-medium uppercase tracking-wide">Product Interest</Label>
                                <Input
                                    value={contact.product_interest || ''}
                                    onChange={(e) => handleChange('product_interest', e.target.value)}
                                    placeholder="-"
                                    className="bg-[#1a1a1a] border-[#3a3a3a] text-[#F5F1EC] placeholder:text-[#555] text-base h-12 focus:border-[#AD7D56] focus:ring-[#AD7D56]/20"
                                />
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="space-y-2">
                            <Label className="text-[#CDB49E] text-sm font-medium uppercase tracking-wide">Notes</Label>
                            <Textarea
                                value={contact.notes || ''}
                                onChange={(e) => handleChange('notes', e.target.value)}
                                placeholder="Add notes..."
                                rows={4}
                                className="bg-[#1a1a1a] border-[#3a3a3a] text-[#F5F1EC] placeholder:text-[#555] text-base resize-none focus:border-[#AD7D56] focus:ring-[#AD7D56]/20"
                            />
                        </div>

                        {/* Company Presentation */}
                        <div className="space-y-3 pt-5 mt-5 border-t border-[#2a2a2a]">
                            <Label className="text-[#CDB49E] text-sm font-medium uppercase tracking-wide flex items-center gap-2">
                                <FileText className="w-4 h-4" /> Company Presentation
                            </Label>

                            {presentationInfo?.hasPresentation ? (
                                /* Show existing presentation */
                                <div className="bg-zinc-900/70 border border-zinc-700 rounded-lg p-5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center">
                                                <FileText className="w-6 h-6 text-red-400" />
                                            </div>
                                            <div>
                                                <p className="text-base text-white font-medium">{presentationInfo.fileName}</p>
                                                <p className="text-sm text-zinc-500">
                                                    Uploaded {new Date(presentationInfo.uploadedAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <a
                                                href={presentationInfo.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                                                title="View"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </a>
                                            <a
                                                href={presentationInfo.url}
                                                download={presentationInfo.fileName}
                                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                                                title="Download"
                                            >
                                                <Download className="w-4 h-4" />
                                            </a>
                                            <button
                                                onClick={handlePresentationDelete}
                                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-800 hover:bg-red-900/50 text-zinc-400 hover:text-red-400 transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* Upload area */
                                <div
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    className={cn(
                                        "border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer",
                                        isDragging
                                            ? "border-emerald-500 bg-emerald-500/10"
                                            : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/30"
                                    )}
                                >
                                    {isUploadingPresentation ? (
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                                            <p className="text-sm text-zinc-400">Uploading...</p>
                                        </div>
                                    ) : (
                                        <>
                                            <input
                                                type="file"
                                                accept="application/pdf"
                                                onChange={handleFileSelect}
                                                className="hidden"
                                                id="presentation-upload"
                                            />
                                            <label htmlFor="presentation-upload" className="cursor-pointer">
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="w-14 h-14 rounded-xl bg-zinc-800 flex items-center justify-center">
                                                        <Upload className="w-7 h-7 text-zinc-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-base text-zinc-300">Drop PDF here or click to upload</p>
                                                        <p className="text-sm text-zinc-500 mt-1">Max file size: 10MB</p>
                                                    </div>
                                                </div>
                                            </label>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Saved Quotation */}
                        {quotationInfo?.hasQuotation && (
                            <div className="space-y-3">
                                <Label className="text-zinc-400 text-sm font-medium uppercase tracking-wide flex items-center gap-2">
                                    <FileText className="w-4 h-4" /> Saved Quotation
                                </Label>
                                <div className="bg-zinc-900/70 border border-zinc-700 rounded-lg p-5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                                <FileText className="w-6 h-6 text-blue-400" />
                                            </div>
                                            <div>
                                                <p className="text-base text-white font-medium">{quotationInfo.fileName}</p>
                                                <p className="text-sm text-zinc-500">
                                                    Saved {new Date(quotationInfo.uploadedAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <a
                                                href={quotationInfo.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                                                title="View"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </a>
                                            <a
                                                href={quotationInfo.url}
                                                download={quotationInfo.fileName}
                                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                                                title="Download"
                                            >
                                                <Download className="w-4 h-4" />
                                            </a>
                                            <button
                                                onClick={handleQuotationDelete}
                                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-800 hover:bg-red-900/50 text-zinc-400 hover:text-red-400 transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Meta Info */}
                        <div className="pt-5 border-t border-[#2a2a2a] flex gap-8 text-sm text-[#CDB49E]">
                            <div>
                                <span className="uppercase tracking-wide font-medium">Created</span>
                                <span className="ml-2 text-[#F5F1EC]">{new Date(contact.created_at).toLocaleDateString()}</span>
                            </div>
                            <div>
                                <span className="uppercase tracking-wide font-medium">By</span>
                                <span className="ml-2 text-[#F5F1EC]">{contact.created_by_user?.full_name || '-'}</span>
                            </div>
                            <div>
                                <span className="uppercase tracking-wide font-medium">Updated</span>
                                <span className="ml-2 text-[#F5F1EC]">{contact.updated_by_user?.full_name || '-'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Right - Activity */}
                    <div className="lg:col-span-1 bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] shadow-lg p-5">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-sm uppercase tracking-wide text-[#CDB49E] font-semibold">Activity</h2>
                            <Button
                                size="sm"
                                onClick={() => setShowActivityForm(!showActivityForm)}
                                className={cn(
                                    "h-9 text-sm",
                                    showActivityForm
                                        ? "bg-[#2a2a2a] text-[#CDB49E]"
                                        : "bg-[#AD7D56] hover:bg-[#9A6B47] text-white"
                                )}
                            >
                                <Plus className="w-4 h-4 mr-1" />
                                Log Activity
                            </Button>
                        </div>

                        {/* Add Activity Form */}
                        {showActivityForm && (
                            <div className="mb-5 space-y-4 pb-5 border-b border-[#3a3a3a]">
                                <div className="flex flex-wrap gap-2">
                                    {ACTIVITY_TYPES.map((t) => (
                                        <button
                                            key={t.value}
                                            onClick={() => setNewActivity({ ...newActivity, activityType: t.value })}
                                            className={cn(
                                                "px-3 py-1.5 rounded text-sm font-medium transition-colors",
                                                newActivity.activityType === t.value
                                                    ? 'bg-[#AD7D56] text-white'
                                                    : 'bg-[#2a2a2a] text-[#CDB49E] hover:bg-[#3a3a3a]'
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
                                    className="bg-[#2a2a2a] border-[#3a3a3a] text-[#F5F1EC] placeholder:text-[#666] text-base h-11 focus:border-[#AD7D56]"
                                />
                                <Textarea
                                    value={newActivity.description}
                                    onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                                    placeholder="Details (optional)..."
                                    rows={2}
                                    className="bg-[#2a2a2a] border-[#3a3a3a] text-[#F5F1EC] placeholder:text-[#666] text-base resize-none focus:border-[#AD7D56]"
                                />
                                <Button onClick={handleAddActivity} className="w-full bg-[#AD7D56] text-white hover:bg-[#9A6B47] text-base h-10">
                                    Add Activity
                                </Button>
                            </div>
                        )}

                        {/* Timeline */}
                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                            {activities.length === 0 ? (
                                <p className="text-[#555] text-sm text-center py-6">No activity yet</p>
                            ) : (
                                activities.map((activity, index) => {
                                    const Icon = ACTIVITY_ICONS[activity.activity_type] || MessageSquare;
                                    return (
                                        <div key={activity.id} className="flex gap-3 group">
                                            <div className="relative flex flex-col items-center">
                                                <div className="w-7 h-7 rounded-full bg-[#2a2a2a] flex items-center justify-center flex-shrink-0 group-hover:bg-[#AD7D56]/30 transition-colors">
                                                    <Icon className="w-3.5 h-3.5 text-[#CDB49E]" />
                                                </div>
                                                {index < activities.length - 1 && (
                                                    <div className="w-px flex-1 bg-[#3a3a3a] mt-1" />
                                                )}
                                            </div>
                                            <div className="flex-1 pb-4">
                                                <p className="text-sm text-[#F5F1EC] font-medium">
                                                    {activity.title || activity.activity_type?.replace('_', ' ')}
                                                </p>
                                                {activity.description && (
                                                    <p className="text-sm text-[#CDB49E] mt-1 leading-relaxed">{activity.description}</p>
                                                )}
                                                <p className="text-sm text-[#555] mt-1">
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
                onQuotationSaved={() => {
                    fetchQuotationInfo();
                    fetchActivities();
                }}
            />
        </div>
    );
}
