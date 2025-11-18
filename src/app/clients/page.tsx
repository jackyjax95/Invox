'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, Mail, Phone, Building } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  created_at: string;
}

interface ClientUpdateData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingClient, setEditingClient] = useState<string | null>(null);
  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: '',
  });

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch('/api/clients');
        if (!response.ok) {
          throw new Error('Failed to fetch clients');
        }
        const data = await response.json();
        setClients(data.clients || []);
      } catch (err) {
        console.error('Error fetching clients:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  const filteredClients = clients.filter(client => {
    return client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (client.company && client.company.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newClient.name || !newClient.email) {
      alert('Please fill in at least name and email');
      return;
    }

    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newClient,
          user_id: 'demo-user', // Demo user ID for MVP
          created_at: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        const addedClient = await response.json();
        setClients(prev => [...prev, addedClient]);
        setNewClient({
          name: '',
          email: '',
          phone: '',
          company: '',
          address: '',
        });
        setShowAddForm(false);
        alert('Client added successfully!');
      } else {
        const errorData = await response.json();
        alert(`Error adding client: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error adding client:', error);
      alert('Error adding client. Please try again.');
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm('Are you sure you want to delete this client?')) {
      return;
    }

    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setClients(prev => prev.filter(client => client.id !== clientId));
        alert('Client deleted successfully!');
      } else {
        alert('Error deleting client');
      }
    } catch (error) {
      console.error('Error deleting client:', error);
      alert('Error deleting client. Please try again.');
    }
  };

  const handleEditClient = (clientId: string) => {
    setEditingClient(clientId);
  };

  const handleUpdateClient = async (clientId: string, updatedClient: ClientUpdateData) => {
    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedClient),
      });

      if (response.ok) {
        const updated = await response.json();
        setClients(prev => prev.map(client =>
          client.id === clientId ? updated : client
        ));
        setEditingClient(null);
        alert('Client updated successfully!');
      } else {
        const errorData = await response.json();
        alert(`Error updating client: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error updating client:', error);
      alert('Error updating client. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f1f5] p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-pulse text-foreground">Loading clients...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f1f5] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-black mb-2">Clients</h1>
              <p className="text-gray-600">Manage your client database</p>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-gradient-primary text-white px-6 py-3 rounded-lg hover:from-primary-dark hover:to-primary transition-all inline-flex items-center gap-2 shadow-lg"
            >
              <Plus size={20} />
              Add Client
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 placeholder-gray-600"
            />
          </div>
        </div>

        {/* Add Client Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-black">Add New Client</h2>
            <form onSubmit={handleAddClient} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={newClient.name}
                    onChange={(e) => setNewClient(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-[#868d94]"
                    placeholder="Client name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={newClient.email}
                    onChange={(e) => setNewClient(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-[#868d94]"
                    placeholder="client@example.com"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={newClient.phone}
                    onChange={(e) => setNewClient(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-[#868d94]"
                    placeholder="+27 12 345 6789"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company
                  </label>
                  <input
                    type="text"
                    value={newClient.company}
                    onChange={(e) => setNewClient(prev => ({ ...prev, company: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-[#868d94]"
                    placeholder="Company name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  value={newClient.address}
                  onChange={(e) => setNewClient(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-[#868d94]"
                  rows={3}
                  placeholder="Street address, city, postal code"
                />
              </div>

              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-secondary text-white px-6 py-2 rounded-lg hover:bg-accent transition-colors flex items-center gap-2"
                >
                  <Plus size={20} />
                  Add Client
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Clients List */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {clients.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {filteredClients.map((client) => (
                <div key={client.id} className="p-6 hover:bg-gray-50 transition-colors">
                  {editingClient === client.id ? (
                    // Edit Form
                    <ClientEditForm
                      client={client}
                      onSave={(updatedClient) => handleUpdateClient(client.id, updatedClient)}
                      onCancel={() => setEditingClient(null)}
                    />
                  ) : (
                    // Display Mode
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                            <Building size={20} className="text-primary" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{client.name}</h3>
                            {client.company && (
                              <p className="text-gray-600">{client.company}</p>
                            )}
                            <div className="flex items-center gap-4 mt-2">
                              <div className="flex items-center gap-1 text-sm text-gray-500">
                                <Mail size={14} />
                                {client.email}
                              </div>
                              {client.phone && (
                                <div className="flex items-center gap-1 text-sm text-gray-500">
                                  <Phone size={14} />
                                  {client.phone}
                                </div>
                              )}
                            </div>
                            {client.address && (
                              <p className="text-sm text-gray-500 mt-1">{client.address}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditClient(client.id)}
                          className="text-blue-600 hover:text-blue-800 p-2 rounded transition-colors"
                          title="Edit Client"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteClient(client.id)}
                          className="text-red-600 hover:text-red-800 p-2 rounded transition-colors"
                          title="Delete Client"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No clients found</h3>
              <p className="text-gray-500 mb-6">
                {searchTerm
                  ? 'Try adjusting your search criteria.'
                  : 'Start building your client database by adding your first client!'
                }
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-gradient-accent text-white px-8 py-3 rounded-lg hover:from-accent hover:to-secondary transition-all inline-flex items-center gap-2 shadow-lg"
              >
                <Plus size={20} />
                Add Your First Client
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Client Edit Form Component
function ClientEditForm({
  client,
  onSave,
  onCancel
}: {
  client: Client;
  onSave: (updatedClient: ClientUpdateData) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: client.name,
    email: client.email,
    phone: client.phone || '',
    company: client.company || '',
    address: client.address || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email) {
      alert('Please fill in at least name and email');
      return;
    }

    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-gray-900"
            placeholder="Client name"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-gray-900"
            placeholder="client@example.com"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-gray-900"
            placeholder="+27 12 345 6789"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Company
          </label>
          <input
            type="text"
            value={formData.company}
            onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-gray-900"
            placeholder="Company name"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Address
        </label>
        <textarea
          value={formData.address}
          onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-gray-900"
          rows={3}
          placeholder="Street address, city, postal code"
        />
      </div>

      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Edit size={16} />
          Save Changes
        </button>
      </div>
    </form>
  );
}