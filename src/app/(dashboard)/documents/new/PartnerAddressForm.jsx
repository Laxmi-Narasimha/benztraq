import React, { useState } from 'react';
import { Save, X } from 'lucide-react';

const PartnerAddressForm = ({ isOpen, onClose, onSave, parentName }) => {
    const [formData, setFormData] = useState({
        type: 'invoice', // invoice, delivery, other, private
        name: '',
        email: '',
        phone: '',
        mobile: '',
        street: '', street2: '', city: '', state_id: '', zip: '', country_id: 'IN',
        comment: ''
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl flex flex-col overflow-hidden max-h-[90vh]">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="text-lg font-semibold text-gray-800">
                        Create Contact
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    {/* Address Type Radio */}
                    <div className="flex gap-4 mb-6 text-sm">
                        {['contact', 'invoice', 'delivery', 'other'].map(type => (
                            <label key={type} className="flex items-center gap-2 cursor-pointer capitalize">
                                <input
                                    type="radio"
                                    name="type"
                                    value={type}
                                    checked={formData.type === type}
                                    onChange={handleInputChange}
                                    className="text-purple-600 focus:ring-purple-500"
                                />
                                {type === 'contact' ? 'Contact' : type + ' Address'}
                            </label>
                        ))}
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                        {/* LEFT: Name & Address */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs text-gray-500 font-bold uppercase">Name</label>
                                <input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full text-lg font-medium border-b border-gray-300 focus:border-purple-600 outline-none pb-1"
                                    placeholder="Contact Name e.g. Mr. John Doe"
                                />
                            </div>

                            <div className="space-y-2 pt-2">
                                <label className="text-xs text-gray-500 font-bold uppercase">Address</label>
                                <input
                                    name="street"
                                    value={formData.street}
                                    onChange={handleInputChange}
                                    placeholder="Street..."
                                    className="w-full p-2 border border-transparent border-b-gray-300 hover:border-b-gray-400 focus:border-b-purple-500 focus:bg-gray-50 transition-colors outline-none text-sm"
                                />
                                <input
                                    name="street2"
                                    value={formData.street2}
                                    onChange={handleInputChange}
                                    placeholder="Street 2..."
                                    className="w-full p-2 border border-transparent border-b-gray-300 hover:border-b-gray-400 focus:border-b-purple-500 focus:bg-gray-50 transition-colors outline-none text-sm"
                                />
                                <div className="flex gap-2">
                                    <input
                                        name="city"
                                        value={formData.city}
                                        onChange={handleInputChange}
                                        placeholder="City"
                                        className="w-1/3 p-2 border border-transparent border-b-gray-300 hover:border-b-gray-400 focus:border-b-purple-500 outline-none text-sm"
                                    />
                                    <input
                                        name="state_id"
                                        placeholder="State"
                                        className="w-1/3 p-2 border border-transparent border-b-gray-300 hover:border-b-gray-400 focus:border-b-purple-500 outline-none text-sm"
                                    />
                                    <input
                                        name="zip"
                                        value={formData.zip}
                                        onChange={handleInputChange}
                                        placeholder="ZIP"
                                        className="w-1/3 p-2 border border-transparent border-b-gray-300 hover:border-b-gray-400 focus:border-b-purple-500 outline-none text-sm"
                                    />
                                </div>
                                <input
                                    name="country_id"
                                    value={formData.country_id}
                                    onChange={handleInputChange}
                                    placeholder="Country"
                                    className="w-full p-2 border border-transparent border-b-gray-300 hover:border-b-gray-400 focus:border-b-purple-500 outline-none text-sm"
                                />
                            </div>
                        </div>

                        {/* RIGHT: Contact Info */}
                        <div className="space-y-4 pt-6">
                            <div className="grid grid-cols-3 items-center">
                                <label className="text-sm text-gray-600">Email</label>
                                <input name="email" value={formData.email} onChange={handleInputChange} className="col-span-2 border-b border-gray-300 w-full p-1 text-sm outline-none focus:border-purple-500" />
                            </div>
                            <div className="grid grid-cols-3 items-center">
                                <label className="text-sm text-gray-600">Phone</label>
                                <input name="phone" value={formData.phone} onChange={handleInputChange} className="col-span-2 border-b border-gray-300 w-full p-1 text-sm outline-none focus:border-purple-500" />
                            </div>
                            <div className="grid grid-cols-3 items-center">
                                <label className="text-sm text-gray-600">Mobile</label>
                                <input name="mobile" value={formData.mobile} onChange={handleInputChange} className="col-span-2 border-b border-gray-300 w-full p-1 text-sm outline-none focus:border-purple-500" />
                            </div>

                            <div className="pt-4">
                                <label className="text-xs text-gray-500 uppercase block mb-2">Internal Notes</label>
                                <textarea
                                    name="comment"
                                    value={formData.comment}
                                    onChange={handleInputChange}
                                    placeholder="Notes..."
                                    className="w-full border border-gray-300 rounded p-2 text-sm h-24 focus:border-purple-500 outline-none"
                                ></textarea>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50">
                    <button onClick={() => onSave(formData)} className="px-4 py-2 bg-purple-600 text-white rounded shadow-sm hover:bg-purple-700 text-sm font-medium">
                        Save & Close
                    </button>
                    <button onClick={onClose} className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded shadow-sm hover:bg-gray-50 text-sm font-medium">
                        Discard
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PartnerAddressForm;
