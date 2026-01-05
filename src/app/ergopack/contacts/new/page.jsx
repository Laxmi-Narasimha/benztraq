/**
 * New Contact Page - Premium Dark Theme
 * 
 * High-end dark theme form for adding leads.
 * Fields: Company, Contact Person, Phone, Email, City, Designation, 
 * Product Interest, Additional Notes, Suggested Model, Status
 * All fields optional except Company Name.
 * 
 * @module app/ergopack/contacts/new/page
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building2, Save, ArrowLeft, AlertCircle, Loader2, User, Phone, Mail, MapPin, Briefcase, Package, FileText } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// Stages matching dashboard
const STATUS_OPTIONS = [
    { value: 'open', label: 'Open' },
    { value: 'contacted', label: 'Contacted' },
    { value: 'proposal_sent', label: 'Proposal Sent' },
    { value: 'deal_done', label: 'Deal Done' },
    { value: 'lost', label: 'Lost' },
    { value: 'not_serviceable', label: 'Not Serviceable' },
];

// Suggested Models dropdown
const MODEL_OPTIONS = [
    { value: '', label: 'Select Model (Optional)' },
    { value: 'Ergopack 726X-li', label: 'Ergopack 726X-li' },
    { value: 'Ergopack GO', label: 'Ergopack GO' },
    { value: 'Ergopack 700', label: 'Ergopack 700' },
    { value: 'Other', label: 'Other' },
];

export default function NewContactPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        companyName: '',
        contactPerson: '',
        phone: '',
        email: '',
        city: '',
        designation: '',
        productInterest: '',
        additionalNotes: '',
        suggestedModel: '',
        status: 'open',
    });

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            const response = await fetch('/api/ergopack/contacts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (data.success) {
                router.push('/ergopack/contacts');
            } else {
                setError(data.error || 'Failed to create contact');
            }
        } catch (err) {
            setError('An error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] font-sans text-zinc-300">
            <div className="p-6 md:p-8 max-w-3xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/ergopack/contacts">
                        <Button variant="ghost" className="text-zinc-500 hover:text-white hover:bg-zinc-900 rounded-full w-10 h-10 p-0 transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-light tracking-wide text-white flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center border border-zinc-800 shadow-lg">
                                <Building2 className="w-5 h-5 text-white" />
                            </div>
                            Add New Lead
                        </h1>
                        <p className="text-zinc-500 mt-1 ml-[52px] text-sm font-light">Create a new contact in your pipeline</p>
                    </div>
                </div>

                {error && (
                    <Alert className="mb-6 border-red-500/20 bg-red-500/5 backdrop-blur-sm">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                        <AlertDescription className="text-red-400">{error}</AlertDescription>
                    </Alert>
                )}

                <form onSubmit={handleSubmit}>
                    <Card className="bg-zinc-900/20 border-zinc-800/60 shadow-2xl backdrop-blur-sm">
                        <CardHeader className="pb-4 border-b border-zinc-900 px-6 pt-6">
                            <CardTitle className="text-lg text-white font-light tracking-wide">Lead Information</CardTitle>
                            <CardDescription className="text-zinc-600">
                                All fields are optional except Company Name
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            {/* Row 1: Company Name */}
                            <div className="space-y-2">
                                <Label className="text-zinc-500 text-xs uppercase tracking-widest font-semibold flex items-center gap-2">
                                    <Building2 className="w-3.5 h-3.5" />
                                    Company Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    value={formData.companyName}
                                    onChange={(e) => handleChange('companyName', e.target.value)}
                                    placeholder="e.g. ABC Packaging Pvt Ltd"
                                    required
                                    className="h-12 bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-700 focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition-all text-base"
                                />
                            </div>

                            {/* Row 2: Contact Person + Phone */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-zinc-500 text-xs uppercase tracking-widest font-semibold flex items-center gap-2">
                                        <User className="w-3.5 h-3.5" />
                                        Contact Person
                                    </Label>
                                    <Input
                                        value={formData.contactPerson}
                                        onChange={(e) => handleChange('contactPerson', e.target.value)}
                                        placeholder="Full name"
                                        className="h-11 bg-zinc-900/50 border-zinc-800 text-zinc-300 placeholder:text-zinc-700 focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-zinc-500 text-xs uppercase tracking-widest font-semibold flex items-center gap-2">
                                        <Phone className="w-3.5 h-3.5" />
                                        Phone
                                    </Label>
                                    <Input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => handleChange('phone', e.target.value)}
                                        placeholder="+91 98765 43210"
                                        className="h-11 bg-zinc-900/50 border-zinc-800 text-zinc-300 placeholder:text-zinc-700 focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Row 3: Email + City */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-zinc-500 text-xs uppercase tracking-widest font-semibold flex items-center gap-2">
                                        <Mail className="w-3.5 h-3.5" />
                                        Email
                                    </Label>
                                    <Input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => handleChange('email', e.target.value)}
                                        placeholder="contact@company.com"
                                        className="h-11 bg-zinc-900/50 border-zinc-800 text-zinc-300 placeholder:text-zinc-700 focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-zinc-500 text-xs uppercase tracking-widest font-semibold flex items-center gap-2">
                                        <MapPin className="w-3.5 h-3.5" />
                                        City
                                    </Label>
                                    <Input
                                        value={formData.city}
                                        onChange={(e) => handleChange('city', e.target.value)}
                                        placeholder="e.g. Mumbai"
                                        className="h-11 bg-zinc-900/50 border-zinc-800 text-zinc-300 placeholder:text-zinc-700 focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Row 4: Designation + Suggested Model */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-zinc-500 text-xs uppercase tracking-widest font-semibold flex items-center gap-2">
                                        <Briefcase className="w-3.5 h-3.5" />
                                        Designation
                                    </Label>
                                    <Input
                                        value={formData.designation}
                                        onChange={(e) => handleChange('designation', e.target.value)}
                                        placeholder="e.g. Purchase Manager"
                                        className="h-11 bg-zinc-900/50 border-zinc-800 text-zinc-300 placeholder:text-zinc-700 focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-zinc-500 text-xs uppercase tracking-widest font-semibold flex items-center gap-2">
                                        <Package className="w-3.5 h-3.5" />
                                        Suggested Model
                                    </Label>
                                    <Select value={formData.suggestedModel} onValueChange={(v) => handleChange('suggestedModel', v)}>
                                        <SelectTrigger className="h-11 bg-zinc-900/50 border-zinc-800 text-zinc-300 focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition-all">
                                            <SelectValue placeholder="Select Model" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-900 border-zinc-800">
                                            {MODEL_OPTIONS.slice(1).map((opt) => (
                                                <SelectItem
                                                    key={opt.value}
                                                    value={opt.value}
                                                    className="text-zinc-300 focus:bg-zinc-800 focus:text-white"
                                                >
                                                    {opt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Row 5: Product Interest */}
                            <div className="space-y-2">
                                <Label className="text-zinc-500 text-xs uppercase tracking-widest font-semibold flex items-center gap-2">
                                    <FileText className="w-3.5 h-3.5" />
                                    Product Interest / Requirement
                                </Label>
                                <Input
                                    value={formData.productInterest}
                                    onChange={(e) => handleChange('productInterest', e.target.value)}
                                    placeholder="Brief details on requirement"
                                    className="h-11 bg-zinc-900/50 border-zinc-800 text-zinc-300 placeholder:text-zinc-700 focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition-all"
                                />
                            </div>

                            {/* Row 6: Additional Notes */}
                            <div className="space-y-2">
                                <Label className="text-zinc-500 text-xs uppercase tracking-widest font-semibold">
                                    Additional Notes
                                </Label>
                                <Textarea
                                    value={formData.additionalNotes}
                                    onChange={(e) => handleChange('additionalNotes', e.target.value)}
                                    placeholder="Any additional details, links, or context..."
                                    rows={3}
                                    className="bg-zinc-900/50 border-zinc-800 text-zinc-300 placeholder:text-zinc-700 focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition-all resize-none"
                                />
                            </div>

                            {/* Row 7: Status */}
                            <div className="space-y-2">
                                <Label className="text-zinc-500 text-xs uppercase tracking-widest font-semibold">Stage</Label>
                                <Select value={formData.status} onValueChange={(v) => handleChange('status', v)}>
                                    <SelectTrigger className="h-11 bg-zinc-900/50 border-zinc-800 text-zinc-300 focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition-all">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-900 border-zinc-800">
                                        {STATUS_OPTIONS.map((opt) => (
                                            <SelectItem
                                                key={opt.value}
                                                value={opt.value}
                                                className="text-zinc-300 focus:bg-zinc-800 focus:text-white"
                                            >
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Submit Buttons */}
                            <div className="flex gap-4 pt-6 border-t border-zinc-900">
                                <Link href="/ergopack/contacts" className="flex-1">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full h-11 border-zinc-800 bg-transparent text-zinc-500 hover:bg-zinc-900 hover:text-white hover:border-zinc-700 transition-all"
                                    >
                                        Cancel
                                    </Button>
                                </Link>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting || !formData.companyName.trim()}
                                    className="flex-1 h-11 bg-white text-black hover:bg-zinc-200 font-medium tracking-wide disabled:opacity-40 transition-all shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)]"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4 mr-2" />
                                            Save Lead
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </div>
        </div>
    );
}
