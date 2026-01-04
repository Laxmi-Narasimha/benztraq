/**
 * New Contact Page - Premium Light Theme
 * 
 * Clean, modern form with light theme and premium aesthetics.
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

// Stages matching dashboard (from Image 4)
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
        <div className="min-h-screen bg-slate-50">
            <div className="p-6 md:p-8 max-w-2xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/ergopack/contacts">
                        <Button variant="ghost" className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full w-10 h-10 p-0">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-white" />
                            </div>
                            Add New Lead
                        </h1>
                        <p className="text-slate-500 mt-1 ml-[52px] text-sm">Enter lead details below</p>
                    </div>
                </div>

                {error && (
                    <Alert className="mb-6 border-red-200 bg-red-50">
                        <AlertCircle className="w-4 h-4 text-red-600" />
                        <AlertDescription className="text-red-800">{error}</AlertDescription>
                    </Alert>
                )}

                <form onSubmit={handleSubmit}>
                    <Card className="bg-white border-slate-200 shadow-sm">
                        <CardHeader className="pb-4 border-b border-slate-100">
                            <CardTitle className="text-lg text-slate-900 font-medium">Lead Information</CardTitle>
                            <CardDescription className="text-slate-500">
                                All fields are optional except Company Name
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            {/* Row 1: Company Name */}
                            <div className="space-y-2">
                                <Label className="text-slate-700 text-sm font-medium flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-slate-400" />
                                    Company Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    value={formData.companyName}
                                    onChange={(e) => handleChange('companyName', e.target.value)}
                                    placeholder="e.g. ABC Packaging Pvt Ltd"
                                    required
                                    className="h-11 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:ring-slate-400"
                                />
                            </div>

                            {/* Row 2: Contact Person + Phone */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-slate-700 text-sm font-medium flex items-center gap-2">
                                        <User className="w-4 h-4 text-slate-400" />
                                        Contact Person
                                    </Label>
                                    <Input
                                        value={formData.contactPerson}
                                        onChange={(e) => handleChange('contactPerson', e.target.value)}
                                        placeholder="Full name of contact"
                                        className="h-11 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-slate-400"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-700 text-sm font-medium flex items-center gap-2">
                                        <Phone className="w-4 h-4 text-slate-400" />
                                        Phone
                                    </Label>
                                    <Input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => handleChange('phone', e.target.value)}
                                        placeholder="+91 98765 43210"
                                        className="h-11 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-slate-400"
                                    />
                                </div>
                            </div>

                            {/* Row 3: Email + City */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-slate-700 text-sm font-medium flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-slate-400" />
                                        Email
                                    </Label>
                                    <Input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => handleChange('email', e.target.value)}
                                        placeholder="contact@company.com"
                                        className="h-11 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-slate-400"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-700 text-sm font-medium flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-slate-400" />
                                        City
                                    </Label>
                                    <Input
                                        value={formData.city}
                                        onChange={(e) => handleChange('city', e.target.value)}
                                        placeholder="e.g. Mumbai, Delhi"
                                        className="h-11 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-slate-400"
                                    />
                                </div>
                            </div>

                            {/* Row 4: Designation + Suggested Model */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-slate-700 text-sm font-medium flex items-center gap-2">
                                        <Briefcase className="w-4 h-4 text-slate-400" />
                                        Designation
                                    </Label>
                                    <Input
                                        value={formData.designation}
                                        onChange={(e) => handleChange('designation', e.target.value)}
                                        placeholder="e.g. Purchase Manager"
                                        className="h-11 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-slate-400"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-700 text-sm font-medium flex items-center gap-2">
                                        <Package className="w-4 h-4 text-slate-400" />
                                        Suggested Model
                                    </Label>
                                    <Select value={formData.suggestedModel} onValueChange={(v) => handleChange('suggestedModel', v)}>
                                        <SelectTrigger className="h-11 bg-white border-slate-200 text-slate-900 focus:border-slate-400">
                                            <SelectValue placeholder="Select Model" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white border-slate-200">
                                            {MODEL_OPTIONS.slice(1).map((opt) => (
                                                <SelectItem
                                                    key={opt.value}
                                                    value={opt.value}
                                                    className="text-slate-900 focus:bg-slate-100"
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
                                <Label className="text-slate-700 text-sm font-medium flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-slate-400" />
                                    Product Interest / Requirement
                                </Label>
                                <Input
                                    value={formData.productInterest}
                                    onChange={(e) => handleChange('productInterest', e.target.value)}
                                    placeholder="Brief 4-5 words on what they're looking for"
                                    className="h-11 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-slate-400"
                                />
                            </div>

                            {/* Row 6: Additional Notes */}
                            <div className="space-y-2">
                                <Label className="text-slate-700 text-sm font-medium">
                                    Additional Notes
                                </Label>
                                <Textarea
                                    value={formData.additionalNotes}
                                    onChange={(e) => handleChange('additionalNotes', e.target.value)}
                                    placeholder="Any additional details, links, or context..."
                                    rows={3}
                                    className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-slate-400 resize-none"
                                />
                            </div>

                            {/* Row 7: Status */}
                            <div className="space-y-2">
                                <Label className="text-slate-700 text-sm font-medium">Stage</Label>
                                <Select value={formData.status} onValueChange={(v) => handleChange('status', v)}>
                                    <SelectTrigger className="h-11 bg-white border-slate-200 text-slate-900 focus:border-slate-400">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border-slate-200">
                                        {STATUS_OPTIONS.map((opt) => (
                                            <SelectItem
                                                key={opt.value}
                                                value={opt.value}
                                                className="text-slate-900 focus:bg-slate-100"
                                            >
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Submit Buttons */}
                            <div className="flex gap-3 pt-4 border-t border-slate-100">
                                <Link href="/ergopack/contacts" className="flex-1">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full h-11 border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                    >
                                        Cancel
                                    </Button>
                                </Link>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting || !formData.companyName.trim()}
                                    className="flex-1 h-11 bg-slate-900 text-white hover:bg-slate-800 font-medium disabled:opacity-40"
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
