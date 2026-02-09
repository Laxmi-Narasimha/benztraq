/**
 * Contact Detail Page - Premium Clean Theme
 * 
 * Color Palette (Light & Readable):
 * - Background: Ivory #F5F1EC
 * - Text: Charcoal #111111 
 * - Accent: French Beige #AD7D56
 * - Secondary: Rodeo Dust #CDB49E
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
        <div className="min-h-screen bg-[#F5F1EC]">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-[#ddd]">
                <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/ergopack/contacts">
                            <button className="text-[#666] hover:text-[#111] transition-colors">
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                        </Link>
                        <div>
                            <h1 className="text-lg font-bold text-[#111]">{contact.company_name}</h1>
                            <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-xs capitalize mt-0.5">
                                {contact.status?.replace('_', ' ')}
                            </Badge>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowQuotationModal(true)}
                            className="border-[#AD7D56] text-[#AD7D56] hover:bg-[#AD7D56]/10 h-8"
                        >
                            <FileText className="w-3.5 h-3.5 mr-1" />
                            Create Quote
                        </Button>
                        {canDelete && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleDelete}
                                className="text-[#ccc] hover:text-red-600 hover:bg-red-50 h-8 w-8"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        )}
                        <Button
                            size="sm"
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-[#AD7D56] text-white hover:bg-[#96704d] h-8"
                        >
                            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1" />}
                            Save
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-5xl mx-auto px-4 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left - Fields */}
                    <div className="lg:col-span-2 bg-white rounded-lg border border-[#ddd] p-6 shadow-sm space-y-5">
                        {/* Row 1: Company + Contact */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[#666] text-xs font-medium uppercase tracking-wide flex items-center gap-1.5">
                                    <Building2 className="w-3.5 h-3.5" /> Company
                                </Label>
                                <Input
                                    value={contact.company_name || ''}
                                    onChange={(e) => handleChange('company_name', e.target.value)}
                                    className="bg-white border-[#ddd] text-[#111] h-10 focus:border-[#AD7D56] focus:ring-1 focus:ring-[#AD7D56]/20"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[#666] text-xs font-medium uppercase tracking-wide flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5" /> Contact Person
                                </Label>
                                <Input
                                    value={contact.contact_person || ''}
                                    onChange={(e) => handleChange('contact_person', e.target.value)}
                                    placeholder="-"
                                    className="bg-white border-[#ddd] text-[#111] placeholder:text-[#bbb] h-10 focus:border-[#AD7D56] focus:ring-1 focus:ring-[#AD7D56]/20"
                                />
                            </div>
                        </div>

                        {/* Row 2: Email + Phone */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[#666] text-xs font-medium uppercase tracking-wide flex items-center gap-1.5">
                                    <Mail className="w-3.5 h-3.5" /> Email
                                </Label>
                                <Input
                                    value={contact.email || ''}
                                    onChange={(e) => handleChange('email', e.target.value)}
                                    placeholder="-"
                                    className="bg-white border-[#ddd] text-[#111] placeholder:text-[#bbb] h-10 focus:border-[#AD7D56] focus:ring-1 focus:ring-[#AD7D56]/20"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[#666] text-xs font-medium uppercase tracking-wide flex items-center gap-1.5">
                                    <Phone className="w-3.5 h-3.5" /> Phone
                                </Label>
                                <Input
                                    value={contact.phone || ''}
                                    onChange={(e) => handleChange('phone', e.target.value)}
                                    placeholder="-"
                                    className="bg-white border-[#ddd] text-[#111] placeholder:text-[#bbb] h-10 focus:border-[#AD7D56] focus:ring-1 focus:ring-[#AD7D56]/20"
                                />
                            </div>
                        </div>

                        {/* Row 3: City + State */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[#666] text-xs font-medium uppercase tracking-wide flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5" /> City
                                </Label>
                                <Input
                                    value={contact.city || ''}
                                    onChange={(e) => handleChange('city', e.target.value)}
                                    placeholder="-"
                                    className="bg-white border-[#ddd] text-[#111] placeholder:text-[#bbb] h-10 focus:border-[#AD7D56] focus:ring-1 focus:ring-[#AD7D56]/20"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[#666] text-xs font-medium uppercase tracking-wide">State</Label>
                                <Input
                                    value={contact.state || ''}
                                    onChange={(e) => handleChange('state', e.target.value)}
                                    placeholder="-"
                                    className="bg-white border-[#ddd] text-[#111] placeholder:text-[#bbb] h-10 focus:border-[#AD7D56] focus:ring-1 focus:ring-[#AD7D56]/20"
                                />
                            </div>
                        </div>

                        {/* Row 4: Industry + Status */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[#666] text-xs font-medium uppercase tracking-wide flex items-center gap-1.5">
                                    <Briefcase className="w-3.5 h-3.5" /> Industry
                                </Label>
                                <Input
                                    value={contact.industry || ''}
                                    onChange={(e) => handleChange('industry', e.target.value)}
                                    placeholder="-"
                                    className="bg-white border-[#ddd] text-[#111] placeholder:text-[#bbb] h-10 focus:border-[#AD7D56] focus:ring-1 focus:ring-[#AD7D56]/20"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[#666] text-xs font-medium uppercase tracking-wide">Status</Label>
                                <Select value={contact.status || 'open'} onValueChange={(v) => handleChange('status', v)}>
                                    <SelectTrigger className="bg-white border-[#ddd] text-[#111] h-10">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border-[#ddd]">
                                        {STATUS_OPTIONS.map((opt) => (
                                            <SelectItem key={opt.value} value={opt.value} className="text-[#111] focus:bg-[#F5F1EC]">
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Row 5: Suggested Model + Product Interest */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[#666] text-xs font-medium uppercase tracking-wide flex items-center gap-1.5">
                                    <Package className="w-3.5 h-3.5" /> Suggested Models
                                </Label>
                                <div className="flex flex-wrap gap-2 p-3 bg-[#f9f7f4] border border-[#ddd] rounded-md min-h-[40px]">
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
                                                className={`px-2.5 py-1 text-xs font-medium rounded border transition-colors ${isSelected
                                                    ? 'bg-[#AD7D56] border-[#AD7D56] text-white'
                                                    : 'bg-white border-[#ddd] text-[#666] hover:border-[#AD7D56]'
                                                    }`}
                                            >
                                                {opt.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[#666] text-xs font-medium uppercase tracking-wide">Product Interest</Label>
                                <Input
                                    value={contact.product_interest || ''}
                                    onChange={(e) => handleChange('product_interest', e.target.value)}
                                    placeholder="-"
                                    className="bg-white border-[#ddd] text-[#111] placeholder:text-[#bbb] h-10 focus:border-[#AD7D56] focus:ring-1 focus:ring-[#AD7D56]/20"
                                />
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="space-y-1.5">
                            <Label className="text-[#666] text-xs font-medium uppercase tracking-wide">Notes</Label>
                            <Textarea
                                value={contact.notes || ''}
                                onChange={(e) => handleChange('notes', e.target.value)}
                                placeholder="Add notes..."
                                rows={3}
                                className="bg-white border-[#ddd] text-[#111] placeholder:text-[#bbb] resize-none focus:border-[#AD7D56] focus:ring-1 focus:ring-[#AD7D56]/20"
                            />
                        </div>

                        {/* Company Presentation */}
                        <div className="space-y-2 pt-4 mt-4 border-t border-[#eee]">
                            <Label className="text-[#666] text-xs font-medium uppercase tracking-wide flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5" /> Company Presentation
                            </Label>

                            {presentationInfo?.hasPresentation ? (
                                <div className="bg-[#f9f7f4] border border-[#ddd] rounded-lg p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                                                <FileText className="w-5 h-5 text-red-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-[#111] font-medium">{presentationInfo.fileName}</p>
                                                <p className="text-xs text-[#666]">
                                                    Uploaded {new Date(presentationInfo.uploadedAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <a
                                                href={presentationInfo.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center justify-center w-8 h-8 rounded bg-white border border-[#ddd] hover:bg-gray-50 text-[#666] transition-colors"
                                                title="View"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </a>
                                            <a
                                                href={presentationInfo.url}
                                                download={presentationInfo.fileName}
                                                className="inline-flex items-center justify-center w-8 h-8 rounded bg-white border border-[#ddd] hover:bg-gray-50 text-[#666] transition-colors"
                                                title="Download"
                                            >
                                                <Download className="w-4 h-4" />
                                            </a>
                                            <button
                                                onClick={handlePresentationDelete}
                                                className="inline-flex items-center justify-center w-8 h-8 rounded bg-white border border-[#ddd] hover:bg-red-50 text-[#ccc] hover:text-red-600 transition-colors"
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
                                        "border-2 border-dashed rounded-lg p-5 text-center transition-colors cursor-pointer",
                                        isDragging
                                            ? "border-[#AD7D56] bg-[#AD7D56]/10"
                                            : "border-[#ddd] hover:border-[#AD7D56] bg-[#f9f7f4]"
                                    )}
                                >
                                    {isUploadingPresentation ? (
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader2 className="w-6 h-6 animate-spin text-[#AD7D56]" />
                                            <p className="text-sm text-[#666]">Uploading...</p>
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
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="w-10 h-10 rounded-lg bg-white border border-[#ddd] flex items-center justify-center">
                                                        <Upload className="w-5 h-5 text-[#666]" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-[#333]">Drop PDF here or click to upload</p>
                                                        <p className="text-xs text-[#999] mt-0.5">Max file size: 10MB</p>
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
                            <div className="space-y-2 pt-4 mt-4 border-t border-[#eee]">
                                <Label className="text-[#666] text-xs font-medium uppercase tracking-wide flex items-center gap-1.5">
                                    <FileText className="w-3.5 h-3.5" /> Saved Quotation
                                </Label>
                                <div className="bg-[#f9f7f4] border border-[#ddd] rounded-lg p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                                                <FileText className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-[#111] font-medium">{quotationInfo.fileName}</p>
                                                <p className="text-xs text-[#666]">
                                                    Saved {new Date(quotationInfo.uploadedAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <a
                                                href={quotationInfo.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center justify-center w-8 h-8 rounded bg-white border border-[#ddd] hover:bg-gray-50 text-[#666] transition-colors"
                                                title="View"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </a>
                                            <a
                                                href={quotationInfo.url}
                                                download={quotationInfo.fileName}
                                                className="inline-flex items-center justify-center w-8 h-8 rounded bg-white border border-[#ddd] hover:bg-gray-50 text-[#666] transition-colors"
                                                title="Download"
                                            >
                                                <Download className="w-4 h-4" />
                                            </a>
                                            <button
                                                onClick={handleQuotationDelete}
                                                className="inline-flex items-center justify-center w-8 h-8 rounded bg-white border border-[#ddd] hover:bg-red-50 text-[#ccc] hover:text-red-600 transition-colors"
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
                        <div className="pt-4 border-t border-[#eee] flex gap-6 text-xs text-[#666]">
                            <div>
                                <span className="uppercase tracking-wide font-medium">Created</span>
                                <span className="ml-1.5 text-[#111]">{new Date(contact.created_at).toLocaleDateString()}</span>
                            </div>
                            <div>
                                <span className="uppercase tracking-wide font-medium">By</span>
                                <span className="ml-1.5 text-[#111]">{contact.created_by_user?.full_name || '-'}</span>
                            </div>
                            <div>
                                <span className="uppercase tracking-wide font-medium">Updated</span>
                                <span className="ml-1.5 text-[#111]">{contact.updated_by_user?.full_name || '-'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Right - Activity */}
                    <div className="lg:col-span-1 bg-white rounded-lg border border-[#ddd] shadow-sm p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xs uppercase tracking-wide text-[#666] font-semibold">Activity</h2>
                            <Button
                                size="sm"
                                onClick={() => setShowActivityForm(!showActivityForm)}
                                className={cn(
                                    "h-8 text-xs",
                                    showActivityForm
                                        ? "bg-gray-100 text-[#666] border border-[#ddd]"
                                        : "bg-[#AD7D56] hover:bg-[#96704d] text-white"
                                )}
                            >
                                <Plus className="w-3.5 h-3.5 mr-1" />
                                Log Activity
                            </Button>
                        </div>

                        {/* Add Activity Form */}
                        {showActivityForm && (
                            <div className="mb-4 space-y-3 pb-4 border-b border-[#eee]">
                                <div className="flex flex-wrap gap-1.5">
                                    {ACTIVITY_TYPES.map((t) => (
                                        <button
                                            key={t.value}
                                            onClick={() => setNewActivity({ ...newActivity, activityType: t.value })}
                                            className={cn(
                                                "px-2.5 py-1 rounded text-xs font-medium transition-colors",
                                                newActivity.activityType === t.value
                                                    ? 'bg-[#AD7D56] text-white'
                                                    : 'bg-gray-100 text-[#666] hover:bg-gray-200'
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
                                    className="bg-white border-[#ddd] text-[#111] placeholder:text-[#bbb] h-9 text-sm focus:border-[#AD7D56]"
                                />
                                <Textarea
                                    value={newActivity.description}
                                    onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                                    placeholder="Details (optional)..."
                                    rows={2}
                                    className="bg-white border-[#ddd] text-[#111] placeholder:text-[#bbb] text-sm resize-none focus:border-[#AD7D56]"
                                />
                                <Button onClick={handleAddActivity} className="w-full bg-[#AD7D56] text-white hover:bg-[#96704d] text-sm h-8">
                                    Add Activity
                                </Button>
                            </div>
                        )}

                        {/* Timeline */}
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                            {activities.length === 0 ? (
                                <p className="text-[#999] text-xs text-center py-4">No activity yet</p>
                            ) : (
                                activities.map((activity, index) => {
                                    const Icon = ACTIVITY_ICONS[activity.activity_type] || MessageSquare;
                                    return (
                                        <div key={activity.id} className="flex gap-2.5 group">
                                            <div className="relative flex flex-col items-center">
                                                <div className="w-6 h-6 rounded-full bg-[#f9f7f4] border border-[#eee] flex items-center justify-center flex-shrink-0 group-hover:bg-[#AD7D56]/10 transition-colors">
                                                    <Icon className="w-3 h-3 text-[#AD7D56]" />
                                                </div>
                                                {index < activities.length - 1 && (
                                                    <div className="w-px flex-1 bg-[#eee] mt-1" />
                                                )}
                                            </div>
                                            <div className="flex-1 pb-3">
                                                <p className="text-sm text-[#111] font-medium">
                                                    {activity.title || activity.activity_type?.replace('_', ' ')}
                                                </p>
                                                {activity.description && (
                                                    <p className="text-xs text-[#666] mt-0.5 leading-relaxed">{activity.description}</p>
                                                )}
                                                <p className="text-xs text-[#999] mt-0.5">
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
