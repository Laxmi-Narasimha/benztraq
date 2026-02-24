import React, { useState, useEffect } from 'react';
import {
    User, Building2, MapPin, Phone, Mail, Globe,
    Plus, Trash2, Save, X, Loader2, CheckCircle2, History
} from 'lucide-react';
import PartnerAddressForm from './PartnerAddressForm';

/**
 * Modern, Simplified Customer Creation Modal
 * Replaces the complex 'OdooPartnerForm'
 */
export default function CustomerFormModal({ isOpen, onClose, onSave, initialName = '', initialData = null }) {
    const [loading, setLoading] = useState(false);
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [childContacts, setChildContacts] = useState([]);

    // Main Form State
    const [formData, setFormData] = useState({
        company_type: 'company', // 'person' or 'company'
        name: initialName,
        parent_id: null,

        // Address
        street: '', street2: '', city: '', state_id: '', zip: '', country_id: 'IN',

        // Tax
        vat: '', // GSTIN
        l10n_in_pan: '',
        l10n_in_gst_treatment: 'regular',

        // Communication
        phone: '', mobile: '', email: '', website: '',

        // Simple Notes
        comment: ''
    });

    useEffect(() => {
        if (isOpen) {
            setFormData(prev => ({
                ...prev,
                name: initialName,
                // Reset other fields if needed, or keep previous state if sustaining edits?
                // For new creation, robust reset is better:
                ...(initialData || {
                    street: '', street2: '', city: '', state_id: '', zip: '', country_id: 'IN',
                    vat: '', l10n_in_pan: '', phone: '', mobile: '', email: '', website: '', comment: ''
                })
            }));
            setChildContacts([]);
        }
    }, [isOpen, initialName, initialData]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddContact = (contactData) => {
        setChildContacts(prev => [...prev, { ...contactData, id: Date.now() }]);
        setShowAddressModal(false);
    };

    const handleRemoveContact = (id) => {
        setChildContacts(prev => prev.filter(c => c.id !== id));
    };

    const handleSave = async () => {
        if (!formData.name.trim()) return;

        setLoading(true);
        try {
            const payload = {
                ...formData,
                child_ids: childContacts,
                is_company: formData.company_type === 'company' // Ensure backend understands
            };

            const response = await fetch('/api/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create customer');
            }

            const result = await response.json();

            // Return full customer object
            await onSave(result.customer);
            onClose();
        } catch (error) {
            console.error(error);
            // In a real app, use toast here. For now, we rely on parent to show success/error or simple alert
            alert(error.message || 'Failed to save customer');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden border border-stone-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-stone-100 flex justify-between items-center bg-stone-50/80 backdrop-blur-md">
                    <div>
                        <h2 className="text-xl font-bold text-stone-900 tracking-tight">
                            {initialData ? 'Edit Customer' : 'New Customer'}
                        </h2>
                        <p className="text-xs text-stone-500 font-medium">Add details for {formData.name || 'new customer'}</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-white border border-stone-200 text-stone-700 rounded-xl hover:bg-stone-50 text-sm font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="px-5 py-2 bg-stone-900 text-white rounded-xl text-sm font-medium hover:bg-black transition-all shadow-md active:scale-[0.98] flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            Save Customer
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-4xl mx-auto space-y-8">

                        {/* 1. Identity Section */}
                        <div className="flex gap-6 items-start">
                            {/* Avatar Placeholder */}
                            <div className="w-20 h-20 bg-stone-100 rounded-2xl flex items-center justify-center border border-stone-200 text-stone-300 shadow-inner flex-shrink-0">
                                {formData.company_type === 'company' ? <Building2 size={32} /> : <User size={32} />}
                            </div>

                            <div className="flex-1 space-y-4">
                                <div className="flex gap-6">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${formData.company_type === 'company' ? 'border-stone-900 bg-stone-900' : 'border-stone-300 bg-white'}`}>
                                            {formData.company_type === 'company' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                        </div>
                                        <input
                                            type="radio"
                                            name="company_type"
                                            value="company"
                                            checked={formData.company_type === 'company'}
                                            onChange={handleInputChange}
                                            className="hidden"
                                        />
                                        <span className={`font-medium text-sm transition-colors ${formData.company_type === 'company' ? 'text-stone-900' : 'text-stone-500 group-hover:text-stone-700'}`}>Company</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${formData.company_type === 'person' ? 'border-stone-900 bg-stone-900' : 'border-stone-300 bg-white'}`}>
                                            {formData.company_type === 'person' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                        </div>
                                        <input
                                            type="radio"
                                            name="company_type"
                                            value="person"
                                            checked={formData.company_type === 'person'}
                                            onChange={handleInputChange}
                                            className="hidden"
                                        />
                                        <span className={`font-medium text-sm transition-colors ${formData.company_type === 'person' ? 'text-stone-900' : 'text-stone-500 group-hover:text-stone-700'}`}>Individual</span>
                                    </label>
                                </div>

                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder={formData.company_type === 'person' ? "Ms. Jane Doe" : "Acme Corp Ltd."}
                                    className="w-full text-3xl font-bold text-stone-900 border-b-2 border-stone-200 focus:border-stone-900 focus:outline-none py-2 placeholder:text-stone-300 bg-transparent transition-colors"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="h-px bg-stone-100 w-full" />

                        {/* 2. Main Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">

                            {/* LEFT: Address & Tax */}
                            <div className="space-y-6">
                                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2">
                                    <MapPin size={12} /> Address & Tax
                                </h3>

                                <div className="space-y-3">
                                    <input
                                        name="street"
                                        value={formData.street}
                                        onChange={handleInputChange}
                                        placeholder="Street Address..."
                                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-black/5 focus:border-stone-400 outline-none transition-all"
                                    />
                                    <input
                                        name="street2"
                                        value={formData.street2}
                                        onChange={handleInputChange}
                                        placeholder="Flat, Suite, Unit... (Optional)"
                                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-black/5 focus:border-stone-400 outline-none transition-all"
                                    />
                                    <div className="grid grid-cols-2 gap-3">
                                        <input
                                            name="city"
                                            value={formData.city}
                                            onChange={handleInputChange}
                                            placeholder="City"
                                            className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-black/5 focus:border-stone-400 outline-none transition-all"
                                        />
                                        <input
                                            name="state_id"
                                            value={formData.state_id}
                                            onChange={handleInputChange}
                                            placeholder="State"
                                            className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-black/5 focus:border-stone-400 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <input
                                            name="zip"
                                            value={formData.zip}
                                            onChange={handleInputChange}
                                            placeholder="ZIP Code"
                                            className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-black/5 focus:border-stone-400 outline-none transition-all"
                                        />
                                        <input
                                            name="country_id"
                                            value={formData.country_id}
                                            onChange={handleInputChange}
                                            placeholder="Country"
                                            className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-black/5 focus:border-stone-400 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="pt-2 space-y-3">
                                    <div className="grid grid-cols-3 items-center gap-4">
                                        <label className="text-sm font-medium text-stone-600">GSTIN</label>
                                        <input
                                            name="vat"
                                            value={formData.vat}
                                            onChange={handleInputChange}
                                            placeholder="22AAAAA0000A1Z5"
                                            className="col-span-2 px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-black/5 focus:border-stone-400 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="grid grid-cols-3 items-center gap-4">
                                        <label className="text-sm font-medium text-stone-600">PAN No.</label>
                                        <input
                                            name="l10n_in_pan"
                                            value={formData.l10n_in_pan}
                                            onChange={handleInputChange}
                                            placeholder="ABCDE1234F"
                                            className="col-span-2 px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-black/5 focus:border-stone-400 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT: Contact & Other */}
                            <div className="space-y-6">
                                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2">
                                    <Phone size={12} /> Communication
                                </h3>

                                <div className="space-y-4">
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                                        <input
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            placeholder="Email Address"
                                            className="w-full pl-9 pr-3 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-black/5 focus:border-stone-400 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                                        <input
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            placeholder="Phone Number"
                                            className="w-full pl-9 pr-3 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-black/5 focus:border-stone-400 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="relative">
                                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                                        <input
                                            name="website"
                                            value={formData.website}
                                            onChange={handleInputChange}
                                            placeholder="Website (e.g. www.example.com)"
                                            className="w-full pl-9 pr-3 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-black/5 focus:border-stone-400 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <label className="block text-sm font-medium text-stone-700 mb-2">Internal Notes</label>
                                    <textarea
                                        name="comment"
                                        value={formData.comment}
                                        onChange={handleInputChange}
                                        placeholder="Add notes about this customer..."
                                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm h-24 resize-none
                                            focus:bg-white focus:ring-2 focus:ring-black/5 focus:border-stone-400 outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 3. Child Contacts (Addresses) */}
                        <div className="border-t border-stone-100 pt-6">
                            <h3 className="text-sm font-bold text-stone-900 mb-4 flex items-center gap-2">
                                <History size={16} className="text-stone-400" />
                                Addresses & Contacts
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {childContacts.map(contact => (
                                    <div key={contact.id} className="border border-stone-200 rounded-xl p-4 relative hover:shadow-md transition-shadow bg-white flex items-start gap-4">
                                        <button
                                            onClick={() => handleRemoveContact(contact.id)}
                                            className="absolute top-3 right-3 text-stone-300 hover:text-red-500 transition-colors"
                                        >
                                            <X size={16} />
                                        </button>

                                        <div className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center text-stone-500 flex-shrink-0">
                                            {contact.type === 'invoice' ? <MapPin size={18} /> : <User size={18} />}
                                        </div>

                                        <div>
                                            <h4 className="font-bold text-stone-900 text-sm">{contact.name}</h4>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded">
                                                    {contact.type}
                                                </span>
                                            </div>
                                            <div className="text-sm text-stone-600 space-y-0.5">
                                                {contact.email && <div className="flex items-center gap-1.5"><Mail size={12} className="text-stone-400" /> {contact.email}</div>}
                                                {contact.phone && <div className="flex items-center gap-1.5"><Phone size={12} className="text-stone-400" /> {contact.phone}</div>}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Add Button */}
                                <button
                                    onClick={() => setShowAddressModal(true)}
                                    className="border-2 border-dashed border-stone-200 rounded-xl p-4 flex flex-col items-center justify-center min-h-[100px] 
                                        bg-stone-50/50 hover:bg-white hover:border-stone-300 transition-all cursor-pointer group"
                                >
                                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-stone-200 shadow-sm mb-2 group-hover:scale-110 transition-transform">
                                        <Plus size={20} className="text-stone-400 group-hover:text-stone-600" />
                                    </div>
                                    <span className="text-sm font-medium text-stone-500 group-hover:text-stone-700">Add Address / Contact</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Child Modal */}
            <PartnerAddressForm
                isOpen={showAddressModal}
                onClose={() => setShowAddressModal(false)}
                onSave={handleAddContact}
            />
        </div>
    );
}
