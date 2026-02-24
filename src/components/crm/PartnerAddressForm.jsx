import React, { useState, useEffect } from 'react';
import { X, MapPin, Phone, Mail, User } from 'lucide-react';

export default function PartnerAddressForm({ isOpen, onClose, onSave }) {
    const [formData, setFormData] = useState({
        type: 'invoice', // invoice, delivery, contact, other
        name: '',
        email: '',
        phone: '',
        mobile: '',
        street: '', street2: '', city: '', state_id: '', zip: '', country_id: 'IN',
        comment: ''
    });

    // Reset form when opened
    useEffect(() => {
        if (isOpen) {
            setFormData({
                type: 'invoice',
                name: '', email: '', phone: '', mobile: '',
                street: '', street2: '', city: '', state_id: '', zip: '', country_id: 'IN',
                comment: ''
            });
        }
    }, [isOpen]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col overflow-hidden max-h-[90vh]">
                <div className="px-6 py-4 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                    <h3 className="text-lg font-semibold text-stone-900">
                        Add Address / Contact
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full transition-colors text-stone-400 hover:text-stone-600">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-6">
                    {/* Address Type Selector */}
                    <div>
                        <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3 block">Address Type</label>
                        <div className="flex flex-wrap gap-3">
                            {[
                                { id: 'invoice', label: 'Invoice Address', icon: MapPin },
                                { id: 'delivery', label: 'Delivery Address', icon: MapPin },
                                { id: 'contact', label: 'Contact Person', icon: User },
                                { id: 'other', label: 'Other', icon: MapPin }
                            ].map(type => {
                                const Icon = type.icon;
                                const isSelected = formData.type === type.id;
                                return (
                                    <button
                                        key={type.id}
                                        onClick={() => setFormData(prev => ({ ...prev, type: type.id }))}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all
                                            ${isSelected
                                                ? 'bg-stone-900 border-stone-900 text-white shadow-md'
                                                : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300 hover:bg-stone-50'}`}
                                    >
                                        <Icon size={14} />
                                        {type.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Name & Contact */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1.5">Name</label>
                                <input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="e.g. Warehouse, Mr. John Doe"
                                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-black/5 focus:border-stone-400 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1.5">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                                    <input
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        placeholder="email@example.com"
                                        className="w-full pl-9 pr-3 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-black/5 focus:border-stone-400 outline-none transition-all"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-1.5">Phone</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                                        <input
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            className="w-full pl-9 pr-3 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-black/5 focus:border-stone-400 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-1.5">Mobile</label>
                                    <input
                                        name="mobile"
                                        value={formData.mobile}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-black/5 focus:border-stone-400 outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Address Fields */}
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-stone-700">Address</label>
                            <input
                                name="street"
                                value={formData.street}
                                onChange={handleInputChange}
                                placeholder="Street..."
                                className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-black/5 focus:border-stone-400 outline-none transition-all"
                            />
                            <input
                                name="street2"
                                value={formData.street2}
                                onChange={handleInputChange}
                                placeholder="Street 2 (Optional)..."
                                className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-black/5 focus:border-stone-400 outline-none transition-all"
                            />
                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    name="city"
                                    value={formData.city}
                                    onChange={handleInputChange}
                                    placeholder="City"
                                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-black/5 focus:border-stone-400 outline-none transition-all"
                                />
                                <input
                                    name="zip"
                                    value={formData.zip}
                                    onChange={handleInputChange}
                                    placeholder="ZIP Code"
                                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-black/5 focus:border-stone-400 outline-none transition-all"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    name="state_id"
                                    value={formData.state_id}
                                    onChange={handleInputChange}
                                    placeholder="State"
                                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-black/5 focus:border-stone-400 outline-none transition-all"
                                />
                                <input
                                    name="country_id"
                                    value={formData.country_id}
                                    onChange={handleInputChange}
                                    placeholder="Country"
                                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-black/5 focus:border-stone-400 outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1.5">Internal Notes</label>
                        <textarea
                            name="comment"
                            value={formData.comment}
                            onChange={handleInputChange}
                            placeholder="Add any additional notes..."
                            className="w-full h-20 px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm resize-none focus:ring-2 focus:ring-black/5 focus:border-stone-400 outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="p-4 border-t border-stone-100 flex justify-end gap-3 bg-stone-50/50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-white border border-stone-200 text-stone-700 rounded-xl text-sm font-medium hover:bg-stone-50 transition-colors shadow-sm"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onSave(formData)}
                        className="px-5 py-2 bg-stone-900 text-white rounded-xl text-sm font-medium hover:bg-black transition-all shadow-md active:scale-[0.98]"
                    >
                        Save Address
                    </button>
                </div>
            </div>
        </div>
    );
}
