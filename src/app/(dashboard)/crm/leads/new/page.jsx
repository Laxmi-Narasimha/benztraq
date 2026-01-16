'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    ArrowLeft, Save, User, Building2, Mail, Phone, MapPin,
    Calendar, DollarSign, Target, Tag, Globe, MessageSquare,
    Users, TrendingUp, Star
} from 'lucide-react';

// Priority options
const PRIORITIES = [
    { value: '0', label: 'Low', color: 'bg-gray-200' },
    { value: '1', label: 'Medium', color: 'bg-blue-200' },
    { value: '2', label: 'High', color: 'bg-yellow-200' },
    { value: '3', label: 'Very High', color: 'bg-red-200' }
];

export default function NewLeadPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialStageId = searchParams.get('stage_id');

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Lookup data
    const [stages, setStages] = useState([]);
    const [teams, setTeams] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [sources, setSources] = useState([]);
    const [campaigns, setCampaigns] = useState([]);

    // Form data - all Odoo crm.lead fields
    const [formData, setFormData] = useState({
        // Core
        name: '',
        type: 'opportunity',
        active: true,

        // Probability & Revenue
        probability: 10,
        expected_revenue: 0,
        recurring_revenue: 0,
        recurring_revenue_monthly: 0,

        // Priority
        priority: '1',
        color: 0,

        // Stage & Pipeline
        stage_id: initialStageId || '',
        team_id: '',
        user_id: '',

        // Customer Link
        partner_id: '',
        partner_name: '',

        // Contact Info
        contact_name: '',
        email_from: '',
        phone: '',
        mobile: '',

        // Address
        street: '',
        street2: '',
        city: '',
        state_id: '',
        zip: '',
        country_id: 'IN',

        // UTM
        campaign_id: '',
        source_id: '',
        medium_id: '',

        // Dates
        date_deadline: '',

        // Additional
        description: '',
        website: '',
        referred: ''
    });

    // Fetch lookup data
    useEffect(() => {
        const fetchLookups = async () => {
            try {
                setLoading(true);

                const [stagesRes, teamsRes, customersRes, sourcesRes, campaignsRes] = await Promise.all([
                    fetch('/api/crm/stages?include_stats=false'),
                    fetch('/api/crm/teams'),
                    fetch('/api/customers?limit=100'),
                    fetch('/api/utm/sources'),
                    fetch('/api/utm/campaigns')
                ]);

                const [stagesData, teamsData, customersData, sourcesData, campaignsData] = await Promise.all([
                    stagesRes.json(),
                    teamsRes.json(),
                    customersRes.json(),
                    sourcesRes.json(),
                    campaignsRes.json()
                ]);

                if (stagesData.success) setStages(stagesData.data);
                if (teamsData.success) setTeams(teamsData.data);
                if (customersData.success) setCustomers(customersData.data || customersData.customers || []);
                if (sourcesData.success) setSources(sourcesData.data);
                if (campaignsData.success) setCampaigns(campaignsData.data);

                // Set default stage
                if (!formData.stage_id && stagesData.data?.length > 0) {
                    setFormData(prev => ({ ...prev, stage_id: stagesData.data[0].id }));
                }

            } catch (error) {
                console.error('Error fetching lookups:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchLookups();
    }, []);

    // Handle customer selection
    const handleCustomerChange = (customerId) => {
        const customer = customers.find(c => c.id === customerId);
        if (customer) {
            setFormData(prev => ({
                ...prev,
                partner_id: customerId,
                partner_name: customer.name,
                email_from: customer.email || prev.email_from,
                phone: customer.phone || prev.phone,
                mobile: customer.mobile || prev.mobile,
                street: customer.street || prev.street,
                city: customer.city || prev.city,
                state_id: customer.state_id || prev.state_id,
                zip: customer.zip || prev.zip
            }));
        } else {
            setFormData(prev => ({ ...prev, partner_id: '' }));
        }
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name) {
            alert('Please enter an opportunity name');
            return;
        }

        try {
            setSaving(true);

            const res = await fetch('/api/crm/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (data.success) {
                router.push('/crm/pipeline');
            } else {
                throw new Error(data.error || 'Failed to create opportunity');
            }

        } catch (error) {
            console.error('Error creating opportunity:', error);
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
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">New Opportunity</h1>
                    <p className="text-sm text-gray-500">Create a new lead or opportunity</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info Card */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Target className="w-5 h-5 text-indigo-500" />
                        Opportunity Info
                    </h2>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Opportunity Name */}
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Opportunity Name *
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="e.g., 100 units - ABC Corp"
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                required
                            />
                        </div>

                        {/* Expected Revenue */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Expected Revenue (₹)
                            </label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="number"
                                    value={formData.expected_revenue}
                                    onChange={(e) => setFormData(prev => ({ ...prev, expected_revenue: parseFloat(e.target.value) || 0 }))}
                                    placeholder="0"
                                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        {/* Probability */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Probability (%)
                            </label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={formData.probability}
                                    onChange={(e) => setFormData(prev => ({ ...prev, probability: parseInt(e.target.value) }))}
                                    className="flex-1"
                                />
                                <span className="w-12 text-center font-medium">{formData.probability}%</span>
                            </div>
                        </div>

                        {/* Stage */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Stage
                            </label>
                            <select
                                value={formData.stage_id}
                                onChange={(e) => setFormData(prev => ({ ...prev, stage_id: e.target.value }))}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">Select Stage</option>
                                {stages.map(stage => (
                                    <option key={stage.id} value={stage.id}>{stage.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Priority */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Priority
                            </label>
                            <div className="flex gap-2">
                                {PRIORITIES.map(p => (
                                    <button
                                        key={p.value}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, priority: p.value }))}
                                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${formData.priority === p.value
                                                ? `${p.color} ring-2 ring-offset-1 ring-gray-400`
                                                : 'bg-gray-100 hover:bg-gray-200'
                                            }`}
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Expected Closing Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Expected Closing
                            </label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="date"
                                    value={formData.date_deadline}
                                    onChange={(e) => setFormData(prev => ({ ...prev, date_deadline: e.target.value }))}
                                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        {/* Sales Team */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Sales Team
                            </label>
                            <select
                                value={formData.team_id}
                                onChange={(e) => setFormData(prev => ({ ...prev, team_id: e.target.value }))}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">Select Team</option>
                                {teams.map(team => (
                                    <option key={team.id} value={team.id}>{team.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Customer Card */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-indigo-500" />
                        Customer
                    </h2>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Existing Customer */}
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Link to Customer
                            </label>
                            <select
                                value={formData.partner_id}
                                onChange={(e) => handleCustomerChange(e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">Create New / No Customer</option>
                                {customers.map(customer => (
                                    <option key={customer.id} value={customer.id}>
                                        {customer.name} {customer.gstin ? `(${customer.gstin})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Company Name (if no partner) */}
                        {!formData.partner_id && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Company Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.partner_name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, partner_name: e.target.value }))}
                                    placeholder="Company name"
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        )}

                        {/* Contact Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Contact Name
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={formData.contact_name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, contact_name: e.target.value }))}
                                    placeholder="Contact person"
                                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="email"
                                    value={formData.email_from}
                                    onChange={(e) => setFormData(prev => ({ ...prev, email_from: e.target.value }))}
                                    placeholder="email@example.com"
                                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Phone
                            </label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                    placeholder="+91 9876543210"
                                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        {/* Mobile */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Mobile
                            </label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="tel"
                                    value={formData.mobile}
                                    onChange={(e) => setFormData(prev => ({ ...prev, mobile: e.target.value }))}
                                    placeholder="+91 9876543210"
                                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        {/* City */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                City
                            </label>
                            <input
                                type="text"
                                value={formData.city}
                                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Marketing Card */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-indigo-500" />
                        Marketing
                    </h2>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Campaign */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Campaign
                            </label>
                            <select
                                value={formData.campaign_id}
                                onChange={(e) => setFormData(prev => ({ ...prev, campaign_id: e.target.value }))}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">Select Campaign</option>
                                {campaigns.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Source */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Source
                            </label>
                            <select
                                value={formData.source_id}
                                onChange={(e) => setFormData(prev => ({ ...prev, source_id: e.target.value }))}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">Select Source</option>
                                {sources.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Referred By */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Referred By
                            </label>
                            <input
                                type="text"
                                value={formData.referred}
                                onChange={(e) => setFormData(prev => ({ ...prev, referred: e.target.value }))}
                                placeholder="Referral name"
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        {/* Website */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Website
                            </label>
                            <div className="relative">
                                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="url"
                                    value={formData.website}
                                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                                    placeholder="https://example.com"
                                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notes Card */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-indigo-500" />
                        Internal Notes
                    </h2>

                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        rows={4}
                        placeholder="Add notes about this opportunity..."
                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-4">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 
                       disabled:opacity-50 flex items-center gap-2 transition"
                    >
                        {saving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Create Opportunity
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
