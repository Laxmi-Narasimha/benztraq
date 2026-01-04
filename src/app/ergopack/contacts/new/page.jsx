/**
 * New Contact Page - Simplified Lead Entry
 * 
 * Clean, minimal form for quick lead entry.
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
import { Building2, Save, ArrowLeft, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';

const STATUS_OPTIONS = [
    { value: 'new', label: 'New Lead', color: 'bg-blue-500' },
    { value: 'contacted', label: 'Contacted', color: 'bg-yellow-500' },
    { value: 'interested', label: 'Interested', color: 'bg-purple-500' },
    { value: 'meeting_scheduled', label: 'Meeting Scheduled', color: 'bg-indigo-500' },
    { value: 'proposal_sent', label: 'Proposal Sent', color: 'bg-cyan-500' },
    { value: 'negotiating', label: 'Negotiating', color: 'bg-orange-500' },
    { value: 'won', label: 'Won / Converted', color: 'bg-emerald-500' },
    { value: 'lost', label: 'Lost', color: 'bg-red-500' },
    { value: 'on_hold', label: 'On Hold', color: 'bg-slate-500' },
    { value: 'other', label: 'Other', color: 'bg-gray-500' },
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
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <div className="p-8 max-w-xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/ergopack/contacts">
                        <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-full w-10 h-10 p-0">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            New Lead
                        </h1>
                        <p className="text-slate-400 mt-1 ml-[52px]">Quick add a new company</p>
                    </div>
                </div>

                {error && (
                    <Alert className="mb-6 border-red-500/50 bg-red-500/10 backdrop-blur">
                        <AlertCircle className="w-4 h-4 text-red-400" />
                        <AlertDescription className="text-red-400">{error}</AlertDescription>
                    </Alert>
                )}

                <form onSubmit={handleSubmit}>
                    <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm shadow-xl">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg text-white">Lead Details</CardTitle>
                            <CardDescription className="text-slate-400">
                                Enter the basic information
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            {/* Company Name - Required */}
                            <div className="space-y-2">
                                <Label className="text-slate-300 text-sm font-medium">
                                    Company Name <span className="text-red-400">*</span>
                                </Label>
                                <Input
                                    value={formData.companyName}
                                    onChange={(e) => handleChange('companyName', e.target.value)}
                                    placeholder="ABC Packaging Pvt Ltd"
                                    required
                                    className="h-12 bg-slate-700/50 border-slate-600/50 text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                                />
                            </div>

                            {/* Contact Person - Optional */}
                            <div className="space-y-2">
                                <Label className="text-slate-300 text-sm font-medium">
                                    Contact Person <span className="text-slate-500 text-xs">(optional)</span>
                                </Label>
                                <Input
                                    value={formData.contactPerson}
                                    onChange={(e) => handleChange('contactPerson', e.target.value)}
                                    placeholder="John Doe"
                                    className="h-12 bg-slate-700/50 border-slate-600/50 text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                                />
                            </div>

                            {/* Email - Optional */}
                            <div className="space-y-2">
                                <Label className="text-slate-300 text-sm font-medium">
                                    Email <span className="text-slate-500 text-xs">(optional)</span>
                                </Label>
                                <Input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => handleChange('email', e.target.value)}
                                    placeholder="contact@company.com"
                                    className="h-12 bg-slate-700/50 border-slate-600/50 text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                                />
                            </div>

                            {/* Status */}
                            <div className="space-y-2">
                                <Label className="text-slate-300 text-sm font-medium">Status</Label>
                                <Select value={formData.status} onValueChange={(v) => handleChange('status', v)}>
                                    <SelectTrigger className="h-12 bg-slate-700/50 border-slate-600/50 text-white focus:border-emerald-500/50">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-800 border-slate-700">
                                        {STATUS_OPTIONS.map((opt) => (
                                            <SelectItem
                                                key={opt.value}
                                                value={opt.value}
                                                className="text-white focus:bg-slate-700 focus:text-white"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${opt.color}`} />
                                                    {opt.label}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Submit Buttons */}
                            <div className="flex gap-3 pt-4">
                                <Link href="/ergopack/contacts" className="flex-1">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full h-12 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                                    >
                                        Cancel
                                    </Button>
                                </Link>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting || !formData.companyName.trim()}
                                    className="flex-1 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-medium shadow-lg shadow-emerald-500/20"
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
