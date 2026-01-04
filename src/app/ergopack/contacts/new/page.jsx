/**
 * New Contact Page - Simplified Lead Entry
 * 
 * Clean, minimal form with black & white theme.
 * Only essential fields: Company, Contact Person, Email, Status
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building2, Save, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

const STATUS_OPTIONS = [
    { value: 'new', label: 'New Lead' },
    { value: 'contacted', label: 'Contacted' },
    { value: 'interested', label: 'Interested' },
    { value: 'meeting_scheduled', label: 'Meeting Scheduled' },
    { value: 'proposal_sent', label: 'Proposal Sent' },
    { value: 'negotiating', label: 'Negotiating' },
    { value: 'won', label: 'Won / Converted' },
    { value: 'lost', label: 'Lost' },
    { value: 'on_hold', label: 'On Hold' },
    { value: 'other', label: 'Other' },
];

export default function NewContactPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        companyName: '',
        contactPerson: '',
        email: '',
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
        <div className="min-h-screen bg-black">
            <div className="p-8 max-w-xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/ergopack/contacts">
                        <Button variant="ghost" className="text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full w-10 h-10 p-0">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-light tracking-wide text-white flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-black" />
                            </div>
                            New Lead
                        </h1>
                        <p className="text-zinc-500 mt-1 ml-[52px] text-sm">Add a new company</p>
                    </div>
                </div>

                {error && (
                    <Alert className="mb-6 border-zinc-700 bg-zinc-900">
                        <AlertCircle className="w-4 h-4 text-white" />
                        <AlertDescription className="text-white">{error}</AlertDescription>
                    </Alert>
                )}

                <form onSubmit={handleSubmit}>
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg text-white font-light">Lead Details</CardTitle>
                            <CardDescription className="text-zinc-500">
                                Enter the basic information
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            {/* Company Name - Required */}
                            <div className="space-y-2">
                                <Label className="text-zinc-400 text-xs uppercase tracking-wider">
                                    Company Name <span className="text-white">*</span>
                                </Label>
                                <Input
                                    value={formData.companyName}
                                    onChange={(e) => handleChange('companyName', e.target.value)}
                                    placeholder="ABC Packaging Pvt Ltd"
                                    required
                                    className="h-12 bg-black border-zinc-700 text-white placeholder:text-zinc-600 focus:border-white"
                                />
                            </div>

                            {/* Contact Person - Optional */}
                            <div className="space-y-2">
                                <Label className="text-zinc-400 text-xs uppercase tracking-wider">
                                    Contact Person <span className="text-zinc-600 text-xs normal-case">(optional)</span>
                                </Label>
                                <Input
                                    value={formData.contactPerson}
                                    onChange={(e) => handleChange('contactPerson', e.target.value)}
                                    placeholder="John Doe"
                                    className="h-12 bg-black border-zinc-700 text-white placeholder:text-zinc-600 focus:border-white"
                                />
                            </div>

                            {/* Email - Optional */}
                            <div className="space-y-2">
                                <Label className="text-zinc-400 text-xs uppercase tracking-wider">
                                    Email <span className="text-zinc-600 text-xs normal-case">(optional)</span>
                                </Label>
                                <Input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => handleChange('email', e.target.value)}
                                    placeholder="contact@company.com"
                                    className="h-12 bg-black border-zinc-700 text-white placeholder:text-zinc-600 focus:border-white"
                                />
                            </div>

                            {/* Status */}
                            <div className="space-y-2">
                                <Label className="text-zinc-400 text-xs uppercase tracking-wider">Status</Label>
                                <Select value={formData.status} onValueChange={(v) => handleChange('status', v)}>
                                    <SelectTrigger className="h-12 bg-black border-zinc-700 text-white focus:border-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-900 border-zinc-700">
                                        {STATUS_OPTIONS.map((opt) => (
                                            <SelectItem
                                                key={opt.value}
                                                value={opt.value}
                                                className="text-white focus:bg-zinc-800 focus:text-white"
                                            >
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Submit Buttons */}
                            <div className="flex gap-3 pt-6">
                                <Link href="/ergopack/contacts" className="flex-1">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full h-12 border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                                    >
                                        Cancel
                                    </Button>
                                </Link>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting || !formData.companyName.trim()}
                                    className="flex-1 h-12 bg-white text-black hover:bg-zinc-200 font-light tracking-wide disabled:opacity-30"
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
