/**
 * New Contact Page
 * 
 * Form to create a new Ergopack contact.
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
import { Building2, Save, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

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

const SOURCE_OPTIONS = [
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'indiamart', label: 'IndiaMart' },
    { value: 'exhibition', label: 'Exhibition' },
    { value: 'referral', label: 'Referral' },
    { value: 'cold_call', label: 'Cold Call' },
    { value: 'website', label: 'Website' },
    { value: 'other', label: 'Other' },
];

const PRIORITY_OPTIONS = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' },
];

export default function NewContactPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        companyName: '',
        contactPerson: '',
        email: '',
        phone: '',
        website: '',
        city: '',
        state: '',
        industry: '',
        companySize: '',
        source: '',
        notes: '',
        priority: 'medium',
        status: 'new',
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
                router.push(`/ergopack/contacts/${data.contact.id}`);
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
        <div className="p-8 max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/ergopack/contacts">
                    <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-slate-700">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Building2 className="w-7 h-7 text-emerald-400" />
                        Add New Contact
                    </h1>
                    <p className="text-slate-400 mt-1">Add a new company to track</p>
                </div>
            </div>

            {error && (
                <Alert className="mb-6 border-red-500 bg-red-500/10">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <AlertDescription className="text-red-400">{error}</AlertDescription>
                </Alert>
            )}

            <form onSubmit={handleSubmit}>
                <Card className="bg-slate-800 border-slate-700">
                    <CardHeader>
                        <CardTitle className="text-white">Company Information</CardTitle>
                        <CardDescription className="text-slate-400">
                            Basic details about the company
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Company Name */}
                        <div className="space-y-2">
                            <Label className="text-slate-300">Company Name *</Label>
                            <Input
                                value={formData.companyName}
                                onChange={(e) => handleChange('companyName', e.target.value)}
                                placeholder="ABC Packaging Pvt Ltd"
                                required
                                className="bg-slate-700 border-slate-600 text-white"
                            />
                        </div>

                        {/* Contact Person + Email */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-slate-300">Contact Person</Label>
                                <Input
                                    value={formData.contactPerson}
                                    onChange={(e) => handleChange('contactPerson', e.target.value)}
                                    placeholder="John Doe"
                                    className="bg-slate-700 border-slate-600 text-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-300">Email</Label>
                                <Input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => handleChange('email', e.target.value)}
                                    placeholder="john@company.com"
                                    className="bg-slate-700 border-slate-600 text-white"
                                />
                            </div>
                        </div>

                        {/* Phone + Website */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-slate-300">Phone</Label>
                                <Input
                                    value={formData.phone}
                                    onChange={(e) => handleChange('phone', e.target.value)}
                                    placeholder="+91 9876543210"
                                    className="bg-slate-700 border-slate-600 text-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-300">Website</Label>
                                <Input
                                    value={formData.website}
                                    onChange={(e) => handleChange('website', e.target.value)}
                                    placeholder="https://company.com"
                                    className="bg-slate-700 border-slate-600 text-white"
                                />
                            </div>
                        </div>

                        {/* City + State */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-slate-300">City</Label>
                                <Input
                                    value={formData.city}
                                    onChange={(e) => handleChange('city', e.target.value)}
                                    placeholder="Mumbai"
                                    className="bg-slate-700 border-slate-600 text-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-300">State</Label>
                                <Input
                                    value={formData.state}
                                    onChange={(e) => handleChange('state', e.target.value)}
                                    placeholder="Maharashtra"
                                    className="bg-slate-700 border-slate-600 text-white"
                                />
                            </div>
                        </div>

                        {/* Industry */}
                        <div className="space-y-2">
                            <Label className="text-slate-300">Industry</Label>
                            <Input
                                value={formData.industry}
                                onChange={(e) => handleChange('industry', e.target.value)}
                                placeholder="Manufacturing, FMCG, Pharma..."
                                className="bg-slate-700 border-slate-600 text-white"
                            />
                        </div>

                        {/* Source + Priority + Status */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label className="text-slate-300">Source</Label>
                                <Select value={formData.source} onValueChange={(v) => handleChange('source', v)}>
                                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                                        <SelectValue placeholder="Select source" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-700 border-slate-600">
                                        {SOURCE_OPTIONS.map((opt) => (
                                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-300">Priority</Label>
                                <Select value={formData.priority} onValueChange={(v) => handleChange('priority', v)}>
                                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-700 border-slate-600">
                                        {PRIORITY_OPTIONS.map((opt) => (
                                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-300">Status</Label>
                                <Select value={formData.status} onValueChange={(v) => handleChange('status', v)}>
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

                        {/* Notes */}
                        <div className="space-y-2">
                            <Label className="text-slate-300">Notes</Label>
                            <Textarea
                                value={formData.notes}
                                onChange={(e) => handleChange('notes', e.target.value)}
                                placeholder="Additional notes about this contact..."
                                rows={4}
                                className="bg-slate-700 border-slate-600 text-white"
                            />
                        </div>

                        {/* Submit */}
                        <div className="flex justify-end gap-3 pt-4">
                            <Link href="/ergopack/contacts">
                                <Button type="button" variant="outline" className="border-slate-600 text-slate-300">
                                    Cancel
                                </Button>
                            </Link>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-emerald-600 hover:bg-emerald-700"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Save Contact
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}
