'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
    X, Building2, User, Camera, Phone, Mail, Globe,
    MapPin, Tag, Save, Loader2, AlertCircle, Check
} from 'lucide-react';

// Indian States for dropdown
const INDIAN_STATES = [
    { code: 'AN', name: 'Andaman and Nicobar Islands' },
    { code: 'AP', name: 'Andhra Pradesh' },
    { code: 'AR', name: 'Arunachal Pradesh' },
    { code: 'AS', name: 'Assam' },
    { code: 'BR', name: 'Bihar' },
    { code: 'CH', name: 'Chandigarh' },
    { code: 'CT', name: 'Chhattisgarh' },
    { code: 'DD', name: 'Dadra and Nagar Haveli and Daman and Diu' },
    { code: 'DL', name: 'Delhi' },
    { code: 'GA', name: 'Goa' },
    { code: 'GJ', name: 'Gujarat' },
    { code: 'HR', name: 'Haryana' },
    { code: 'HP', name: 'Himachal Pradesh' },
    { code: 'JK', name: 'Jammu and Kashmir' },
    { code: 'JH', name: 'Jharkhand' },
    { code: 'KA', name: 'Karnataka' },
    { code: 'KL', name: 'Kerala' },
    { code: 'LA', name: 'Ladakh' },
    { code: 'LD', name: 'Lakshadweep' },
    { code: 'MP', name: 'Madhya Pradesh' },
    { code: 'MH', name: 'Maharashtra' },
    { code: 'MN', name: 'Manipur' },
    { code: 'ML', name: 'Meghalaya' },
    { code: 'MZ', name: 'Mizoram' },
    { code: 'NL', name: 'Nagaland' },
    { code: 'OR', name: 'Odisha' },
    { code: 'PY', name: 'Puducherry' },
    { code: 'PB', name: 'Punjab' },
    { code: 'RJ', name: 'Rajasthan' },
    { code: 'SK', name: 'Sikkim' },
    { code: 'TN', name: 'Tamil Nadu' },
    { code: 'TG', name: 'Telangana' },
    { code: 'TR', name: 'Tripura' },
    { code: 'UP', name: 'Uttar Pradesh' },
    { code: 'UK', name: 'Uttarakhand' },
    { code: 'WB', name: 'West Bengal' },
];

// GST Treatment options (exactly as in Odoo l10n_in)
const GST_TREATMENTS = [
    { value: 'regular', label: 'Registered Business - Regular' },
    { value: 'composition', label: 'Registered Business - Composition' },
    { value: 'unregistered', label: 'Unregistered Business' },
    { value: 'consumer', label: 'Consumer' },
    { value: 'overseas', label: 'Overseas' },
    { value: 'special_economic_zone', label: 'Special Economic Zone' },
    { value: 'deemed_export', label: 'Deemed Export' },
    { value: 'uin_holders', label: 'UIN Holders' },
];

// Tag colors for partner categories
const TAG_COLORS = [
    'bg-red-100 text-red-700',
    'bg-orange-100 text-orange-700',
    'bg-yellow-100 text-yellow-700',
    'bg-green-100 text-green-700',
    'bg-blue-100 text-blue-700',
    'bg-indigo-100 text-indigo-700',
    'bg-purple-100 text-purple-700',
    'bg-pink-100 text-pink-700',
];

/**
 * Odoo-Style Customer Form Modal
 * Exact replication of Odoo's res.partner form view
 */
export default function OdooCustomerFormModal({
    isOpen,
    onClose,
    onSave,
    initialName = '',
    initialData = null,
    mode = 'create' // 'create' or 'edit'
}) {
    const [mounted, setMounted] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('contacts');
    const nameInputRef = useRef(null);

    // Form state
    const [formData, setFormData] = useState({
        // Core
        is_company: false,
        name: initialName,

        // Address
        street: '',
        street2: '',
        city: '',
        zip: '',
        state: '',
        country_id: 'IN',

        // Contact
        phone: '',
        mobile: '',
        email: '',
        website: '',

        // GST (Indian Localization)
        l10n_in_gst_treatment: 'consumer',
        gstin: '',
        l10n_in_pan: '',

        // Tags
        tags: [],

        // Notes
        comment: '',
    });

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isOpen && nameInputRef.current) {
            setTimeout(() => nameInputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    useEffect(() => {
        if (initialName) {
            setFormData(prev => ({ ...prev, name: initialName }));
        }
    }, [initialName]);

    useEffect(() => {
        if (initialData) {
            setFormData(prev => ({
                ...prev,
                ...initialData,
                is_company: initialData.is_company || initialData.company_type === 'company',
            }));
        }
    }, [initialData]);

    const handleChange = useCallback((field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError(null);
    }, []);

    const handleCompanyToggle = useCallback((isCompany) => {
        setFormData(prev => ({
            ...prev,
            is_company: isCompany,
            company_type: isCompany ? 'company' : 'person',
        }));
    }, []);

    const validateForm = () => {
        if (!formData.name.trim()) {
            setError('Name is required');
            return false;
        }

        // Validate GSTIN format if provided
        if (formData.gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(formData.gstin)) {
            setError('Invalid GSTIN format. Example: 27AABCU9603R1ZM');
            return false;
        }

        // Validate PAN format if provided
        if (formData.l10n_in_pan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.l10n_in_pan)) {
            setError('Invalid PAN format. Example: ABCTY1234D');
            return false;
        }

        return true;
    };

    const handleSave = async () => {
        if (!validateForm()) return;

        setSaving(true);
        setError(null);

        try {
            // Prepare data for API
            const customerData = {
                name: formData.name.trim(),
                is_company: formData.is_company,
                company_type: formData.is_company ? 'company' : 'person',
                street: formData.street || null,
                street2: formData.street2 || null,
                city: formData.city || null,
                zip: formData.zip || null,
                country_id: formData.country_id || 'IN',
                phone: formData.phone || null,
                mobile: formData.mobile || null,
                email: formData.email || null,
                website: formData.website || null,
                l10n_in_gst_treatment: formData.l10n_in_gst_treatment,
                gstin: formData.gstin || null,
                l10n_in_pan: formData.l10n_in_pan || null,
                comment: formData.comment || null,
                active: true,
            };

            // Call API
            const response = await fetch('/api/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(customerData),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to save customer');
            }

            // Call onSave callback with created customer
            onSave?.(result.customer);
            onClose();
        } catch (err) {
            console.error('Save customer error:', err);
            setError(err.message || 'Failed to save customer');
        } finally {
            setSaving(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            onClose();
        }
    };

    if (!mounted || !isOpen) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-start justify-center pt-10 bg-black/50 backdrop-blur-sm overflow-y-auto"
            onKeyDown={handleKeyDown}
        >
            <div className="bg-white w-full max-w-5xl rounded-lg shadow-2xl my-4 animate-in zoom-in-95 fade-in duration-200">
                {/* Odoo-style header with breadcrumb */}
                <div className="flex items-center justify-between px-4 py-2 bg-gray-800 text-white rounded-t-lg">
                    <div className="flex items-center gap-2">
                        <span className="text-sm opacity-80">Quotations</span>
                        <span className="opacity-60">/</span>
                        <span className="text-sm font-medium">New Customer</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-700 rounded transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Status bar */}
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 border-b">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-3 py-1.5 bg-purple-700 text-white text-sm font-medium rounded 
                            hover:bg-purple-800 disabled:opacity-50 transition-colors flex items-center gap-2"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save
                    </button>
                    <button
                        onClick={onClose}
                        className="px-3 py-1.5 bg-white text-gray-700 text-sm font-medium rounded border 
                            hover:bg-gray-50 transition-colors"
                    >
                        Discard
                    </button>
                </div>

                {/* Error message */}
                {error && (
                    <div className="mx-4 mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        {error}
                    </div>
                )}

                {/* Form Content */}
                <div className="p-4">
                    {/* Individual / Company Toggle */}
                    <div className="flex items-center gap-6 mb-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="company_type"
                                checked={!formData.is_company}
                                onChange={() => handleCompanyToggle(false)}
                                className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                            />
                            <User className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">Individual</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="company_type"
                                checked={formData.is_company}
                                onChange={() => handleCompanyToggle(true)}
                                className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                            />
                            <Building2 className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">Company</span>
                        </label>
                    </div>

                    {/* Name + Photo Row */}
                    <div className="flex gap-6 mb-6">
                        {/* Name Input (large like Odoo) */}
                        <div className="flex-1">
                            <input
                                ref={nameInputRef}
                                type="text"
                                value={formData.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                placeholder={formData.is_company ? "e.g. Lumber Inc" : "e.g. John Smith"}
                                className="w-full text-2xl font-light text-gray-800 border-0 border-b-2 border-gray-200 
                                    focus:border-purple-500 focus:ring-0 pb-2 bg-transparent placeholder:text-gray-300"
                            />
                        </div>
                        {/* Photo placeholder */}
                        <div className="w-24 h-24 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 
                            flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
                            <Camera className="w-8 h-8 text-gray-400" />
                        </div>
                    </div>

                    {/* Two Column Layout */}
                    <div className="grid grid-cols-2 gap-8">
                        {/* Left Column - Address & GST */}
                        <div className="space-y-4">
                            {/* Address Section */}
                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-gray-700">Address</label>
                                <input
                                    type="text"
                                    value={formData.street}
                                    onChange={(e) => handleChange('street', e.target.value)}
                                    placeholder="Street..."
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md 
                                        focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                                />
                                <input
                                    type="text"
                                    value={formData.street2}
                                    onChange={(e) => handleChange('street2', e.target.value)}
                                    placeholder="Street 2..."
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md 
                                        focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                                />
                                <div className="grid grid-cols-3 gap-2">
                                    <input
                                        type="text"
                                        value={formData.city}
                                        onChange={(e) => handleChange('city', e.target.value)}
                                        placeholder="City"
                                        className="px-3 py-2 text-sm border border-gray-300 rounded-md 
                                            focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                                    />
                                    <input
                                        type="text"
                                        value={formData.zip}
                                        onChange={(e) => handleChange('zip', e.target.value)}
                                        placeholder="ZIP"
                                        className="px-3 py-2 text-sm border border-gray-300 rounded-md 
                                            focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                                    />
                                    <select
                                        value={formData.state}
                                        onChange={(e) => handleChange('state', e.target.value)}
                                        className="px-3 py-2 text-sm border border-gray-300 rounded-md 
                                            focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                                    >
                                        <option value="">State</option>
                                        {INDIAN_STATES.map(state => (
                                            <option key={state.code} value={state.code}>{state.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <select
                                    value={formData.country_id}
                                    onChange={(e) => handleChange('country_id', e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md 
                                        focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                                >
                                    <option value="IN">India</option>
                                </select>
                            </div>

                            {/* GST Treatment */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">GST Treatment</label>
                                <select
                                    value={formData.l10n_in_gst_treatment}
                                    onChange={(e) => handleChange('l10n_in_gst_treatment', e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md 
                                        focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                                >
                                    {GST_TREATMENTS.map(treatment => (
                                        <option key={treatment.value} value={treatment.value}>
                                            {treatment.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* GSTIN */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    GSTIN <span className="text-gray-400 font-normal">/ if not applicable</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.gstin}
                                    onChange={(e) => handleChange('gstin', e.target.value.toUpperCase())}
                                    placeholder="e.g. 27AABCU9603R1ZM"
                                    maxLength={15}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md 
                                        focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 uppercase"
                                />
                            </div>

                            {/* PAN */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">PAN</label>
                                <input
                                    type="text"
                                    value={formData.l10n_in_pan}
                                    onChange={(e) => handleChange('l10n_in_pan', e.target.value.toUpperCase())}
                                    placeholder="e.g. ABCTY1234D"
                                    maxLength={10}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md 
                                        focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 uppercase"
                                />
                            </div>
                        </div>

                        {/* Right Column - Contact Info */}
                        <div className="space-y-4">
                            {/* Phone */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Phone className="w-4 h-4 inline mr-1" />
                                    Phone
                                </label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => handleChange('phone', e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md 
                                        focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                                />
                            </div>

                            {/* Mobile */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Phone className="w-4 h-4 inline mr-1" />
                                    Mobile
                                </label>
                                <input
                                    type="tel"
                                    value={formData.mobile}
                                    onChange={(e) => handleChange('mobile', e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md 
                                        focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Mail className="w-4 h-4 inline mr-1" />
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => handleChange('email', e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md 
                                        focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                                />
                            </div>

                            {/* Website */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Globe className="w-4 h-4 inline mr-1" />
                                    Website
                                </label>
                                <input
                                    type="url"
                                    value={formData.website}
                                    onChange={(e) => handleChange('website', e.target.value)}
                                    placeholder="e.g. https://www.odoo.com"
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md 
                                        focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                                />
                            </div>

                            {/* Tags */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Tag className="w-4 h-4 inline mr-1" />
                                    Tags
                                </label>
                                <input
                                    type="text"
                                    placeholder='e.g. "B2B", "VIP", "Consulting"...'
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md 
                                        focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Tabs Section */}
                    <div className="mt-8 border-t pt-4">
                        <div className="flex gap-1 border-b">
                            {[
                                { id: 'contacts', label: 'Contacts & Addresses' },
                                { id: 'sales', label: 'Sales & Purchase' },
                                { id: 'accounting', label: 'Accounting' },
                                { id: 'notes', label: 'Internal Notes' },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors
                                        ${activeTab === tab.id
                                            ? 'border-purple-600 text-purple-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        <div className="py-4 min-h-[120px]">
                            {activeTab === 'contacts' && (
                                <div className="text-sm text-gray-500">
                                    <button className="px-3 py-1.5 border border-gray-300 rounded text-gray-700 hover:bg-gray-50">
                                        + Add
                                    </button>
                                    <p className="mt-2 text-gray-400">Add contact persons or addresses.</p>
                                </div>
                            )}
                            {activeTab === 'sales' && (
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <label className="block text-gray-600 mb-1">Salesperson</label>
                                        <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                                            <option value="">Select...</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-gray-600 mb-1">Payment Terms</label>
                                        <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                                            <option value="">Immediate</option>
                                            <option value="30">30 Days</option>
                                            <option value="45">45 Days</option>
                                            <option value="60">60 Days</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                            {activeTab === 'accounting' && (
                                <div className="text-sm text-gray-500">
                                    <p>Accounting configuration for this customer.</p>
                                </div>
                            )}
                            {activeTab === 'notes' && (
                                <div>
                                    <textarea
                                        value={formData.comment}
                                        onChange={(e) => handleChange('comment', e.target.value)}
                                        placeholder="Internal notes..."
                                        rows={4}
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md 
                                            focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 resize-none"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
