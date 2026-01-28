import React, { useState, useEffect } from 'react';
import {
    User, Building2, MapPin, Phone, Mail, Globe,
    MoreHorizontal, Plus, Trash2, CreditCard,
    FileText, Save, X
} from 'lucide-react';
import PartnerAddressForm from './PartnerAddressForm';

// Tabs Component (Simplified for internal use)
const Tabs = ({ activeTab, onTabChange, children }) => (
    <div className="border-b border-gray-200 mb-4">
        <div className="flex space-x-6">
            {children}
        </div>
    </div>
);

const Tab = ({ label, name, activeTab, onClick }) => (
    <button
        type="button"
        onClick={() => onClick(name)}
        className={`pb-2 text-sm font-medium border-b-2 transition-colors duration-200 ${activeTab === name
            ? 'border-purple-600 text-purple-600'
            : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
    >
        {label}
    </button>
);

const OdooPartnerForm = ({ isOpen, onClose, onSave, initialName = '', initialData = null }) => {
    const [activeTab, setActiveTab] = useState('contacts');
    const [loading, setLoading] = useState(false);

    // Child Contact State
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [childContacts, setChildContacts] = useState([]); // Array of contact objects

    // Main Form State
    const [formData, setFormData] = useState({
        company_type: 'company', // 'person' or 'company'
        name: initialName,
        parent_id: null, // For individuals linked to company

        // Address
        street: '', street2: '', city: '', state_id: '', zip: '', country_id: 'IN',

        // Tax
        l10n_in_gst_treatment: 'consumer',
        vat: '', // GSTIN
        l10n_in_pan: '',

        // Communication
        phone: '', mobile: '', email: '', website: '',
        category_ids: [], // Tags

        // Business Properties
        property_payment_term_id: '',
        property_product_pricelist: '',
        property_account_position_id: '',
        user_id: '', // Salesperson

        // Notes
        comment: ''
    });

    useEffect(() => {
        if (initialName) setFormData(prev => ({ ...prev, name: initialName }));
    }, [initialName]);

    // Handle adding a new child contact
    const handleAddContact = (contactData) => {
        setChildContacts(prev => [...prev, { ...contactData, id: Date.now() }]); // Temp ID
        setShowAddressModal(false);
    };

    // Remove child contact
    const handleRemoveContact = (id) => {
        setChildContacts(prev => prev.filter(c => c.id !== id));
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            // Include child contacts in the payload
            const payload = {
                ...formData,
                child_ids: childContacts
            };

            // Call API to save
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

            // Notify parent with the created/saved customer object (from DB)
            await onSave(result.customer);
            onClose();
        } catch (error) {
            console.error(error);
            alert(error.message || 'Failed to save customer');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
                {/* Header / Toolbar */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className="font-semibold text-gray-700">New Customer</span> / {formData.name || 'Untitled'}
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleSave} disabled={loading} className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700 flex items-center gap-2">
                            <Save size={16} /> Save
                        </button>
                        <button onClick={onClose} className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-md text-sm hover:bg-gray-50">
                            Discard
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8">
                    {/* Top Section: Toggle & Main Fields */}
                    <div className="mb-8">
                        {/* Company Type Toggle */}
                        <div className="flex gap-6 mb-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="company_type"
                                    value="person"
                                    checked={formData.company_type === 'person'}
                                    onChange={handleInputChange}
                                    className="text-purple-600 focus:ring-purple-500"
                                />
                                <span className="text-gray-700 font-medium">Individual</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="company_type"
                                    value="company"
                                    checked={formData.company_type === 'company'}
                                    onChange={handleInputChange}
                                    className="text-purple-600 focus:ring-purple-500"
                                />
                                <span className="text-gray-700 font-medium">Company</span>
                            </label>
                        </div>

                        {/* Name & Avatar Area */}
                        <div className="flex gap-6 mb-8">
                            <div className="flex-1">
                                {formData.company_type === 'person' && (
                                    <div className="mb-2">
                                        <input
                                            type="text"
                                            placeholder="Company Name..."
                                            className="w-full border-b border-gray-300 focus:border-purple-500 focus:outline-none py-1 text-gray-600 text-sm"
                                        />
                                    </div>
                                )}
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder={formData.company_type === 'person' ? "e.g. Brandom Freeman" : "e.g. Lumber Inc"}
                                    className="w-full text-3xl font-bold text-gray-900 border-b border-gray-300 focus:border-purple-600 focus:outline-none py-2 placeholder-gray-300"
                                />
                                {formData.company_type === 'person' && (
                                    <div className="mt-2">
                                        <input
                                            type="text"
                                            name="function"
                                            placeholder="Job Position e.g. Sales Director"
                                            className="w-full border-b border-gray-300 focus:border-purple-500 focus:outline-none py-1 text-gray-600 text-sm"
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="w-24 h-24 bg-gray-100 rounded-md flex items-center justify-center text-gray-300 border border-gray-200">
                                {formData.company_type === 'company' ? <Building2 size={40} /> : <User size={40} />}
                            </div>
                        </div>

                        {/* Main Grid: Address vs Communication */}
                        <div className="grid grid-cols-2 gap-12">
                            {/* LEFT COLUMN: Address & Tax */}
                            <div className="space-y-6">
                                {/* Address Group */}
                                <div className="space-y-2">
                                    <input
                                        name="street"
                                        value={formData.street}
                                        onChange={handleInputChange}
                                        placeholder="Street..."
                                        className="w-full p-2 border border-transparent border-b-gray-300 hover:border-b-gray-400 focus:border-b-purple-500 focus:bg-gray-50 transition-colors outline-none"
                                    />
                                    <input
                                        name="street2"
                                        value={formData.street2}
                                        onChange={handleInputChange}
                                        placeholder="Street 2..."
                                        className="w-full p-2 border border-transparent border-b-gray-300 hover:border-b-gray-400 focus:border-b-purple-500 focus:bg-gray-50 transition-colors outline-none"
                                    />
                                    <div className="flex gap-2">
                                        <input
                                            name="city"
                                            value={formData.city}
                                            onChange={handleInputChange}
                                            placeholder="City"
                                            className="w-1/3 p-2 border border-transparent border-b-gray-300 hover:border-b-gray-400 focus:border-b-purple-500 outline-none"
                                        />
                                        <input
                                            name="state_id"
                                            placeholder="State"
                                            className="w-1/3 p-2 border border-transparent border-b-gray-300 hover:border-b-gray-400 focus:border-b-purple-500 outline-none"
                                        />
                                        <input
                                            name="zip"
                                            value={formData.zip}
                                            onChange={handleInputChange}
                                            placeholder="ZIP"
                                            className="w-1/3 p-2 border border-transparent border-b-gray-300 hover:border-b-gray-400 focus:border-b-purple-500 outline-none"
                                        />
                                    </div>
                                    <input
                                        name="country_id"
                                        value={formData.country_id}
                                        onChange={handleInputChange}
                                        placeholder="Country"
                                        className="w-full p-2 border border-transparent border-b-gray-300 hover:border-b-gray-400 focus:border-b-purple-500 outline-none"
                                    />
                                </div>

                                {/* Tax ID Group */}
                                <div className="space-y-3 pt-4">
                                    <div className="grid grid-cols-3 items-center">
                                        <label className="text-sm font-semibold text-gray-700">GST Treatment</label>
                                        <div className="col-span-2">
                                            <select
                                                name="l10n_in_gst_treatment"
                                                value={formData.l10n_in_gst_treatment}
                                                onChange={handleInputChange}
                                                className="w-full p-1 border-b border-gray-300 focus:border-purple-500 outline-none bg-transparent"
                                            >
                                                <option value="consumer">Consumer</option>
                                                <option value="regular">Registered Business - Regular</option>
                                                <option value="composition">Registered Business - Composition</option>
                                                <option value="unregistered">Unregistered Business</option>
                                                <option value="overseas">Overseas</option>
                                                <option value="special_economic_zone">Special Economic Zone</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 items-center">
                                        <label className="text-sm font-semibold text-gray-700">GSTIN</label>
                                        <input
                                            name="vat"
                                            value={formData.vat}
                                            onChange={handleInputChange}
                                            placeholder="e.g. 22AAAAA0000A1Z5"
                                            className="col-span-2 w-full p-1 border-b border-gray-300 focus:border-purple-500 outline-none"
                                        />
                                    </div>
                                    <div className="grid grid-cols-3 items-center">
                                        <label className="text-sm font-semibold text-gray-700">PAN</label>
                                        <input
                                            name="l10n_in_pan"
                                            value={formData.l10n_in_pan}
                                            onChange={handleInputChange}
                                            placeholder="e.g. AAAAA0000A"
                                            className="col-span-2 w-full p-1 border-b border-gray-300 focus:border-purple-500 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT COLUMN: Communication */}
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="flex items-center gap-4">
                                        <Phone size={18} className="text-gray-400" />
                                        <div className="flex-1">
                                            <label className="text-xs text-gray-500 block">Phone</label>
                                            <input
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                className="w-full border-b border-gray-300 focus:border-purple-500 outline-none py-1"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Phone size={18} className="text-gray-400" />
                                        <div className="flex-1">
                                            <label className="text-xs text-gray-500 block">Mobile</label>
                                            <input
                                                name="mobile"
                                                value={formData.mobile}
                                                onChange={handleInputChange}
                                                className="w-full border-b border-gray-300 focus:border-purple-500 outline-none py-1"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Mail size={18} className="text-gray-400" />
                                        <div className="flex-1">
                                            <label className="text-xs text-gray-500 block">Email</label>
                                            <input
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                className="w-full border-b border-gray-300 focus:border-purple-500 outline-none py-1"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Globe size={18} className="text-gray-400" />
                                        <div className="flex-1">
                                            <label className="text-xs text-gray-500 block">Website</label>
                                            <input
                                                name="website"
                                                value={formData.website}
                                                onChange={handleInputChange}
                                                placeholder="e.g. https://www.odoo.com"
                                                className="w-full border-b border-gray-300 focus:border-purple-500 outline-none py-1 text-blue-600"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* TABS SECTION */}
                    <Tabs activeTab={activeTab}>
                        <Tab name="contacts" label="Contacts & Addresses" activeTab={activeTab} onClick={setActiveTab} />
                        <Tab name="sales_purchase" label="Sales & Purchase" activeTab={activeTab} onClick={setActiveTab} />
                        <Tab name="accounting" label="Accounting" activeTab={activeTab} onClick={setActiveTab} />
                        <Tab name="notes" label="Internal Notes" activeTab={activeTab} onClick={setActiveTab} />
                    </Tabs>

                    <div className="mt-6">
                        {activeTab === 'contacts' && (
                            <div className="space-y-4">
                                {childContacts.length === 0 ? (
                                    <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
                                        <button
                                            onClick={() => setShowAddressModal(true)}
                                            className="px-4 py-2 border border-gray-300 bg-white rounded shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                                        >
                                            Add
                                        </button>
                                        <p className="mt-2 text-sm text-gray-500">Contact addresses for this partner</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-4">
                                        {childContacts.map(contact => (
                                            <div key={contact.id} className="border border-gray-200 rounded p-4 relative hover:shadow-md transition-shadow bg-white">
                                                <button
                                                    onClick={() => handleRemoveContact(contact.id)}
                                                    className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                                                >
                                                    <X size={16} />
                                                </button>
                                                <div className="flex items-start gap-3">
                                                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                                                        <User size={20} />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-gray-900 text-sm">{contact.name}</h4>
                                                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{contact.type}</p>
                                                        <div className="text-sm text-gray-600 space-y-0.5">
                                                            {contact.email && <div className="flex items-center gap-1"><Mail size={12} /> {contact.email}</div>}
                                                            {contact.phone && <div className="flex items-center gap-1"><Phone size={12} /> {contact.phone}</div>}
                                                            <div className="flex items-center gap-1 opacity-75">
                                                                <MapPin size={12} />
                                                                <span className="truncate max-w-[200px]">{[contact.city, contact.state_id].filter(Boolean).join(', ')}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {/* Add Card */}
                                        <div className="border-2 border-dashed border-gray-200 rounded p-4 flex flex-col items-center justify-center min-h-[120px] bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => setShowAddressModal(true)}>
                                            <Plus size={24} className="text-gray-400 mb-2" />
                                            <span className="text-sm text-gray-500 font-medium">Add Contact</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'sales_purchase' && (
                            <div className="grid grid-cols-2 gap-12">
                                {/* SALES */}
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b pb-1">Sales</h3>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-3 items-center">
                                            <label className="text-sm text-gray-600">Salesperson</label>
                                            <input className="col-span-2 border-b border-gray-300 w-full p-1" />
                                        </div>
                                        <div className="grid grid-cols-3 items-center">
                                            <label className="text-sm text-gray-600">Payment Terms</label>
                                            <select className="col-span-2 border-b border-gray-300 w-full p-1 bg-transparent">
                                                <option>Immediate Payment</option>
                                                <option>15 Days</option>
                                                <option>30 Days</option>
                                            </select>
                                        </div>
                                        <div className="grid grid-cols-3 items-center">
                                            <label className="text-sm text-gray-600">Pricelist</label>
                                            <select className="col-span-2 border-b border-gray-300 w-full p-1 bg-transparent">
                                                <option>Public Pricelist</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* PURCHASE */}
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b pb-1">Purchase</h3>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-3 items-center">
                                            <label className="text-sm text-gray-600">Payment Terms</label>
                                            <select className="col-span-2 border-b border-gray-300 w-full p-1 bg-transparent">
                                                <option>Information unavailable</option>
                                            </select>
                                        </div>
                                        <div className="grid grid-cols-3 items-center">
                                            <label className="text-sm text-gray-600">Payment Method</label>
                                            <select className="col-span-2 border-b border-gray-300 w-full p-1 bg-transparent">
                                                <option>Manual</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'accounting' && (
                            <div className="space-y-8">
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Bank Accounts</h3>
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-2">Account Number</th>
                                                <th className="px-4 py-2">Bank</th>
                                                <th className="px-4 py-2">Send Money</th>
                                                <th className="px-4 py-2"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td colSpan="4" className="px-4 py-4 text-center text-gray-500 italic">
                                                    <button className="text-purple-600 hover:underline">Add a line</button>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                <div className="grid grid-cols-2 gap-12">
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b pb-1">Accounting Entries</h3>
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-3 items-center">
                                                <label className="text-sm text-gray-600">Receivable</label>
                                                <input className="col-span-2 border-b border-gray-300 w-full p-1" value="110100 Account Receivable" readOnly />
                                            </div>
                                            <div className="grid grid-cols-3 items-center">
                                                <label className="text-sm text-gray-600">Payable</label>
                                                <input className="col-span-2 border-b border-gray-300 w-full p-1" value="210100 Account Payable" readOnly />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'notes' && (
                            <div>
                                <textarea
                                    name="comment"
                                    value={formData.comment}
                                    onChange={handleInputChange}
                                    placeholder="Internal notes..."
                                    className="w-full h-40 p-4 border border-gray-300 rounded focus:border-purple-500 outline-none"
                                ></textarea>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/* Child Contact Modal */}
            <PartnerAddressForm
                isOpen={showAddressModal}
                onClose={() => setShowAddressModal(false)}
                onSave={handleAddContact}
            />
        </div>
    );
};

export default OdooPartnerForm;
