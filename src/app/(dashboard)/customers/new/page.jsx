'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    ArrowLeft, Save, Building2, User, Mail, Phone, MapPin,
    Globe, CreditCard, FileText, Tag, AlertTriangle,
    ChevronDown, Plus
} from 'lucide-react';

// GST Treatment Options (from Odoo l10n_in)
const GST_TREATMENTS = [
    { value: 'regular', label: 'Registered Business - Regular' },
    { value: 'composition', label: 'Registered Business - Composition' },
    { value: 'unregistered', label: 'Unregistered Business' },
    { value: 'consumer', label: 'Consumer' },
    { value: 'overseas', label: 'Overseas' },
    { value: 'special_economic_zone', label: 'Special Economic Zone' },
    { value: 'deemed_export', label: 'Deemed Export' },
    { value: 'uin_holders', label: 'UIN Holders' }
];

// Sale Warning Options
const SALE_WARNINGS = [
    { value: 'no-message', label: 'No Message' },
    { value: 'warning', label: 'Warning' },
    { value: 'block', label: 'Blocking Message' }
];

// Address Types
const ADDRESS_TYPES = [
    { value: 'contact', label: 'Contact' },
    { value: 'invoice', label: 'Invoice Address' },
    { value: 'delivery', label: 'Delivery Address' },
    { value: 'private', label: 'Private Address' },
    { value: 'other', label: 'Other Address' }
];

// Indian States
const INDIAN_STATES = [
    { code: 'MH', name: 'Maharashtra' },
    { code: 'DL', name: 'Delhi' },
    { code: 'KA', name: 'Karnataka' },
    { code: 'TN', name: 'Tamil Nadu' },
    { code: 'GJ', name: 'Gujarat' },
    { code: 'UP', name: 'Uttar Pradesh' },
    { code: 'WB', name: 'West Bengal' },
    { code: 'RJ', name: 'Rajasthan' },
    { code: 'KL', name: 'Kerala' },
    { code: 'AP', name: 'Andhra Pradesh' },
    { code: 'TS', name: 'Telangana' },
    { code: 'MP', name: 'Madhya Pradesh' },
    { code: 'BR', name: 'Bihar' },
    { code: 'PB', name: 'Punjab' },
    { code: 'HR', name: 'Haryana' },
    { code: 'OR', name: 'Odisha' },
    { code: 'JH', name: 'Jharkhand' },
    { code: 'CG', name: 'Chhattisgarh' },
    { code: 'AS', name: 'Assam' },
    { code: 'GA', name: 'Goa' },
    { code: 'HP', name: 'Himachal Pradesh' },
    { code: 'UK', name: 'Uttarakhand' },
    { code: 'JK', name: 'Jammu and Kashmir' }
];

export default function CustomerFormPage() {
    const router = useRouter();
    const params = useParams();
    const isEditing = !!params?.id;

    const [loading, setLoading] = useState(isEditing);
    const [saving, setSaving] = useState(false);
    const [industries, setIndustries] = useState([]);
    const [categories, setCategories] = useState([]);

    // Form data - all Odoo res.partner fields
    const [formData, setFormData] = useState({
        // Core
        name: '',
        is_company: true,
        company_type: 'company',
        active: true,

        // Parent/Child
        parent_id: '',

        // Address
        type: 'contact',
        street: '',
        street2: '',
        city: '',
        state_code: '',
        zip: '',
        country_id: 'IN',

        // Contact
        email: '',
        phone: '',
        mobile: '',
        website: '',
        function: '', // Job Title

        // Location
        partner_latitude: null,
        partner_longitude: null,

        // Business Info
        industry_id: '',
        company_registry: '',
        ref: '', // Internal Reference

        // GST (Indian Localization)
        gstin: '',
        l10n_in_gst_treatment: 'consumer',
        l10n_in_pan: '',

        // Sales Specific
        sale_warn: 'no-message',
        sale_warn_msg: '',

        // Credit
        credit_limit: 0,
        use_partner_credit_limit: false,

        // Tags
        category_ids: [],

        // Display
        color: 0,
        comment: '' // Notes
    });

    // Fetch lookup data
    useEffect(() => {
        const fetchLookups = async () => {
            try {
                const [industriesRes, categoriesRes] = await Promise.all([
                    fetch('/api/lookup/industries'),
                    fetch('/api/lookup/partner-categories')
                ]);

                const [industriesData, categoriesData] = await Promise.all([
                    industriesRes.ok ? industriesRes.json() : { data: [] },
                    categoriesRes.ok ? categoriesRes.json() : { data: [] }
                ]);

                // Use defaults if API not available
                setIndustries(industriesData.data || [
                    { id: '1', name: 'Manufacturing' },
                    { id: '2', name: 'IT Services' },
                    { id: '3', name: 'Retail' },
                    { id: '4', name: 'Healthcare' },
                    { id: '5', name: 'Education' }
                ]);

                setCategories(categoriesData.data || [
                    { id: '1', name: 'VIP', color: 1 },
                    { id: '2', name: 'Regular', color: 2 },
                    { id: '3', name: 'Prospect', color: 3 }
                ]);

            } catch (error) {
                console.error('Error fetching lookups:', error);
            }
        };

        fetchLookups();
    }, []);

    // Fetch existing customer if editing
    useEffect(() => {
        if (isEditing && params.id) {
            const fetchCustomer = async () => {
                try {
                    const res = await fetch(`/api/customers/${params.id}`);
                    const data = await res.json();
                    if (data.success || data.customer) {
                        setFormData(prev => ({
                            ...prev,
                            ...(data.customer || data.data)
                        }));
                    }
                } catch (error) {
                    console.error('Error fetching customer:', error);
                } finally {
                    setLoading(false);
                }
            };
            fetchCustomer();
        }
    }, [isEditing, params?.id]);

    // Validate GSTIN format
    const validateGSTIN = (gstin) => {
        if (!gstin) return true;
        const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/;
        return gstinRegex.test(gstin.toUpperCase());
    };

    // Handle company type change
    const handleCompanyTypeChange = (value) => {
        setFormData(prev => ({
            ...prev,
            company_type: value,
            is_company: value === 'company'
        }));
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name) {
            alert('Please enter a name');
            return;
        }

        if (formData.gstin && !validateGSTIN(formData.gstin)) {
            alert('Invalid GSTIN format');
            return;
        }

        try {
            setSaving(true);

            const url = isEditing ? `/api/customers/${params.id}` : '/api/customers';
            const method = isEditing ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (res.ok) {
                router.push('/customers');
            } else {
                throw new Error(data.error || 'Failed to save customer');
            }

        } catch (error) {
            console.error('Error saving customer:', error);
            alert(error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-6 py-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => router.back()}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {isEditing ? 'Edit Customer' : 'New Customer'}
                    </h1>
                    <p className="text-sm text-gray-500">
                        {isEditing ? 'Update customer information' : 'Add a new customer or company'}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-indigo-500" />
                        Basic Information
                    </h2>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Company Type Toggle */}
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="company_type"
                                        value="company"
                                        checked={formData.company_type === 'company'}
                                        onChange={(e) => handleCompanyTypeChange(e.target.value)}
                                        className="w-4 h-4 text-indigo-600"
                                    />
                                    <Building2 className="w-4 h-4 text-gray-500" />
                                    <span>Company</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="company_type"
                                        value="person"
                                        checked={formData.company_type === 'person'}
                                        onChange={(e) => handleCompanyTypeChange(e.target.value)}
                                        className="w-4 h-4 text-indigo-600"
                                    />
                                    <User className="w-4 h-4 text-gray-500" />
                                    <span>Individual</span>
                                </label>
                            </div>
                        </div>

                        {/* Name */}
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {formData.is_company ? 'Company Name' : 'Full Name'} *
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                required
                            />
                        </div>

                        {/* Job Title (for individuals) */}
                        {!formData.is_company && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Job Position
                                </label>
                                <input
                                    type="text"
                                    value={formData.function}
                                    onChange={(e) => setFormData(prev => ({ ...prev, function: e.target.value }))}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        )}

                        {/* Industry */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                            <select
                                value={formData.industry_id}
                                onChange={(e) => setFormData(prev => ({ ...prev, industry_id: e.target.value }))}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">Select Industry</option>
                                {industries.map(ind => (
                                    <option key={ind.id} value={ind.id}>{ind.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Internal Reference */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Internal Reference
                            </label>
                            <input
                                type="text"
                                value={formData.ref}
                                onChange={(e) => setFormData(prev => ({ ...prev, ref: e.target.value }))}
                                placeholder="e.g., CUS001"
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>
                </div>

                {/* GST Information */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-indigo-500" />
                        GST Information
                    </h2>

                    <div className="grid grid-cols-2 gap-4">
                        {/* GST Treatment */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                GST Treatment *
                            </label>
                            <select
                                value={formData.l10n_in_gst_treatment}
                                onChange={(e) => setFormData(prev => ({ ...prev, l10n_in_gst_treatment: e.target.value }))}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                            >
                                {GST_TREATMENTS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* GSTIN */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                GSTIN
                            </label>
                            <input
                                type="text"
                                value={formData.gstin}
                                onChange={(e) => setFormData(prev => ({ ...prev, gstin: e.target.value.toUpperCase() }))}
                                placeholder="22AAAAA0000A1Z5"
                                maxLength={15}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 uppercase
                  ${formData.gstin && !validateGSTIN(formData.gstin) ? 'border-red-500' : ''}`}
                            />
                            {formData.gstin && !validateGSTIN(formData.gstin) && (
                                <p className="text-xs text-red-500 mt-1">Invalid GSTIN format</p>
                            )}
                        </div>

                        {/* PAN */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                PAN
                            </label>
                            <input
                                type="text"
                                value={formData.l10n_in_pan}
                                onChange={(e) => setFormData(prev => ({ ...prev, l10n_in_pan: e.target.value.toUpperCase() }))}
                                placeholder="AAAAA0000A"
                                maxLength={10}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 uppercase"
                            />
                        </div>
                    </div>
                </div>

                {/* Contact Information */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Phone className="w-5 h-5 text-indigo-500" />
                        Contact Information
                    </h2>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
                            <input
                                type="tel"
                                value={formData.mobile}
                                onChange={(e) => setFormData(prev => ({ ...prev, mobile: e.target.value }))}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                            <div className="relative">
                                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="url"
                                    value={formData.website}
                                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Address */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-indigo-500" />
                        Address
                    </h2>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Address Type</label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                            >
                                {ADDRESS_TYPES.map(t => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                        </div>

                        <div></div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Street</label>
                            <input
                                type="text"
                                value={formData.street}
                                onChange={(e) => setFormData(prev => ({ ...prev, street: e.target.value }))}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Street 2</label>
                            <input
                                type="text"
                                value={formData.street2}
                                onChange={(e) => setFormData(prev => ({ ...prev, street2: e.target.value }))}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                            <input
                                type="text"
                                value={formData.city}
                                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                            <select
                                value={formData.state_code}
                                onChange={(e) => setFormData(prev => ({ ...prev, state_code: e.target.value }))}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">Select State</option>
                                {INDIAN_STATES.map(state => (
                                    <option key={state.code} value={state.code}>{state.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">PIN Code</label>
                            <input
                                type="text"
                                value={formData.zip}
                                onChange={(e) => setFormData(prev => ({ ...prev, zip: e.target.value }))}
                                maxLength={6}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Sales & Credit */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-indigo-500" />
                        Sales & Credit
                    </h2>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Sales Warning
                            </label>
                            <select
                                value={formData.sale_warn}
                                onChange={(e) => setFormData(prev => ({ ...prev, sale_warn: e.target.value }))}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                            >
                                {SALE_WARNINGS.map(w => (
                                    <option key={w.value} value={w.value}>{w.label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Credit Limit (₹)
                            </label>
                            <input
                                type="number"
                                value={formData.credit_limit}
                                onChange={(e) => setFormData(prev => ({ ...prev, credit_limit: parseFloat(e.target.value) || 0 }))}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        {formData.sale_warn !== 'no-message' && (
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Warning Message
                                </label>
                                <textarea
                                    value={formData.sale_warn_msg}
                                    onChange={(e) => setFormData(prev => ({ ...prev, sale_warn_msg: e.target.value }))}
                                    rows={2}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Notes */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Internal Notes</h2>
                    <textarea
                        value={formData.comment}
                        onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                        rows={4}
                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                        placeholder="Add notes about this customer..."
                    />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-4">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 
                       disabled:opacity-50 flex items-center gap-2"
                    >
                        {saving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                {isEditing ? 'Update Customer' : 'Create Customer'}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
