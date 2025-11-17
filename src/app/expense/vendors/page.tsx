'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Search, Edit, Trash2, Building, Phone, Mail, MapPin } from 'lucide-react';

interface Vendor {
  id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  category?: string;
  vatRegistration?: string;
  companyRegistration?: string;
  notes?: string;
  created_at: string;
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    category: '',
    vatRegistration: '',
    companyRegistration: '',
    notes: '',
  });

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      // Load from localStorage first, then fall back to mock data
      const storedVendors = localStorage.getItem('smart-invoice-vendors-full');
      if (storedVendors) {
        setVendors(JSON.parse(storedVendors));
      } else {
        // Mock data for now - in production this would fetch from API
        const mockVendors: Vendor[] = [
          {
            id: '1',
            name: 'DNS Supplies',
            contactPerson: 'John Smith',
            email: 'john@dnssupplies.co.za',
            phone: '+27 21 123 4567',
            address: '123 Main Street, Cape Town, 8001',
            category: 'Office Supplies',
            notes: 'Reliable supplier for office stationery',
            created_at: new Date().toISOString(),
          },
          {
            id: '2',
            name: 'Tech Solutions Inc',
            contactPerson: 'Sarah Johnson',
            email: 'sarah@techsolutions.co.za',
            phone: '+27 11 987 6543',
            address: '456 Business Park, Johannesburg, 2001',
            category: 'Software & Tools',
            notes: 'IT equipment and software licenses',
            created_at: new Date().toISOString(),
          },
        ];
        setVendors(mockVendors);
        localStorage.setItem('smart-invoice-vendors-full', JSON.stringify(mockVendors));
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredVendors = vendors.filter(vendor =>
    vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Vendor name is required');
      return;
    }

    if (!formData.phone.trim()) {
      alert('Phone number is required');
      return;
    }

    try {
      if (editingVendor) {
        // Update existing vendor
        const updatedVendor = {
          ...editingVendor,
          ...formData,
        };
        const updatedVendors = vendors.map(v => v.id === editingVendor.id ? updatedVendor : v);
        setVendors(updatedVendors);
        localStorage.setItem('smart-invoice-vendors-full', JSON.stringify(updatedVendors));

        // Also update the simple vendor list for expense form
        const simpleVendors = updatedVendors.map(v => ({ id: v.id, name: v.name }));
        localStorage.setItem('smart-invoice-vendors', JSON.stringify(simpleVendors));
      } else {
        // Add new vendor
        const newVendor: Vendor = {
          id: Date.now().toString(),
          ...formData,
          created_at: new Date().toISOString(),
        };
        const updatedVendors = [...vendors, newVendor];
        setVendors(updatedVendors);
        localStorage.setItem('smart-invoice-vendors-full', JSON.stringify(updatedVendors));

        // Also update the simple vendor list for expense form
        const simpleVendors = updatedVendors.map(v => ({ id: v.id, name: v.name }));
        localStorage.setItem('smart-invoice-vendors', JSON.stringify(simpleVendors));
      }

      // Reset form
      setFormData({
        name: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: '',
        category: '',
        notes: '',
      });
      setShowAddForm(false);
      setEditingVendor(null);
    } catch (error) {
      console.error('Error saving vendor:', error);
      alert('Error saving vendor. Please try again.');
    }
  };

  const handleEdit = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setFormData({
      name: vendor.name,
      contactPerson: vendor.contactPerson || '',
      email: vendor.email || '',
      phone: vendor.phone || '',
      address: vendor.address || '',
      category: vendor.category || '',
      vatRegistration: vendor.vatRegistration || '',
      companyRegistration: vendor.companyRegistration || '',
      notes: vendor.notes || '',
    });
    setShowAddForm(true);
  };

  const handleDelete = async (vendorId: string) => {
    if (confirm('Are you sure you want to delete this vendor?')) {
      const updatedVendors = vendors.filter(v => v.id !== vendorId);
      setVendors(updatedVendors);
      localStorage.setItem('smart-invoice-vendors-full', JSON.stringify(updatedVendors));

      // Also update the simple vendor list for expense form
      const simpleVendors = updatedVendors.map(v => ({ id: v.id, name: v.name }));
      localStorage.setItem('smart-invoice-vendors', JSON.stringify(simpleVendors));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      category: '',
      vatRegistration: '',
      companyRegistration: '',
      notes: '',
    });
    setShowAddForm(false);
    setEditingVendor(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-pulse text-foreground">Loading vendors...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link
            href="/expense"
            className="inline-flex items-center text-primary hover:text-primary-dark mb-4"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Expenses
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <Building className="text-primary" size={32} />
                Vendor Management
              </h1>
              <p className="text-gray-600 mt-2">Manage your business vendor contacts and details</p>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-gradient-secondary text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition-all inline-flex items-center gap-2 shadow-lg"
            >
              <Plus size={20} />
              Add Vendor
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="relative max-w-md">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search vendors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-black placeholder-gray-600"
            />
          </div>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingVendor ? 'Edit Vendor' : 'Add New Vendor'}
              </h2>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vendor Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-colors text-gray-900 placeholder-gray-600"
                    placeholder="Enter vendor name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-colors text-gray-900 placeholder-gray-600"
                    placeholder="Primary contact person"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-colors text-gray-900 placeholder-gray-600"
                    placeholder="vendor@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-colors text-gray-900 placeholder-gray-600"
                    placeholder="+27 21 123 4567"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-colors text-gray-900"
                  >
                    <option value="">Select category</option>
                    <option value="Office Supplies">Office Supplies</option>
                    <option value="Travel">Travel</option>
                    <option value="Meals & Entertainment">Meals & Entertainment</option>
                    <option value="Software & Tools">Software & Tools</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Professional Services">Professional Services</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-colors text-gray-900 placeholder-gray-600"
                    placeholder="Street address, city, postal code"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    VAT Registration Number
                  </label>
                  <input
                    type="text"
                    value={formData.vatRegistration}
                    onChange={(e) => setFormData(prev => ({ ...prev, vatRegistration: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-colors text-gray-900 placeholder-gray-600"
                    placeholder="e.g. 4123456789"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Registration Number
                  </label>
                  <input
                    type="text"
                    value={formData.companyRegistration}
                    onChange={(e) => setFormData(prev => ({ ...prev, companyRegistration: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-colors text-gray-900 placeholder-gray-600"
                    placeholder="e.g. 2023/123456/07"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-colors text-gray-900 placeholder-gray-600"
                  placeholder="Additional notes about this vendor..."
                />
              </div>

              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-gradient-secondary text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-lg"
                >
                  {editingVendor ? 'Update Vendor' : 'Add Vendor'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Vendors List */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {filteredVendors.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {filteredVendors.map((vendor) => (
                <div key={vendor.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                            <Building className="text-white" size={24} />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">{vendor.name}</h3>
                          {vendor.contactPerson && (
                            <p className="text-gray-600 mb-2">{vendor.contactPerson}</p>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                            {vendor.email && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Mail size={16} />
                                <a href={`mailto:${vendor.email}`} className="hover:text-primary">
                                  {vendor.email}
                                </a>
                              </div>
                            )}
                            {vendor.phone && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Phone size={16} />
                                <a href={`tel:${vendor.phone}`} className="hover:text-primary">
                                  {vendor.phone}
                                </a>
                              </div>
                            )}
                          </div>

                          {vendor.address && (
                            <div className="flex items-start gap-2 text-sm text-gray-600 mb-3">
                              <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                              <span>{vendor.address}</span>
                            </div>
                          )}

                          <div className="flex items-center gap-4">
                            {vendor.category && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {vendor.category}
                              </span>
                            )}
                            <span className="text-sm text-gray-500">
                              Added {new Date(vendor.created_at).toLocaleDateString('en-GB')}
                            </span>
                          </div>

                          {vendor.notes && (
                            <p className="text-sm text-gray-600 mt-2 italic">{vendor.notes}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleEdit(vendor)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit vendor"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(vendor.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete vendor"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🏢</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No vendors found</h3>
              <p className="text-gray-500 mb-6">
                {searchTerm ? 'Try adjusting your search criteria.' : 'Start building your vendor database!'}
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-gradient-secondary text-white px-8 py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition-all inline-flex items-center gap-2 shadow-lg"
              >
                <Plus size={20} />
                Add Your First Vendor
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}